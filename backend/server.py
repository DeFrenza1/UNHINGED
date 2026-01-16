from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'unhinged-super-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Create the main app
app = FastAPI(title="Unhinged API", description="Dating for the Flawed & Chaotic")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer(auto_error=False)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    # Identity & basics
    display_name: Optional[str] = None
    picture: Optional[str] = None
    age: Optional[int] = None
    bio: Optional[str] = None
    gender_identity: Optional[str] = None
    pronouns: Optional[str] = None
    sexuality: Optional[str] = None
    interested_in: List[str] = []
    # Location
    location: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    # Lifestyle
    height_cm: Optional[int] = None
    drinking: Optional[str] = None
    smoking: Optional[str] = None
    cannabis: Optional[str] = None
    drugs: Optional[str] = None
    religion: Optional[str] = None
    politics: Optional[str] = None
    exercise: Optional[str] = None
    diet: Optional[str] = None
    has_kids: Optional[str] = None
    wants_kids: Optional[str] = None
    relationship_type: Optional[str] = None
    # Red flags & prompts
    red_flags: List[str] = []
    dealbreaker_red_flags: List[str] = []
    negative_qualities: List[str] = []
    photos: List[str] = []
    worst_photo_caption: Optional[str] = None
    prompts: List[Dict[str, str]] = []
    # What they are looking for
    looking_for: Optional[str] = None
    # Match preferences
    pref_age_min: Optional[int] = None
    pref_age_max: Optional[int] = None
    pref_genders: List[str] = []
    pref_distance_km: Optional[int] = None
    pref_wants_kids: Optional[str] = None
    pref_relationship_type: Optional[str] = None
    # Meta
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    profile_complete: bool = False

class ProfileUpdate(BaseModel):
    # Identity & basics
    name: Optional[str] = None
    display_name: Optional[str] = None
    age: Optional[int] = None
    bio: Optional[str] = None
    gender_identity: Optional[str] = None
    pronouns: Optional[str] = None
    sexuality: Optional[str] = None
    interested_in: Optional[List[str]] = None
    # Location
    location: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    # Lifestyle
    height_cm: Optional[int] = None
    drinking: Optional[str] = None
    smoking: Optional[str] = None
    cannabis: Optional[str] = None
    drugs: Optional[str] = None
    religion: Optional[str] = None
    politics: Optional[str] = None
    exercise: Optional[str] = None
    diet: Optional[str] = None
    has_kids: Optional[str] = None
    wants_kids: Optional[str] = None
    relationship_type: Optional[str] = None
    # Red flags & prompts
    red_flags: Optional[List[str]] = None
    dealbreaker_red_flags: Optional[List[str]] = None
    negative_qualities: Optional[List[str]] = None
    photos: Optional[List[str]] = None
    worst_photo_caption: Optional[str] = None
    prompts: Optional[List[Dict[str, str]]] = None
    # What they are looking for
    looking_for: Optional[str] = None
    # Match preferences
    pref_age_min: Optional[int] = None
    pref_age_max: Optional[int] = None
    pref_genders: Optional[List[str]] = None
    pref_distance_km: Optional[int] = None
    pref_wants_kids: Optional[str] = None
    pref_relationship_type: Optional[str] = None
    # Avatar
    picture: Optional[str] = None

class SwipeAction(BaseModel):
    target_user_id: str
    action: str  # "like" or "pass"

class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    match_id: str
    user1_id: str
    user2_id: str
    created_at: datetime
    last_message_at: Optional[datetime] = None

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str
    match_id: str
    sender_id: str
    content: str
    created_at: datetime

