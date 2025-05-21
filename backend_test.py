import requests
import unittest
import random
import string
import time
from datetime import datetime

class GameAPITester(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.base_url = "https://4956a8a9-372a-4581-a6e3-7e3b7659d3dc.preview.emergentagent.com/api"
        self.token = None
        self.user = None
        self.test_username = f"testuser_{int(time.time())}"
        self.test_password = "TestPassword123!"
        self.test_company = "Test Company"

    def test_01_register_user(self):
        """Test user registration"""
        print(f"\n🔍 Testing user registration with username: {self.test_username}")
        
        response = requests.post(
            f"{self.base_url}/register",
            json={
                "username": self.test_username,
                "password": self.test_password,
                "email": f"{self.test_username}@example.com",
                "full_name": "Test User",
                "company": self.test_company
            }
        )
        
        self.assertEqual(response.status_code, 200, f"Registration failed: {response.text}")
        user_data = response.json()
        self.assertEqual(user_data["username"], self.test_username)
        self.assertEqual(user_data["company"], self.test_company)
        print("✅ User registration successful")
        
    def test_02_login(self):
        """Test user login"""
        print(f"\n🔍 Testing user login with username: {self.test_username}")
        
        response = requests.post(
            f"{self.base_url}/login",
            data={
                "username": self.test_username,
                "password": self.test_password
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        self.assertEqual(response.status_code, 200, f"Login failed: {response.text}")
        token_data = response.json()
        self.assertIn("access_token", token_data)
        self.token = token_data["access_token"]
        print("✅ User login successful")
        
    def test_03_get_user_profile(self):
        """Test getting user profile"""
        print("\n🔍 Testing get user profile")
        
        response = requests.get(
            f"{self.base_url}/users/me",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        self.assertEqual(response.status_code, 200, f"Get profile failed: {response.text}")
        user_data = response.json()
        self.assertEqual(user_data["username"], self.test_username)
        self.user = user_data
        print("✅ Get user profile successful")
        
    def test_04_get_whac_deficiencies(self):
        """Test getting whac-a-deficiency game deficiencies"""
        print("\n🔍 Testing get whac-a-deficiency deficiencies")
        
        response = requests.get(
            f"{self.base_url}/whac-a-deficiency/deficiencies",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        self.assertEqual(response.status_code, 200, f"Get deficiencies failed: {response.text}")
        deficiencies = response.json()
        self.assertTrue(len(deficiencies) > 0, "No deficiencies returned")
        print(f"✅ Retrieved {len(deficiencies)} deficiencies successfully")
        
    def test_05_get_paris_metro_stations(self):
        """Test getting Paris metro stations"""
        print("\n🔍 Testing get Paris metro stations")
        
        response = requests.get(
            f"{self.base_url}/paris-metro/stations",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        self.assertEqual(response.status_code, 200, f"Get stations failed: {response.text}")
        stations = response.json()
        self.assertTrue(len(stations) > 0, "No stations returned")
        print(f"✅ Retrieved {len(stations)} stations successfully")
        
    def test_06_submit_whac_score(self):
        """Test submitting a whac-a-deficiency score"""
        print("\n🔍 Testing submit whac-a-deficiency score")
        
        score = random.randint(50, 500)
        response = requests.post(
            f"{self.base_url}/scores",
            json={
                "game_type": "whac_a_deficiency",
                "score": score,
                "time_taken": 60.0
            },
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        self.assertEqual(response.status_code, 200, f"Submit score failed: {response.text}")
        score_data = response.json()
        self.assertEqual(score_data["score"], score)
        self.assertEqual(score_data["game_type"], "whac_a_deficiency")
        print(f"✅ Submitted whac-a-deficiency score of {score} successfully")
        
    def test_07_submit_paris_metro_score(self):
        """Test submitting a Paris metro score"""
        print("\n🔍 Testing submit Paris metro score")
        
        score = random.randint(50, 100)
        response = requests.post(
            f"{self.base_url}/scores",
            json={
                "game_type": "paris_metro",
                "score": score,
                "time_taken": 25.5
            },
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        self.assertEqual(response.status_code, 200, f"Submit score failed: {response.text}")
        score_data = response.json()
        self.assertEqual(score_data["score"], score)
        self.assertEqual(score_data["game_type"], "paris_metro")
        print(f"✅ Submitted Paris metro score of {score} successfully")
        
    def test_08_check_paris_metro_route(self):
        """Test checking a Paris metro route"""
        print("\n🔍 Testing check Paris metro route")
        
        # First get the stations
        response = requests.get(
            f"{self.base_url}/paris-metro/stations",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        self.assertEqual(response.status_code, 200, f"Get stations failed: {response.text}")
        stations = response.json()
        
        # Create a route with the first and last stations
        station_ids = list(stations.keys())
        route = [station_ids[0], station_ids[-1]]
        
        response = requests.post(
            f"{self.base_url}/paris-metro/check-route",
            json=route,
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        # The route might not be valid, but we should get a response
        self.assertIn(response.status_code, [200, 400], f"Check route failed: {response.text}")
        route_data = response.json()
        print(f"✅ Route check response received: {route_data}")
        
    def test_09_get_highscores(self):
        """Test getting highscores"""
        print("\n🔍 Testing get highscores")
        
        for game_type in ["whac_a_deficiency", "paris_metro"]:
            response = requests.get(
                f"{self.base_url}/scores/highscores/{game_type}",
                headers={"Authorization": f"Bearer {self.token}"}
            )
            
            self.assertEqual(response.status_code, 200, f"Get highscores failed: {response.text}")
            highscores = response.json()
            print(f"✅ Retrieved {len(highscores)} highscores for {game_type}")
        
    def test_10_get_user_scores(self):
        """Test getting user scores"""
        print("\n🔍 Testing get user scores")
        
        response = requests.get(
            f"{self.base_url}/scores/user",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        
        self.assertEqual(response.status_code, 200, f"Get user scores failed: {response.text}")
        scores = response.json()
        self.assertEqual(len(scores), 2, f"Expected 2 scores, got {len(scores)}")
        print(f"✅ Retrieved {len(scores)} user scores successfully")

def run_tests():
    # Create a test suite
    suite = unittest.TestSuite()
    
    # Add tests in order
    tester = GameAPITester()
    for i in range(1, 11):
        test_name = f"test_{i:02d}_" + getattr(GameAPITester, f"test_{i:02d}_").__doc__.split()[1].lower()
        suite.addTest(GameAPITester(test_name))
    
    # Run the tests
    runner = unittest.TextTestRunner(verbosity=2)
    runner.run(suite)

if __name__ == "__main__":
    run_tests()
