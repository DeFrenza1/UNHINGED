import requests
import json
import uuid

# Test edge cases for discovery filtering
base_url = "https://dating-quirks.preview.emergentagent.com"
api_url = f"{base_url}/api"

def create_user_with_profile(name, profile_data):
    """Create a user and complete their profile"""
    email = f"{name.lower().replace(' ', '')}_{uuid.uuid4().hex[:8]}@example.com"
    register_data = {
        "name": name,
        "email": email,
        "password": "TestPass123!"
    }
    
    response = requests.post(f"{api_url}/auth/register", json=register_data)
    if response.status_code != 200:
        print(f"❌ Failed to register {name}: {response.text}")
        return None
    
    user_data = response.json()
    token = user_data['access_token']
    user_id = user_data['user']['user_id']
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.put(f"{api_url}/profile", json=profile_data, headers=headers)
    if response.status_code != 200:
        print(f"❌ Failed to update profile for {name}: {response.text}")
        return None
    
    return {"name": name, "user_id": user_id, "token": token}

def test_discovery(user, expected_count=None, should_see=None, should_not_see=None):
    """Test discovery for a user with expectations"""
    headers = {'Authorization': f'Bearer {user["token"]}'}
    response = requests.get(f"{api_url}/discover", headers=headers)
    
    if response.status_code != 200:
        print(f"❌ Discovery failed for {user['name']}: {response.text}")
        return False
    
    profiles = response.json()
    print(f"🔍 {user['name']} sees {len(profiles)} profiles")
    
    # Check expected count
    if expected_count is not None and len(profiles) != expected_count:
        print(f"❌ Expected {expected_count} profiles, got {len(profiles)}")
        return False
    
    # Check should see
    if should_see:
        for expected_user in should_see:
            found = any(p['user_id'] == expected_user['user_id'] for p in profiles)
            if not found:
                print(f"❌ Should see {expected_user['name']} but didn't")
                return False
            print(f"   ✅ Correctly sees {expected_user['name']}")
    
    # Check should not see
    if should_not_see:
        for unexpected_user in should_not_see:
            found = any(p['user_id'] == unexpected_user['user_id'] for p in profiles)
            if found:
                print(f"❌ Should NOT see {unexpected_user['name']} but did")
                return False
            print(f"   ✅ Correctly does NOT see {unexpected_user['name']}")
    
    # Check match_score and sorting
    if profiles:
        for profile in profiles:
            if 'match_score' not in profile:
                print(f"❌ Missing match_score in profile")
                return False
        
        scores = [p['match_score'] for p in profiles]
        if scores != sorted(scores, reverse=True):
            print(f"❌ Profiles not sorted by match_score descending")
            return False
        print(f"   ✅ Profiles correctly sorted by match_score")
    
    return True

def main():
    print("🧪 EDGE CASE TESTING FOR DISCOVERY & MATCHING")
    print("=" * 50)
    
    # Test Case 1: Age boundary filtering
    print("\n📅 Test Case 1: Age boundary filtering")
    
    young_user = create_user_with_profile("Young User", {
        "age": 20,
        "gender_identity": "Woman",
        "bio": "Young person",
        "red_flags": ["Too young"],
        "photos": ["https://via.placeholder.com/400x600"],
        "pref_age_min": 18,
        "pref_age_max": 25,
        "pref_genders": ["Man"]
    })
    
    old_user = create_user_with_profile("Old User", {
        "age": 40,
        "gender_identity": "Man", 
        "bio": "Mature person",
        "red_flags": ["Too old"],
        "photos": ["https://via.placeholder.com/400x600"],
        "pref_age_min": 18,
        "pref_age_max": 22,  # Should NOT see young_user (20 is within range)
        "pref_genders": ["Woman"]
    })
    
    # Young user should see old user (no age prefs restrict it)
    # Old user should see young user (20 is within 18-22 range)
    if not test_discovery(young_user, should_see=[old_user]):
        return False
    if not test_discovery(old_user, should_see=[young_user]):
        return False
    
    # Test Case 2: Missing age/gender handling
    print("\n❓ Test Case 2: Missing age/gender handling")
    
    incomplete_user = create_user_with_profile("Incomplete User", {
        # Missing age and gender_identity
        "bio": "Mysterious person",
        "red_flags": ["Too mysterious"],
        "photos": ["https://via.placeholder.com/400x600"]
        # No preferences set
    })
    
    picky_user = create_user_with_profile("Picky User", {
        "age": 25,
        "gender_identity": "Woman",
        "bio": "Very specific preferences",
        "red_flags": ["Too picky"],
        "photos": ["https://via.placeholder.com/400x600"],
        "pref_age_min": 20,
        "pref_age_max": 30,
        "pref_genders": ["Man"]  # Should not see incomplete_user (no gender)
    })
    
    # Picky user should NOT see incomplete user (missing gender)
    if not test_discovery(picky_user, should_not_see=[incomplete_user]):
        return False
    
    # Test Case 3: Empty preferences (should see everyone)
    print("\n🌍 Test Case 3: Empty preferences (should see everyone)")
    
    open_user = create_user_with_profile("Open User", {
        "age": 30,
        "gender_identity": "Non-binary",
        "bio": "Open to everyone",
        "red_flags": ["Too open"],
        "photos": ["https://via.placeholder.com/400x600"]
        # No pref_age_min/max, no pref_genders
    })
    
    # Open user should see users with complete profiles
    if not test_discovery(open_user, should_see=[young_user, old_user, picky_user]):
        return False
    
    # Test Case 4: Complex dealbreaker scenario
    print("\n🚫 Test Case 4: Complex dealbreaker scenario")
    
    red_flag_user = create_user_with_profile("Red Flag User", {
        "age": 28,
        "gender_identity": "Man",
        "bio": "I have problematic traits",
        "red_flags": ["Always late", "Leaves dishes in sink", "Bad texter"],
        "photos": ["https://via.placeholder.com/400x600"],
        "pref_genders": ["Woman"]
    })
    
    dealbreaker_user = create_user_with_profile("Dealbreaker User", {
        "age": 26,
        "gender_identity": "Woman",
        "bio": "I have standards",
        "red_flags": ["Perfectionist"],
        "dealbreaker_red_flags": ["Always late", "Rude to waiters"],  # Should filter out red_flag_user
        "photos": ["https://via.placeholder.com/400x600"],
        "pref_genders": ["Man"]
    })
    
    # Dealbreaker user should NOT see red flag user
    if not test_discovery(dealbreaker_user, should_not_see=[red_flag_user]):
        return False
    
    # Red flag user should see dealbreaker user (no dealbreakers set)
    if not test_discovery(red_flag_user, should_see=[dealbreaker_user]):
        return False
    
    print("\n✅ ALL EDGE CASE TESTS PASSED!")
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)