class MessageCreate(BaseModel):
    content: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request, credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    # Check for session_token cookie first (Google Auth)
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            expires_at = session.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    return user
    
    # Check for Bearer token (JWT Auth)
    if credentials:
        payload = decode_jwt_token(credentials.credentials)
        user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
        if user:
            return user
    
    # Check Authorization header directly
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            payload = decode_jwt_token(token)
            user = await db.users.find_one({"user_id": payload["sub"]}, {"_id": 0})
            if user:
                return user
        except Exception:
            # Try as session token
            session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
            if session:
                expires_at = session.get("expires_at")
                if isinstance(expires_at, str):
                    expires_at = datetime.fromisoformat(expires_at)
                if expires_at.tzinfo is None:
                    expires_at = expires_at.replace(tzinfo=timezone.utc)
                if expires_at > datetime.now(timezone.utc):
                    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                    if user:
                        return user
    
    raise HTTPException(status_code=401, detail="Not authenticated")

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_pw = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hashed_pw,
        # Identity & basics
        "display_name": None,
        "picture": None,
        "age": None,
        "bio": None,
        "gender_identity": None,
        "pronouns": None,
        "sexuality": None,
        "interested_in": [],
        # Location
        "location": None,
        "city": None,
        "country": None,
        # Lifestyle
        "height_cm": None,
        "drinking": None,
        "smoking": None,
        "cannabis": None,
        "drugs": None,
        "religion": None,
        "politics": None,
        "exercise": None,
        "diet": None,
        "has_kids": None,
        "wants_kids": None,
        "relationship_type": None,
        # Red flags & prompts
        "red_flags": [],
        "dealbreaker_red_flags": [],
        "negative_qualities": [],
        "photos": [],
        "worst_photo_caption": None,
        "prompts": [],
        # What they are looking for
        "looking_for": None,
        # Match preferences
        "pref_age_min": None,
        "pref_age_max": None,
        "pref_genders": [],
        "pref_distance_km": None,
        "pref_wants_kids": None,
        "pref_relationship_type": None,
        # Meta
        "created_at": datetime.now(timezone.utc).isoformat(),
        "profile_complete": False
    }
    
    await db.users.insert_one(user_doc)
    token = create_jwt_token(user_id, user_data.email)
    
    # Get user without _id field to avoid ObjectId serialization issues
    user_response = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["user_id"], user["email"])
    user_response = {k: v for k, v in user.items() if k != "password_hash"}
    return TokenResponse(access_token=token, user=user_response)

@api_router.post("/auth/session")
async def create_session_from_google(request: Request, response: Response):
    """Exchange session_id from Google OAuth for session_token"""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session ID")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as http_client:
        auth_response = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if auth_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        auth_data = auth_response.json()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": auth_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user info if needed
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": auth_data["name"], "picture": auth_data.get("picture")}}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": auth_data["email"],
            "name": auth_data["name"],
            # Identity & basics
            "display_name": auth_data.get("name"),
            "picture": auth_data.get("picture"),
            "age": None,
            "bio": None,
            "gender_identity": None,
            "pronouns": None,
            "sexuality": None,
            "interested_in": [],
            # Location
            "location": None,
            "city": None,
            "country": None,
            # Lifestyle
            "height_cm": None,
            "drinking": None,
            "smoking": None,
            "cannabis": None,
            "drugs": None,
            "religion": None,
            "politics": None,
            "exercise": None,
            "diet": None,
            "has_kids": None,
            "wants_kids": None,
            "relationship_type": None,
            # Red flags & prompts
            "red_flags": [],
            "dealbreaker_red_flags": [],
            "negative_qualities": [],
            "photos": [],
            "worst_photo_caption": None,
            "prompts": [],
            # What they are looking for
            "looking_for": None,
            # Match preferences
            "pref_age_min": None,
            "pref_age_max": None,
            "pref_genders": [],
            "pref_distance_km": None,
            "pref_wants_kids": None,
            "pref_relationship_type": None,
            # Meta
            "created_at": datetime.now(timezone.utc).isoformat(),
            "profile_complete": False
        }
        await db.users.insert_one(user_doc)
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    return {"session_token": session_token, "user": user}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_response = {k: v for k, v in current_user.items() if k != "password_hash"}
    return user_response

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ==================== PROFILE ROUTES ====================

