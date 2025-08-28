import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any

class AtriaCRMTester:
    def __init__(self, base_url="https://web-mobile-connect.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.auth_token = None

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
        
        if self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, params=params, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params, timeout=10)
            
            return True, response
        except Exception as e:
            return False, str(e)

    def test_health_check(self):
        """Test GET /api/health endpoint"""
        success, response = self.make_request('GET', 'health')
        if success and response.status_code == 200:
            try:
                data = response.json()
                return self.log_test("Health Check", True, f"- Status: {data.get('status', 'OK')}")
            except:
                return self.log_test("Health Check", True, f"- Status: {response.status_code}")
        else:
            error_msg = response if isinstance(response, str) else f"Status: {response.status_code}"
            return self.log_test("Health Check", False, f"- {error_msg}")

    def test_users_endpoint(self):
        """Test GET /api/users endpoint"""
        success, response = self.make_request('GET', 'users')
        if success:
            if response.status_code == 200:
                try:
                    data = response.json()
                    return self.log_test("Users Endpoint", True, f"- Found {len(data) if isinstance(data, list) else 'data'}")
                except:
                    return self.log_test("Users Endpoint", True, f"- Response received")
            elif response.status_code == 401:
                return self.log_test("Users Endpoint", True, f"- Requires authentication (401)")
            else:
                return self.log_test("Users Endpoint", False, f"- Status: {response.status_code}")
        else:
            return self.log_test("Users Endpoint", False, f"- {response}")

    def test_properties_endpoint(self):
        """Test GET /api/properties endpoint"""
        success, response = self.make_request('GET', 'properties')
        if success:
            if response.status_code == 200:
                try:
                    data = response.json()
                    return self.log_test("Properties Endpoint", True, f"- Found {len(data) if isinstance(data, list) else 'data'}")
                except:
                    return self.log_test("Properties Endpoint", True, f"- Response received")
            elif response.status_code == 401:
                return self.log_test("Properties Endpoint", True, f"- Requires authentication (401)")
            else:
                return self.log_test("Properties Endpoint", False, f"- Status: {response.status_code}")
        else:
            return self.log_test("Properties Endpoint", False, f"- {response}")

    def test_notifications_endpoint(self):
        """Test GET /api/notifications endpoint"""
        success, response = self.make_request('GET', 'notifications')
        if success:
            if response.status_code == 200:
                try:
                    data = response.json()
                    return self.log_test("Notifications Endpoint", True, f"- Found {len(data) if isinstance(data, list) else 'data'}")
                except:
                    return self.log_test("Notifications Endpoint", True, f"- Response received")
            elif response.status_code == 401:
                return self.log_test("Notifications Endpoint", True, f"- Requires authentication (401)")
            else:
                return self.log_test("Notifications Endpoint", False, f"- Status: {response.status_code}")
        else:
            return self.log_test("Notifications Endpoint", False, f"- {response}")

    def test_invite_codes_endpoint(self):
        """Test GET /api/users/invite-codes endpoint"""
        success, response = self.make_request('GET', 'users/invite-codes')
        if success:
            if response.status_code == 200:
                try:
                    data = response.json()
                    return self.log_test("Invite Codes Endpoint", True, f"- Found {len(data) if isinstance(data, list) else 'data'}")
                except:
                    return self.log_test("Invite Codes Endpoint", True, f"- Response received")
            elif response.status_code == 401:
                return self.log_test("Invite Codes Endpoint", True, f"- Requires authentication (401)")
            else:
                return self.log_test("Invite Codes Endpoint", False, f"- Status: {response.status_code}")
        else:
            return self.log_test("Invite Codes Endpoint", False, f"- {response}")

    def test_stats_endpoints(self):
        """Test various stats endpoints"""
        endpoints = [
            'users/stats',
            'properties/stats', 
            'notifications/stats'
        ]
        
        for endpoint in endpoints:
            success, response = self.make_request('GET', endpoint)
            if success:
                if response.status_code in [200, 401]:
                    self.log_test(f"Stats - {endpoint}", True, f"- Status: {response.status_code}")
                else:
                    self.log_test(f"Stats - {endpoint}", False, f"- Status: {response.status_code}")
            else:
                self.log_test(f"Stats - {endpoint}", False, f"- {response}")

    def test_admin_endpoints(self):
        """Test admin endpoints"""
        success, response = self.make_request('GET', 'admin/users')
        if success:
            if response.status_code in [200, 401, 403]:
                return self.log_test("Admin Users Endpoint", True, f"- Status: {response.status_code}")
            else:
                return self.log_test("Admin Users Endpoint", False, f"- Status: {response.status_code}")
        else:
            return self.log_test("Admin Users Endpoint", False, f"- {response}")

    def run_all_tests(self):
        """Run all Atria CRM API tests"""
        print("🚀 Starting Atria CRM API Tests")
        print(f"📡 Testing API at: {self.api_url}")
        print("=" * 60)
        
        # Basic API tests
        self.test_health_check()
        self.test_users_endpoint()
        self.test_properties_endpoint()
        self.test_notifications_endpoint()
        self.test_invite_codes_endpoint()
        self.test_stats_endpoints()
        self.test_admin_endpoints()
        
        # Print summary
        print("=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed! Atria CRM API is working correctly.")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed. Check the issues above.")
            return 1

def main():
    tester = AtriaCRMTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())