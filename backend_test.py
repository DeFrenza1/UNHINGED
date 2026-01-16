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
        """Test updating user profile"""
        if not self.token:
            self.log_test("Update Profile", False, "No auth token")
            return False
            
        update_data = {
            "age": 25,
            "bio": "Living my best chaotic life",
            "location": "Chaos City",
            "red_flags": ["I reply 3 days later", "My ex is my best friend"],
            "negative_qualities": ["Chronically late", "Can't cook anything"],
            "photos": ["https://via.placeholder.com/400x600"],
            "worst_photo_caption": "This is my disaster energy"
        }
        
        return self.run_test("Update Profile", "PUT", "profile", 200, update_data)[0]

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
        """Test AI roast generation"""
        if not self.token:
            self.log_test("AI Roast", False, "No auth token")
            return False
            
        success, response = self.run_test("AI Roast Generation", "POST", "ai/roast", 200)
        
        if success:
            if 'roast' in response:
                print(f"   Generated roast: {response['roast'][:100]}...")
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

def main():
    print("🚩 UNHINGED API TESTING SUITE 🚩")
    print("=" * 50)
    
    tester = UnhingedAPITester()
    
    # Test sequence
    tests = [
        ("Root Endpoint", tester.test_root_endpoint),
        ("User Registration", tester.test_register),
        ("User Login", tester.test_login),
        ("Auth Me", tester.test_auth_me),
        ("Get Profile", tester.test_get_profile),
        ("Update Profile", tester.test_update_profile),
        ("Red Flag Suggestions", tester.test_red_flag_suggestions),
        ("Prompt Suggestions", tester.test_prompt_suggestions),
        ("Discover Profiles", tester.test_discover_profiles),
        ("Swipe Action", tester.test_swipe_action),
        ("Get Matches", tester.test_matches),
        ("AI Roast Generation", tester.test_ai_roast),
        ("Logout", tester.test_logout)
    ]
    
    print(f"\nRunning {len(tests)} API tests...\n")
    
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            tester.log_test(test_name, False, f"Exception: {str(e)}")
    
    # Print summary
    print("\n" + "=" * 50)
    print("📊 TEST SUMMARY")
    print("=" * 50)
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
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())