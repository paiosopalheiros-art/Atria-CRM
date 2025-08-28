import requests
import sys
import json
from datetime import datetime, timedelta
from typing import Dict, Any

class WebMobileConnectTester:
    def __init__(self, base_url="https://web-mobile-connect.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_user_id = None
        self.created_status_id = None

    def log_test(self, name: str, success: bool, details: str = ""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED {details}")
        else:
            print(f"❌ {name} - FAILED {details}")
        return success

    def make_request(self, method: str, endpoint: str, data: Dict[Any, Any] = None, params: Dict[str, Any] = None) -> tuple:
        """Make HTTP request and return success status and response"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            
            return True, response
        except Exception as e:
            return False, str(e)

    def test_root_endpoint(self):
        """Test GET /api/ endpoint"""
        success, response = self.make_request('GET', '')
        if success and response.status_code == 200:
            data = response.json()
            if 'message' in data and 'version' in data:
                return self.log_test("Root Endpoint", True, f"- {data.get('message')}")
            else:
                return self.log_test("Root Endpoint", False, "- Missing required fields in response")
        else:
            error_msg = response if isinstance(response, str) else f"Status: {response.status_code}"
            return self.log_test("Root Endpoint", False, f"- {error_msg}")

    def test_health_check(self):
        """Test GET /api/health endpoint"""
        success, response = self.make_request('GET', 'health')
        if success and response.status_code == 200:
            data = response.json()
            if data.get('status') == 'healthy' and data.get('database') == 'connected':
                return self.log_test("Health Check", True, "- API and Database healthy")
            else:
                return self.log_test("Health Check", False, f"- Unhealthy status: {data}")
        else:
            error_msg = response if isinstance(response, str) else f"Status: {response.status_code}"
            return self.log_test("Health Check", False, f"- {error_msg}")

    def test_get_stats(self):
        """Test GET /api/stats endpoint"""
        success, response = self.make_request('GET', 'stats')
        if success and response.status_code == 200:
            data = response.json()
            required_fields = ['total_users', 'active_sessions', 'total_status_checks', 'web_users', 'mobile_users']
            if all(field in data for field in required_fields):
                return self.log_test("System Stats", True, f"- Users: {data['total_users']}, Checks: {data['total_status_checks']}")
            else:
                return self.log_test("System Stats", False, f"- Missing fields: {required_fields}")
        else:
            error_msg = response if isinstance(response, str) else f"Status: {response.status_code}"
            return self.log_test("System Stats", False, f"- {error_msg}")

    def test_create_user(self):
        """Test POST /api/users endpoint"""
        test_user = {
            "name": f"Test User {datetime.now().strftime('%H%M%S')}",
            "email": f"test{datetime.now().strftime('%H%M%S')}@example.com",
            "platform": "web"
        }
        
        success, response = self.make_request('POST', 'users', test_user)
        if success and response.status_code == 200:
            data = response.json()
            if 'id' in data and data.get('name') == test_user['name']:
                self.created_user_id = data['id']
                return self.log_test("Create User", True, f"- Created user: {data['name']}")
            else:
                return self.log_test("Create User", False, f"- Invalid response: {data}")
        else:
            error_msg = response if isinstance(response, str) else f"Status: {response.status_code}"
            return self.log_test("Create User", False, f"- {error_msg}")

    def test_get_users(self):
        """Test GET /api/users endpoint"""
        success, response = self.make_request('GET', 'users')
        if success and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                return self.log_test("Get Users", True, f"- Found {len(data)} users")
            else:
                return self.log_test("Get Users", False, f"- Expected list, got: {type(data)}")
        else:
            error_msg = response if isinstance(response, str) else f"Status: {response.status_code}"
            return self.log_test("Get Users", False, f"- {error_msg}")

    def test_get_specific_user(self):
        """Test GET /api/users/{user_id} endpoint"""
        if not self.created_user_id:
            return self.log_test("Get Specific User", False, "- No user ID available")
        
        success, response = self.make_request('GET', f'users/{self.created_user_id}')
        if success and response.status_code == 200:
            data = response.json()
            if data.get('id') == self.created_user_id:
                return self.log_test("Get Specific User", True, f"- Retrieved user: {data.get('name')}")
            else:
                return self.log_test("Get Specific User", False, f"- ID mismatch: {data}")
        else:
            error_msg = response if isinstance(response, str) else f"Status: {response.status_code}"
            return self.log_test("Get Specific User", False, f"- {error_msg}")

    def test_update_user_activity(self):
        """Test PUT /api/users/{user_id}/activity endpoint"""
        if not self.created_user_id:
            return self.log_test("Update User Activity", False, "- No user ID available")
        
        success, response = self.make_request('PUT', f'users/{self.created_user_id}/activity')
        if success and response.status_code == 200:
            data = response.json()
            if data.get('success'):
                return self.log_test("Update User Activity", True, f"- {data.get('message')}")
            else:
                return self.log_test("Update User Activity", False, f"- Unsuccessful: {data}")
        else:
            error_msg = response if isinstance(response, str) else f"Status: {response.status_code}"
            return self.log_test("Update User Activity", False, f"- {error_msg}")

    def test_create_status_check(self):
        """Test POST /api/status endpoint"""
        status_check = {
            "client_name": f"Test Client {datetime.now().strftime('%H%M%S')}",
            "platform": "web",
            "version": "1.0.0"
        }
        
        success, response = self.make_request('POST', 'status', status_check)
        if success and response.status_code == 200:
            data = response.json()
            if 'id' in data and data.get('client_name') == status_check['client_name']:
                self.created_status_id = data['id']
                return self.log_test("Create Status Check", True, f"- Created: {data['client_name']}")
            else:
                return self.log_test("Create Status Check", False, f"- Invalid response: {data}")
        else:
            error_msg = response if isinstance(response, str) else f"Status: {response.status_code}"
            return self.log_test("Create Status Check", False, f"- {error_msg}")

    def test_get_status_checks(self):
        """Test GET /api/status endpoint"""
        success, response = self.make_request('GET', 'status', params={'limit': 10})
        if success and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                return self.log_test("Get Status Checks", True, f"- Found {len(data)} status checks")
            else:
                return self.log_test("Get Status Checks", False, f"- Expected list, got: {type(data)}")
        else:
            error_msg = response if isinstance(response, str) else f"Status: {response.status_code}"
            return self.log_test("Get Status Checks", False, f"- {error_msg}")

    def test_mobile_sync(self):
        """Test POST /api/mobile/sync endpoint"""
        if not self.created_user_id:
            return self.log_test("Mobile Sync", False, "- No user ID available")
        
        # The endpoint expects user_id as query parameter
        params = {"user_id": self.created_user_id}
        
        success, response = self.make_request('POST', 'mobile/sync', params=params)
        if success and response.status_code == 200:
            data = response.json()
            if data.get('success') and 'sync_time' in data:
                return self.log_test("Mobile Sync", True, f"- Synced {data.get('data_count', 0)} items")
            else:
                return self.log_test("Mobile Sync", False, f"- Invalid sync response: {data}")
        else:
            error_msg = response if isinstance(response, str) else f"Status: {response.status_code}"
            if hasattr(response, 'text'):
                error_msg += f" - {response.text}"
            return self.log_test("Mobile Sync", False, f"- {error_msg}")

    def test_create_mobile_user(self):
        """Test creating a mobile user for integration testing"""
        mobile_user = {
            "name": f"Mobile User {datetime.now().strftime('%H%M%S')}",
            "email": f"mobile{datetime.now().strftime('%H%M%S')}@example.com",
            "platform": "mobile"
        }
        
        success, response = self.make_request('POST', 'users', mobile_user)
        if success and response.status_code == 200:
            data = response.json()
            if data.get('platform') == 'mobile':
                return self.log_test("Create Mobile User", True, f"- Created mobile user: {data['name']}")
            else:
                return self.log_test("Create Mobile User", False, f"- Platform mismatch: {data}")
        else:
            error_msg = response if isinstance(response, str) else f"Status: {response.status_code}"
            return self.log_test("Create Mobile User", False, f"- {error_msg}")

    def run_all_tests(self):
        """Run all backend API tests"""
        print("🚀 Starting Web-Mobile Connect API Tests")
        print(f"📡 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Basic API tests
        self.test_root_endpoint()
        self.test_health_check()
        self.test_get_stats()
        
        # User management tests
        self.test_create_user()
        self.test_get_users()
        self.test_get_specific_user()
        self.test_update_user_activity()
        
        # Status check tests
        self.test_create_status_check()
        self.test_get_status_checks()
        
        # Mobile integration tests
        self.test_mobile_sync()
        self.test_create_mobile_user()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed! Backend API is working correctly.")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed. Check the issues above.")
            return 1

def main():
    tester = WebMobileConnectTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())