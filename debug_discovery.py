import requests
import json
import uuid

# Test discovery filtering with simple case
base_url = "https://dating-quirks.preview.emergentagent.com"
api_url = f"{base_url}/api"

def create_and_complete_user(name, age, gender, pref_genders, pref_age_min, pref_age_max):
    """Create a user and complete their profile"""
    
    # Register
    email = f"{name.lower().replace(' ', '')}_{uuid.uuid4().hex[:8]}@example.com"
    register_data = {
        "name": name,
        "email": email,
        "password": "TestPass123!"
    }
    
    response = requests.post(f"{api_url}/auth/register", json=register_data)
    if response.status_code != 200:
        print(f"Failed to register {name}: {response.text}")
        return None
    
    user_data = response.json()
    token = user_data['access_token']
    user_id = user_data['user']['user_id']
    
    # Complete profile
    profile_data = {
        "age": age,
        "gender_identity": gender,
        "bio": f"Hi, I'm {name}",
        "red_flags": ["Test red flag"],
        "photos": ["https://via.placeholder.com/400x600"],
        "pref_age_min": pref_age_min,
        "pref_age_max": pref_age_max,
        "pref_genders": pref_genders
    }
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.put(f"{api_url}/profile", json=profile_data, headers=headers)
    if response.status_code != 200:
        print(f"Failed to update profile for {name}: {response.text}")
        return None
    
    profile_response = response.json()
    print(f"✅ Created {name}: Age {age}, Gender '{gender}', Looking for {pref_genders}, Profile Complete: {profile_response.get('profile_complete')}")
    
    return {
        "name": name,
        "user_id": user_id,
        "token": token,
        "age": age,
        "gender": gender,
        "pref_genders": pref_genders
    }

def test_discovery(user):
    """Test discovery for a user"""
    headers = {'Authorization': f'Bearer {user["token"]}'}
    response = requests.get(f"{api_url}/discover", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Discovery failed for {user['name']}: {response.text}")
        return []
    
    profiles = response.json()
    print(f"\n🔍 {user['name']} discovery results ({len(profiles)} profiles):")
    for profile in profiles:
        print(f"   - {profile.get('name')} (Age: {profile.get('age')}, Gender: '{profile.get('gender_identity')}', Score: {profile.get('match_score')})")
    
    return profiles

def main():
    print("🔍 DEBUG DISCOVERY FILTERING")
    print("=" * 40)
    
    # Create two users that should see each other
    alice = create_and_complete_user("Alice", 25, "Woman", ["Man"], 23, 30)
    bob = create_and_complete_user("Bob", 27, "Man", ["Woman"], 22, 28)
    
    if not alice or not bob:
        print("❌ Failed to create users")
        return
    
    print(f"\n📋 Expected matching:")
    print(f"   Alice (25F, wants Men 23-30) should see Bob (27M)")
    print(f"   Bob (27M, wants Women 22-28) should see Alice (25F)")
    
    # Test discovery for both
    alice_sees = test_discovery(alice)
    bob_sees = test_discovery(bob)
    
    # Check results
    alice_sees_bob = any(p['user_id'] == bob['user_id'] for p in alice_sees)
    bob_sees_alice = any(p['user_id'] == alice['user_id'] for p in bob_sees)
    
    print(f"\n📊 Results:")
    print(f"   Alice sees Bob: {'✅' if alice_sees_bob else '❌'}")
    print(f"   Bob sees Alice: {'✅' if bob_sees_alice else '❌'}")
    
    if not alice_sees_bob or not bob_sees_alice:
        print(f"\n🐛 Debugging info:")
        print(f"   Alice: {alice['age']}yo {alice['gender']}, wants {alice['pref_genders']}")
        print(f"   Bob: {bob['age']}yo {bob['gender']}, wants {bob['pref_genders']}")

if __name__ == "__main__":
    main()