@api_router.get("/profile", response_model=UserProfile)
async def get_profile(current_user: dict = Depends(get_current_user)):
    user_response = {k: v for k, v in current_user.items() if k != "password_hash"}
    if isinstance(user_response.get("created_at"), str):
        user_response["created_at"] = datetime.fromisoformat(user_response["created_at"])
    return UserProfile(**user_response)

@api_router.put("/profile")
async def update_profile(update: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    
    if update_data:
        # Check if profile is now complete
        user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0})
        merged = {**user, **update_data}
        
        # Profile is complete if has at least one red flag, one photo, and basic info
        is_complete = (
            len(merged.get("red_flags", [])) > 0 and
            len(merged.get("photos", [])) > 0 and
            merged.get("age") is not None and
            merged.get("bio") is not None and merged.get("bio") != ""
        )
        update_data["profile_complete"] = is_complete
        
        await db.users.update_one(
            {"user_id": current_user["user_id"]},
            {"$set": update_data}
        )
    
    updated_user = await db.users.find_one({"user_id": current_user["user_id"]}, {"_id": 0, "password_hash": 0})
    return updated_user

# ==================== DISCOVERY ROUTES ====================

@api_router.get("/discover")
async def discover_profiles(current_user: dict = Depends(get_current_user)):
    """Get profiles to swipe on - excludes already swiped and self"""
    user_id = current_user["user_id"]
    
    # Get users already swiped on
    swiped = await db.swipes.find({"swiper_id": user_id}, {"_id": 0, "target_id": 1}).to_list(1000)
    swiped_ids = [s["target_id"] for s in swiped]
    swiped_ids.append(user_id)  # Exclude self
    
    # Find profiles not yet swiped, with complete profiles
    profiles = await db.users.find(
        {
            "user_id": {"$nin": swiped_ids},
            "profile_complete": True
        },
        {"_id": 0, "password_hash": 0}
    ).to_list(50)
    
    return profiles

