import requests
import json
import uuid

# Test the profile update endpoint directly
base_url = "https://dating-quirks.preview.emergentagent.com"
api_url = f"{base_url}/api"

# First register a user
register_data = {
    "name": "Debug User",
    "email": f"debug_{uuid.uuid4().hex[:8]}@example.com",
    "password": "DebugPass123!"
}

print("Registering user...")
response = requests.post(f"{api_url}/auth/register", json=register_data)
print(f"Registration status: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    token = data['access_token']
    print(f"Token: {token[:20]}...")
    
    # Now update profile
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    
    update_data = {
        "age": 28,
        "bio": "Test bio",
        "red_flags": ["Test flag"],
        "photos": ["https://example.com/photo.jpg"]
    }
    
    print("\nUpdating profile...")
    response = requests.put(f"{api_url}/profile", json=update_data, headers=headers)
    print(f"Update status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Profile complete: {data.get('profile_complete')}")
        print(f"Profile complete type: {type(data.get('profile_complete'))}")
        print(f"Age: {data.get('age')}")
        print(f"Bio: {data.get('bio')}")
        print(f"Red flags: {data.get('red_flags')}")
        print(f"Photos: {data.get('photos')}")
    else:
        print(f"Error: {response.text}")
else:
    print(f"Registration failed: {response.text}")