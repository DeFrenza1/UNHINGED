import requests
import sys
import json
from datetime import datetime
import uuid

class UnhingedAPITester:
    def __init__(self, base_url="https://dating-quirks.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.log_test(name, True)
                try:
                    return True, response.json()
                except:
                    return True, response.text
            else:
                error_msg = f"Expected {expected_status}, got {response.status_code}"
                try:
                    error_detail = response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - {response.text[:200]}"
                
                self.log_test(name, False, error_msg)
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "", 200)

    def test_register(self):
        """Test user registration with expanded profile schema"""
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        test_data = {
            "name": "Alex Chaos",
            "email": test_email,
            "password": "TestPass123!"
        }
        
        success, response = self.run_test("User Registration", "POST", "auth/register", 200, test_data)
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['user_id']
            print(f"   Token obtained: {self.token[:20]}...")
            
            # Verify new profile fields have sane defaults
            user = response.get('user', {})
            expected_defaults = {
                'gender_identity': None,
                'pronouns': None,
                'sexuality': None,
                'interested_in': [],
                'city': None,
                'country': None,
                'drinking': None,
                'smoking': None,
                'exercise': None,
                'pref_age_min': None,
                'pref_age_max': None,
                'pref_genders': [],
                'pref_distance_km': None,
                'dealbreaker_red_flags': []
            }
            
            for field, expected_value in expected_defaults.items():
                actual_value = user.get(field)
                if actual_value != expected_value:
                    self.log_test(f"Registration Default - {field}", False, 
                                f"Expected {expected_value}, got {actual_value}")
                    return False
                else:
                    print(f"   ✓ {field}: {actual_value}")
            
            return True
        return False

    def test_login(self):
        """Test user login with existing credentials"""
        if not self.user_id:
            return False
            
        # We'll use the registered user's credentials
        # For this test, we'll create a new user and login
        test_email = f"login_test_{uuid.uuid4().hex[:8]}@example.com"
        register_data = {
            "name": "Login Test User",
            "email": test_email,
            "password": "LoginTest123!"
        }
        
        # First register
        success, _ = self.run_test("Pre-Login Registration", "POST", "auth/register", 200, register_data)
        if not success:
            return False
            
        # Then login
        login_data = {
            "email": test_email,
            "password": "LoginTest123!"
        }
        
        success, response = self.run_test("User Login", "POST", "auth/login", 200, login_data)
        return success and 'access_token' in response

    def test_get_profile(self):
        """Test getting user profile - ensure UserProfile-compatible payload with new fields"""
        if not self.token:
            self.log_test("Get Profile", False, "No auth token")
            return False
            
        success, response = self.run_test("Get Profile", "GET", "profile", 200)
        
        if success:
            # Check for MongoDB _id field (should not be present)
            if '_id' in response:
                self.log_test("Get Profile - No _id", False, "MongoDB _id field present in response")
                return False
            
            # Verify created_at is handled correctly
            if 'created_at' not in response:
                self.log_test("Get Profile - created_at", False, "Missing created_at field")
                return False
            
            # Verify new profile fields are present and UserProfile-compatible
            required_fields = [
                'user_id', 'email', 'name', 'display_name', 'age', 'bio',
                'gender_identity', 'pronouns', 'sexuality', 'interested_in',
                'city', 'country', 'drinking', 'smoking', 'exercise',
                'pref_age_min', 'pref_age_max', 'pref_genders', 'pref_distance_km',
                'dealbreaker_red_flags', 'red_flags', 'negative_qualities',
                'photos', 'prompts', 'profile_complete', 'created_at'
            ]
            
            missing_fields = []
            for field in required_fields:
                if field not in response:
                    missing_fields.append(field)
            
            if missing_fields:
                self.log_test("Get Profile - Required Fields", False, f"Missing fields: {missing_fields}")
                return False
            
            print(f"   ✓ All UserProfile fields present")
            print(f"   ✓ created_at: {response['created_at']}")
            return True
        
        return False

    def test_update_profile(self):
        """Test updating user profile with comprehensive new fields"""
        if not self.token:
            self.log_test("Update Profile", False, "No auth token")
            return False
            
        # Comprehensive update data exercising all new fields
        update_data = {
            "display_name": "Alex 'Chaos' Johnson",
            "age": 28,
            "bio": "Living authentically chaotic since 1995. Warning: I will overshare about my houseplants.",
            "gender_identity": "Non-binary",
            "pronouns": "they/them",
            "sexuality": "Pansexual",
            "interested_in": ["Women", "Men", "Non-binary"],
            "city": "Portland",
            "country": "United States",
            "drinking": "Socially",
            "smoking": "Never",
            "exercise": "Sometimes",
            "red_flags": ["I reply 3 days later", "My ex is my best friend", "I have strong opinions about fonts"],
            "dealbreaker_red_flags": ["Doesn't tip service workers", "Rude to animals"],
            "negative_qualities": ["Chronically late", "Can't cook anything", "Talks to plants more than people"],
            "photos": ["https://via.placeholder.com/400x600"],
            "worst_photo_caption": "This is my disaster energy in its natural habitat",
            "pref_age_min": 25,
            "pref_age_max": 35,
            "pref_genders": ["Women", "Non-binary"],
            "pref_distance_km": 50
        }
        
        success, response = self.run_test("Update Profile", "PUT", "profile", 200, update_data)
        
        if success:
            # Verify response reflects updated fields
            for field, expected_value in update_data.items():
                actual_value = response.get(field)
                if actual_value != expected_value:
                    self.log_test(f"Update Profile - {field}", False, 
                                f"Expected {expected_value}, got {actual_value}")
                    return False
                else:
                    print(f"   ✓ {field}: {actual_value}")
            
            # Verify profile completeness logic (should be based on age, bio, red_flags, photos only)
            expected_complete = (
                response.get('age') is not None and
                response.get('bio') is not None and
                len(response.get('red_flags', [])) > 0 and
                len(response.get('photos', [])) > 0
            )
            
            actual_complete = response.get('profile_complete', False)
            if actual_complete != expected_complete:
                self.log_test("Update Profile - Completeness Logic", False, 
                            f"Expected profile_complete={expected_complete}, got {actual_complete}")
                return False
            
            print(f"   ✓ Profile completeness logic correct: {actual_complete}")
            
            # Check for MongoDB _id field (should not be present)
            if '_id' in response:
                self.log_test("Update Profile - No _id", False, "MongoDB _id field present in response")
                return False
            
            print("   ✓ No schema validation issues")
            return True
        
        return False

    def test_red_flag_suggestions(self):
        """Test red flag suggestions endpoint"""
        success, response = self.run_test("Red Flag Suggestions", "GET", "red-flags/suggestions", 200)
        
        if success:
            # Verify response structure
            if 'red_flags' in response and 'negative_qualities' in response:
                return True
            else:
                self.log_test("Red Flag Suggestions Structure", False, "Missing expected fields")
                return False
        return False

    def test_prompt_suggestions(self):
        """Test prompt suggestions endpoint"""
        success, response = self.run_test("Prompt Suggestions", "GET", "prompts/suggestions", 200)
        
        if success:
            if 'prompts' in response and len(response['prompts']) > 0:
                return True
            else:
                self.log_test("Prompt Suggestions Structure", False, "Missing prompts field")
                return False
        return False

    def test_discover_profiles(self):
        """Test discover profiles endpoint"""
        if not self.token:
            self.log_test("Discover Profiles", False, "No auth token")
            return False
            
        success, response = self.run_test("Discover Profiles", "GET", "discover", 200)
        
        if success:
            # Should return a list (might be empty)
            if isinstance(response, list):
                return True
            else:
                self.log_test("Discover Profiles Structure", False, "Response not a list")
                return False
        return False

    def test_swipe_action(self):
        """Test swipe action (will create dummy target)"""
        if not self.token:
            self.log_test("Swipe Action", False, "No auth token")
            return False
            
        # Create a dummy target user first
        target_email = f"target_{uuid.uuid4().hex[:8]}@example.com"
        target_data = {
            "name": "Target User",
            "email": target_email,
            "password": "TargetPass123!"
        }
        
        # Register target user
        success, target_response = self.run_test("Target User Registration", "POST", "auth/register", 200, target_data)
        if not success:
            return False
            
        target_user_id = target_response['user']['user_id']
        
        # Now test swipe
        swipe_data = {
            "target_user_id": target_user_id,
            "action": "like"
        }
        
        return self.run_test("Swipe Action", "POST", "swipe", 200, swipe_data)[0]

    def test_matches(self):
        """Test get matches endpoint"""
        if not self.token:
            self.log_test("Get Matches", False, "No auth token")
            return False
            
        success, response = self.run_test("Get Matches", "GET", "matches", 200)
        
        if success:
            if isinstance(response, list):
                return True
            else:
                self.log_test("Matches Structure", False, "Response not a list")
                return False
        return False

    def test_ai_roast(self):
        """Test AI roast generation - regression check for red_flags/negative_qualities"""
        if not self.token:
            self.log_test("AI Roast", False, "No auth token")
            return False
            
        success, response = self.run_test("AI Roast Generation", "POST", "ai/roast", 200)
        
        if success:
            if 'roast' in response:
                roast_text = response['roast']
                print(f"   Generated roast: {roast_text[:100]}...")
                
                # Verify it's not the default "no red flags" message since we have red flags
                if "Too perfect or too scared" in roast_text:
                    self.log_test("AI Roast - Content Check", False, 
                                "Got default message despite having red flags")
                    return False
                
                print("   ✓ AI roast generated successfully with user's red flags")
                return True
            else:
                self.log_test("AI Roast Structure", False, "Missing roast field")
                return False
        return False

    def test_auth_me(self):
        """Test auth/me endpoint - verify new fields and no MongoDB _id serialization issues"""
        if not self.token:
            self.log_test("Auth Me", False, "No auth token")
            return False
            
        success, response = self.run_test("Auth Me", "GET", "auth/me", 200)
        
        if success:
            # Check for MongoDB _id field (should not be present)
            if '_id' in response:
                self.log_test("Auth Me - No _id", False, "MongoDB _id field present in response")
                return False
            
            # Verify new profile fields are present
            required_new_fields = [
                'gender_identity', 'pronouns', 'sexuality', 'interested_in',
                'city', 'country', 'drinking', 'smoking', 'exercise',
                'pref_age_min', 'pref_age_max', 'pref_genders', 'pref_distance_km',
                'dealbreaker_red_flags'
            ]
            
            for field in required_new_fields:
                if field not in response:
                    self.log_test(f"Auth Me - {field} field", False, f"Missing {field} field")
                    return False
                else:
                    print(f"   ✓ {field}: {response[field]}")
            
            print("   ✓ No MongoDB _id serialization issues")
            return True
        
        return False

    def test_logout(self):
        """Test logout endpoint"""
        if not self.token:
            self.log_test("Logout", False, "No auth token")
            return False
            
        return self.run_test("Logout", "POST", "auth/logout", 200)[0]

    def test_discovery_and_matching_flow(self):
        """Comprehensive test of discovery and matching flow with multiple users"""
        print("\n🎯 TESTING DISCOVERY & MATCHING FLOW")
        print("=" * 50)
        
        # Create 3 test users with different preferences
        users = []
        
        # User A: 25F, straight, looking for men 23-30
        user_a_data = {
            "name": "Emma Rodriguez",
            "email": f"emma_{uuid.uuid4().hex[:8]}@example.com",
            "password": "TestPass123!"
        }
        success, response = self.run_test("Register User A", "POST", "auth/register", 200, user_a_data)
        if not success:
            return False
        
        user_a = {
            "token": response['access_token'],
            "user_id": response['user']['user_id'],
            "email": user_a_data["email"],
            "password": user_a_data["password"]
        }
        users.append(user_a)
        
        # Complete User A's profile
        profile_a = {
            "age": 25,
            "gender_identity": "Woman",
            "sexuality": "Straight",
            "interested_in": ["Men"],
            "bio": "Love hiking and coffee dates",
            "red_flags": ["Always late", "Overthinks everything"],
            "dealbreaker_red_flags": ["Rude to waiters", "Doesn't like dogs"],
            "photos": ["https://via.placeholder.com/400x600"],
            "pref_age_min": 23,
            "pref_age_max": 30,
            "pref_genders": ["Men"],
            "relationship_type": "Long-term",
            "has_kids": "No",
            "wants_kids": "Yes"
        }
        
        headers_a = {'Authorization': f'Bearer {user_a["token"]}'}
        success, _ = self.run_test("Complete User A Profile", "PUT", "profile", 200, profile_a, headers_a)
        if not success:
            return False
        
        # User B: 27M, straight, looking for women 22-28
        user_b_data = {
            "name": "Marcus Johnson",
            "email": f"marcus_{uuid.uuid4().hex[:8]}@example.com",
            "password": "TestPass123!"
        }
        success, response = self.run_test("Register User B", "POST", "auth/register", 200, user_b_data)
        if not success:
            return False
        
        user_b = {
            "token": response['access_token'],
            "user_id": response['user']['user_id'],
            "email": user_b_data["email"],
            "password": user_b_data["password"]
        }
        users.append(user_b)
        
        # Complete User B's profile
        profile_b = {
            "age": 27,
            "gender_identity": "Man",
            "sexuality": "Straight", 
            "interested_in": ["Women"],
            "bio": "Gym enthusiast and foodie",
            "red_flags": ["Leaves dishes in sink", "Watches too much Netflix"],
            "dealbreaker_red_flags": ["Smokes cigarettes", "No sense of humor"],
            "photos": ["https://via.placeholder.com/400x600"],
            "pref_age_min": 22,
            "pref_age_max": 28,
            "pref_genders": ["Women"],
            "relationship_type": "Long-term",
            "has_kids": "No", 
            "wants_kids": "Yes"
        }
        
        headers_b = {'Authorization': f'Bearer {user_b["token"]}'}
        success, _ = self.run_test("Complete User B Profile", "PUT", "profile", 200, profile_b, headers_b)
        if not success:
            return False
        
        # User C: 30NB, pansexual, looking for anyone 25-35, has dealbreaker that matches User A's red flag
        user_c_data = {
            "name": "Alex Chen",
            "email": f"alex_{uuid.uuid4().hex[:8]}@example.com", 
            "password": "TestPass123!"
        }
        success, response = self.run_test("Register User C", "POST", "auth/register", 200, user_c_data)
        if not success:
            return False
        
        user_c = {
            "token": response['access_token'],
            "user_id": response['user']['user_id'],
            "email": user_c_data["email"],
            "password": user_c_data["password"]
        }
        users.append(user_c)
        
        # Complete User C's profile - has dealbreaker that matches User A's red flag
        profile_c = {
            "age": 30,
            "gender_identity": "Non-binary",
            "sexuality": "Pansexual",
            "interested_in": ["Women", "Men", "Non-binary"],
            "bio": "Artist and world traveler",
            "red_flags": ["Commitment issues", "Too many houseplants"],
            "dealbreaker_red_flags": ["Always late", "Bad at texting"], # "Always late" is User A's red flag
            "photos": ["https://via.placeholder.com/400x600"],
            "pref_age_min": 25,
            "pref_age_max": 35,
            "pref_genders": ["Women", "Men", "Non-binary"],
            "relationship_type": "Casual",
            "has_kids": "No",
            "wants_kids": "Maybe"
        }
        
        headers_c = {'Authorization': f'Bearer {user_c["token"]}'}
        success, _ = self.run_test("Complete User C Profile", "PUT", "profile", 200, profile_c, headers_c)
        if not success:
            return False
        
        print(f"\n✅ Created 3 test users with complete profiles")
        
        # Test User A's discovery - should see User B but NOT User C (dealbreaker filter)
        print(f"\n🔍 Testing User A's discovery...")
        success, discover_a = self.run_test("User A Discover", "GET", "discover", 200, headers=headers_a)
        if not success:
            return False
        
        # Debug: Print what User A sees
        print(f"   Debug: User A sees {len(discover_a)} profiles:")
        for user in discover_a:
            print(f"     - {user.get('name')} (ID: {user.get('user_id')}, Age: {user.get('age')}, Gender: {user.get('gender_identity')})")
        print(f"   Looking for User B ID: {user_b['user_id']}")
        
        # Verify User A sees User B
        user_b_found = any(user['user_id'] == user_b['user_id'] for user in discover_a)
        if not user_b_found:
            self.log_test("User A Discovery - Should see User B", False, f"User B not found in User A's discovery. Found {len(discover_a)} profiles total")
            return False
        
        # Verify User A does NOT see User C (dealbreaker filter)
        user_c_found = any(user['user_id'] == user_c['user_id'] for user in discover_a)
        if user_c_found:
            self.log_test("User A Discovery - Should NOT see User C", False, "User C found despite dealbreaker filter")
            return False
        
        # Verify match_score is present and list is sorted
        if discover_a:
            for user in discover_a:
                if 'match_score' not in user:
                    self.log_test("User A Discovery - Match Score", False, "match_score missing from results")
                    return False
            
            # Check if sorted by match_score descending
            scores = [user['match_score'] for user in discover_a]
            if scores != sorted(scores, reverse=True):
                self.log_test("User A Discovery - Sorting", False, "Results not sorted by match_score descending")
                return False
        
        print(f"   ✅ User A sees {len(discover_a)} profiles (correctly filtered)")
        
        # Test User B's discovery - should see User A
        print(f"\n🔍 Testing User B's discovery...")
        success, discover_b = self.run_test("User B Discover", "GET", "discover", 200, headers=headers_b)
        if not success:
            return False
        
        user_a_found = any(user['user_id'] == user_a['user_id'] for user in discover_b)
        if not user_a_found:
            self.log_test("User B Discovery - Should see User A", False, "User A not found in User B's discovery")
            return False
        
        print(f"   ✅ User B sees {len(discover_b)} profiles (includes User A)")
        
        # Test swipe and match creation
        print(f"\n💕 Testing swipe and match behavior...")
        
        # User A swipes like on User B
        swipe_a_data = {"target_user_id": user_b['user_id'], "action": "like"}
        success, swipe_a_response = self.run_test("User A Swipes Like on User B", "POST", "swipe", 200, swipe_a_data, headers_a)
        if not success:
            return False
        
        # Should not create match yet (only one-way like)
        if swipe_a_response.get('match_created'):
            self.log_test("Swipe A->B Match Creation", False, "Match created prematurely (should need mutual like)")
            return False
        
        # User B swipes like on User A - should create match
        swipe_b_data = {"target_user_id": user_a['user_id'], "action": "like"}
        success, swipe_b_response = self.run_test("User B Swipes Like on User A", "POST", "swipe", 200, swipe_b_data, headers_b)
        if not success:
            return False
        
        # Should create match now (mutual like)
        if not swipe_b_response.get('match_created'):
            self.log_test("Mutual Like Match Creation", False, "Match not created despite mutual likes")
            return False
        
        match_id = swipe_b_response.get('match', {}).get('match_id')
        if not match_id:
            self.log_test("Match ID Generation", False, "Match ID not returned")
            return False
        
        print(f"   ✅ Match created: {match_id}")
        
        # Verify both users can see the match
        success, matches_a = self.run_test("User A Get Matches", "GET", "matches", 200, headers=headers_a)
        if not success:
            return False
        
        match_found_a = any(match['match_id'] == match_id for match in matches_a)
        if not match_found_a:
            self.log_test("User A See Match", False, "User A cannot see created match")
            return False
        
        success, matches_b = self.run_test("User B Get Matches", "GET", "matches", 200, headers=headers_b)
        if not success:
            return False
        
        match_found_b = any(match['match_id'] == match_id for match in matches_b)
        if not match_found_b:
            self.log_test("User B See Match", False, "User B cannot see created match")
            return False
        
        print(f"   ✅ Both users can see the match")
        
        # Test that swiped users don't appear in discovery anymore
        print(f"\n🔄 Testing post-swipe discovery...")
        success, discover_a_after = self.run_test("User A Discover After Swipe", "GET", "discover", 200, headers=headers_a)
        if not success:
            return False
        
        user_b_found_after = any(user['user_id'] == user_b['user_id'] for user in discover_a_after)
        if user_b_found_after:
            self.log_test("Post-Swipe Discovery", False, "User B still appears in User A's discovery after swipe")
            return False
        
        print(f"   ✅ Swiped users correctly excluded from future discovery")
        
        # Test regression: users with no preferences should see complete profiles
        print(f"\n🔄 Testing regression: broad preferences...")
        
        # Create User D with no specific preferences
        user_d_data = {
            "name": "Sam Taylor",
            "email": f"sam_{uuid.uuid4().hex[:8]}@example.com",
            "password": "TestPass123!"
        }
        success, response = self.run_test("Register User D (No Prefs)", "POST", "auth/register", 200, user_d_data)
        if not success:
            return False
        
        user_d_token = response['access_token']
        
        # Complete profile with minimal preferences
        profile_d = {
            "age": 26,
            "gender_identity": "Man",
            "bio": "Open to meeting anyone interesting",
            "red_flags": ["Indecisive about restaurants"],
            "photos": ["https://via.placeholder.com/400x600"]
            # No pref_age_min/max, no pref_genders - should see everyone
        }
        
        headers_d = {'Authorization': f'Bearer {user_d_token}'}
        success, _ = self.run_test("Complete User D Profile (Broad Prefs)", "PUT", "profile", 200, profile_d, headers_d)
        if not success:
            return False
        
        success, discover_d = self.run_test("User D Discover (Broad Prefs)", "GET", "discover", 200, headers=headers_d)
        if not success:
            return False
        
        # Should see User C (since no age/gender restrictions)
        user_c_found_d = any(user['user_id'] == user_c['user_id'] for user in discover_d)
        if not user_c_found_d:
            self.log_test("Broad Preferences Discovery", False, "User with no prefs should see User C")
            return False
        
        print(f"   ✅ User with broad preferences sees {len(discover_d)} profiles")
        
        print(f"\n✅ DISCOVERY & MATCHING FLOW TESTS COMPLETED SUCCESSFULLY")
        return True

def main():
    print("🚩 UNHINGED API TESTING SUITE - DISCOVERY & MATCHING FLOW 🚩")
    print("=" * 60)
    
    tester = UnhingedAPITester()
    
    # Test sequence focused on discovery and matching functionality
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("Discovery & Matching Flow", tester.test_discovery_and_matching_flow),
    ]
    
    print(f"\nRunning {len(tests)} API tests focused on discovery and matching...\n")
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            tester.log_test(test_name, False, f"Exception: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY - DISCOVERY & MATCHING FLOW")
    print("=" * 60)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    # Print failed tests
    failed_tests = [r for r in tester.test_results if not r['success']]
    if failed_tests:
        print(f"\n❌ FAILED TESTS ({len(failed_tests)}):")
        for test in failed_tests:
            print(f"   • {test['test']}: {test['details']}")
    else:
        print(f"\n✅ ALL TESTS PASSED! Discovery and matching flow working correctly.")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())