@api_router.post("/swipe")
async def swipe(action: SwipeAction, current_user: dict = Depends(get_current_user)):
    """Record a swipe action and check for match"""
    user_id = current_user["user_id"]
    
    # Record the swipe
    swipe_doc = {
        "swipe_id": f"swipe_{uuid.uuid4().hex[:12]}",
        "swiper_id": user_id,
        "target_id": action.target_user_id,
        "action": action.action,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.swipes.insert_one(swipe_doc)
    
    match_created = False
    match_data = None
    
    # Check for mutual like
    if action.action == "like":
        reverse_like = await db.swipes.find_one({
            "swiper_id": action.target_user_id,
            "target_id": user_id,
            "action": "like"
        }, {"_id": 0})
        
        if reverse_like:
            # Create match
            match_id = f"match_{uuid.uuid4().hex[:12]}"
            match_doc = {
                "match_id": match_id,
                "user1_id": user_id,
                "user2_id": action.target_user_id,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_message_at": None
            }
            await db.matches.insert_one(match_doc)
            match_created = True
            
            # Get matched user info
            matched_user = await db.users.find_one(
                {"user_id": action.target_user_id},
                {"_id": 0, "password_hash": 0}
            )
            match_data = {
                "match_id": match_id,
                "matched_user": matched_user
            }
    
    return {
        "success": True,
        "match_created": match_created,
        "match": match_data
    }

# ==================== MATCHES & CHAT ROUTES ====================

@api_router.get("/matches")
async def get_matches(current_user: dict = Depends(get_current_user)):
    """Get all matches for the current user"""
    user_id = current_user["user_id"]
    
    matches = await db.matches.find({
        "$or": [{"user1_id": user_id}, {"user2_id": user_id}]
    }, {"_id": 0}).to_list(100)
    
    result = []
    for match in matches:
        other_user_id = match["user2_id"] if match["user1_id"] == user_id else match["user1_id"]
        other_user = await db.users.find_one({"user_id": other_user_id}, {"_id": 0, "password_hash": 0})
        
        # Get last message
        last_msg = await db.messages.find_one(
            {"match_id": match["match_id"]},
            {"_id": 0},
            sort=[("created_at", -1)]
        )
        
        result.append({
            "match_id": match["match_id"],
            "matched_user": other_user,
            "created_at": match["created_at"],
            "last_message": last_msg
        })
    
    return result

@api_router.get("/matches/{match_id}/messages")
async def get_messages(match_id: str, current_user: dict = Depends(get_current_user)):
    """Get messages for a match"""
    # Verify user is part of this match
    match = await db.matches.find_one({
        "match_id": match_id,
        "$or": [{"user1_id": current_user["user_id"]}, {"user2_id": current_user["user_id"]}]
    }, {"_id": 0})
    
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    messages = await db.messages.find(
        {"match_id": match_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    
    return messages

@api_router.post("/matches/{match_id}/messages")
async def send_message(match_id: str, msg: MessageCreate, current_user: dict = Depends(get_current_user)):
    """Send a message in a match"""
    # Verify user is part of this match
    match = await db.matches.find_one({
        "match_id": match_id,
        "$or": [{"user1_id": current_user["user_id"]}, {"user2_id": current_user["user_id"]}]
    }, {"_id": 0})
    
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    
    message_doc = {
        "message_id": f"msg_{uuid.uuid4().hex[:12]}",
        "match_id": match_id,
        "sender_id": current_user["user_id"],
        "content": msg.content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.messages.insert_one(message_doc)
    
    # Update last_message_at
    await db.matches.update_one(
        {"match_id": match_id},
        {"$set": {"last_message_at": message_doc["created_at"]}}
    )
    
    return {k: v for k, v in message_doc.items()}

# ==================== AI FEATURES ====================

@api_router.post("/ai/roast")
async def generate_roast(current_user: dict = Depends(get_current_user)):
    """Generate an AI roast based on user's red flags"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    red_flags = current_user.get("red_flags", [])
    negative_qualities = current_user.get("negative_qualities", [])
    
    if not red_flags and not negative_qualities:
        return {"roast": "You haven't shared any red flags yet. Too perfect or too scared? 🚩"}
    
    prompt = f"""You are a witty comedian on a dating app called "Unhinged" where people share their red flags.
    Generate a short, funny, self-deprecating roast (2-3 sentences) based on these traits:
    Red Flags: {', '.join(red_flags) if red_flags else 'None shared'}
    Negative Qualities: {', '.join(negative_qualities) if negative_qualities else 'None shared'}
    
    Keep it playful and not mean-spirited. Make it something the person would laugh at and want to share."""
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"roast_{current_user['user_id']}_{uuid.uuid4().hex[:8]}",
        system_message="You are a witty, playful comedian who writes self-deprecating roasts."
    ).with_model("openai", "gpt-4o")
    
    response = await chat.send_message(UserMessage(text=prompt))
    return {"roast": response}

@api_router.post("/ai/analyze-compatibility/{target_user_id}")
async def analyze_compatibility(target_user_id: str, current_user: dict = Depends(get_current_user)):
    """AI analysis of red flag compatibility between two users"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    target_user = await db.users.find_one({"user_id": target_user_id}, {"_id": 0, "password_hash": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    prompt = f"""You're an AI dating coach on "Unhinged" - a satirical app matching people by red flags.
    
    Person A's Red Flags: {', '.join(current_user.get('red_flags', ['None listed']))}
    Person A's Negative Qualities: {', '.join(current_user.get('negative_qualities', ['None listed']))}
    
    Person B's Red Flags: {', '.join(target_user.get('red_flags', ['None listed']))}
    Person B's Negative Qualities: {', '.join(target_user.get('negative_qualities', ['None listed']))}
    
    Generate a funny "compatibility analysis" (3-4 sentences) explaining why their flaws might work together or hilariously clash.
    Include a made-up "Chaos Compatibility Score" percentage.
    Keep it playful and entertaining."""
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"compat_{current_user['user_id']}_{uuid.uuid4().hex[:8]}",
        system_message="You are a comedic dating analyst who finds humor in human flaws."
    ).with_model("openai", "gpt-4o")
    
    response = await chat.send_message(UserMessage(text=prompt))
    return {"analysis": response, "target_user": target_user.get("name", "Unknown")}

@api_router.post("/ai/icebreaker/{target_user_id}")
async def generate_icebreaker(target_user_id: str, current_user: dict = Depends(get_current_user)):
    """Generate an AI icebreaker message based on both users' red flags"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    target_user = await db.users.find_one({"user_id": target_user_id}, {"_id": 0, "password_hash": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    prompt = f"""Generate a funny, self-aware icebreaker message for a dating app called "Unhinged" where people embrace their flaws.
    
    Sender's Red Flags: {', '.join(current_user.get('red_flags', ['mysterious']))}
    Recipient's Red Flags: {', '.join(target_user.get('red_flags', ['mysterious']))}
    Recipient's Name: {target_user.get('name', 'there')}
    
    Create ONE short, witty opening message that acknowledges their shared chaos.
    Keep it under 2 sentences. Make it memorable and conversation-starting."""
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"ice_{current_user['user_id']}_{uuid.uuid4().hex[:8]}",
        system_message="You write clever, self-deprecating icebreaker messages."
    ).with_model("openai", "gpt-4o")
    
    response = await chat.send_message(UserMessage(text=prompt))
    return {"icebreaker": response}

# ==================== UTILITY ROUTES ====================

@api_router.get("/red-flags/suggestions")
async def get_red_flag_suggestions():
    """Get suggested red flags for profile creation"""
    return {
        "red_flags": [
            "I reply to texts 3 days later",
            "My ex is still my best friend",
            "I have a mattress on the floor",
            "I say 'we should do this again' and never follow up",
            "I've never watched The Office",
            "I double text... a lot",
            "My Spotify Wrapped was embarrassing",
            "I still use Internet Explorer",
            "I put milk before cereal",
            "I think astrology is real",
            "I'm a reply guy on Twitter",
            "I use the word 'vibes' unironically",
            "I own multiple swords",
            "My love language is leaving people on read",
            "I have 47 unread books"
        ],
        "negative_qualities": [
            "Chronically late to everything",
            "Can't cook anything besides cereal",
            "Talks to plants more than people",
            "Has strong opinions about fonts",
            "Cries at commercials",
            "Still uses 'XD' in texts",
            "Finishes other people's sentences wrong",
            "Gives unsolicited advice",
            "Can't keep a plant alive",
            "Still quotes Vine in 2024",
            "Thinks pineapple belongs on pizza",
            "Has a finsta with 3 followers",
            "Watches movies on 1.5x speed",
            "Leaves cabinet doors open",
            "Over-explains simple things"
        ]
    }

@api_router.get("/prompts/suggestions")
async def get_prompt_suggestions():
    """Get prompt suggestions for profile"""
    return {
        "prompts": [
            {"id": "worst_trait", "question": "My most toxic trait is..."},
            {"id": "dealbreaker", "question": "I'll immediately lose interest if you..."},
            {"id": "embarrassing", "question": "My most embarrassing moment was..."},
            {"id": "guilty_pleasure", "question": "My guilty pleasure is..."},
            {"id": "hot_take", "question": "My hottest take is..."},
            {"id": "red_flag_excuse", "question": "I justify my red flags by saying..."},
            {"id": "worst_date", "question": "My worst date story involves..."},
            {"id": "3am_thought", "question": "At 3am, I'm usually..."},
            {"id": "dealmaker", "question": "I'm a walking red flag but at least I..."},
            {"id": "self_aware", "question": "I know I'm problematic because..."}
        ]
    }

@api_router.get("/")
async def root():
    return {"message": "Welcome to Unhinged API - Dating for the Flawed & Chaotic"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
