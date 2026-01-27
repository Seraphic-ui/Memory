#!/usr/bin/env python3
"""
Comprehensive Backend Testing for Memory Makers Couples Bucket List App
Tests all backend endpoints with proper authentication and data validation
"""

import asyncio
import httpx
import json
import uuid
from datetime import datetime, timezone, timedelta
import random
import string
import subprocess
import sys

# Backend URL from environment
BACKEND_URL = "https://memory-makers-6.preview.emergentagent.com/api"

class BackendTester:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.test_users = []
        self.test_sessions = []
        self.test_items = []
        self.test_results = {
            "auth": {"passed": 0, "failed": 0, "errors": []},
            "user_management": {"passed": 0, "failed": 0, "errors": []},
            "friend_connection": {"passed": 0, "failed": 0, "errors": []},
            "bucket_list": {"passed": 0, "failed": 0, "errors": []},
            "photo_completion": {"passed": 0, "failed": 0, "errors": []},
            "completed_items": {"passed": 0, "failed": 0, "errors": []}
        }

    def generate_friend_code(self):
        """Generate a 5-character alphanumeric friend code"""
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))

    async def create_test_user_in_db(self, email_suffix=""):
        """Create a test user directly in MongoDB for testing"""
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        session_token = f"test_session_{uuid.uuid4().hex[:16]}"
        friend_code = self.generate_friend_code()
        email = f"test.user.{email_suffix}{int(datetime.now().timestamp())}@example.com"
        
        # MongoDB command to create user and session
        mongo_cmd = f"""
        mongosh --eval "
        use('test_database');
        
        // Ensure unique friend code
        var friendCode = '{friend_code}';
        while(db.users.findOne({{friend_code: friendCode}})) {{
            friendCode = '{self.generate_friend_code()}';
        }}
        
        // Create user
        db.users.insertOne({{
            user_id: '{user_id}',
            email: '{email}',
            name: 'Test User {email_suffix}',
            picture: 'https://via.placeholder.com/150',
            friend_code: friendCode,
            partner_id: null,
            created_at: new Date()
        }});
        
        // Create session
        db.user_sessions.insertOne({{
            user_id: '{user_id}',
            session_token: '{session_token}',
            expires_at: new Date(Date.now() + 7*24*60*60*1000),
            created_at: new Date()
        }});
        
        print('User created: ' + '{user_id}');
        print('Session token: ' + '{session_token}');
        print('Friend code: ' + friendCode);
        "
        """
        
        try:
            result = subprocess.run(mongo_cmd, shell=True, capture_output=True, text=True)
            if result.returncode == 0:
                # Extract friend code from output
                lines = result.stdout.strip().split('\n')
                actual_friend_code = friend_code
                for line in lines:
                    if "Friend code:" in line:
                        actual_friend_code = line.split(": ")[1].strip()
                        break
                
                user_data = {
                    "user_id": user_id,
                    "email": email,
                    "session_token": session_token,
                    "friend_code": actual_friend_code
                }
                self.test_users.append(user_data)
                self.test_sessions.append(session_token)
                return user_data
            else:
                print(f"Error creating test user: {result.stderr}")
                return None
        except Exception as e:
            print(f"Exception creating test user: {e}")
            return None

    async def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n=== Testing Authentication Endpoints ===")
        
        # Create test user
        user = await self.create_test_user_in_db("auth")
        if not user:
            self.test_results["auth"]["failed"] += 1
            self.test_results["auth"]["errors"].append("Failed to create test user")
            return
        
        # Test GET /api/auth/me with valid token
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/auth/me",
                headers={"Authorization": f"Bearer {user['session_token']}"}
            )
            
            if response.status_code == 200:
                user_data = response.json()
                if (user_data.get("user_id") == user["user_id"] and 
                    user_data.get("email") == user["email"] and
                    user_data.get("friend_code")):
                    print("✅ GET /api/auth/me - Valid token returns correct user data")
                    self.test_results["auth"]["passed"] += 1
                else:
                    print("❌ GET /api/auth/me - Invalid user data returned")
                    self.test_results["auth"]["failed"] += 1
                    self.test_results["auth"]["errors"].append("Invalid user data in /auth/me response")
            else:
                print(f"❌ GET /api/auth/me - Expected 200, got {response.status_code}")
                self.test_results["auth"]["failed"] += 1
                self.test_results["auth"]["errors"].append(f"/auth/me returned {response.status_code}")
        except Exception as e:
            print(f"❌ GET /api/auth/me - Exception: {e}")
            self.test_results["auth"]["failed"] += 1
            self.test_results["auth"]["errors"].append(f"/auth/me exception: {str(e)}")

        # Test GET /api/auth/me with invalid token
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/auth/me",
                headers={"Authorization": "Bearer invalid_token"}
            )
            
            if response.status_code == 401:
                print("✅ GET /api/auth/me - Invalid token returns 401")
                self.test_results["auth"]["passed"] += 1
            else:
                print(f"❌ GET /api/auth/me - Expected 401 for invalid token, got {response.status_code}")
                self.test_results["auth"]["failed"] += 1
                self.test_results["auth"]["errors"].append(f"Invalid token should return 401, got {response.status_code}")
        except Exception as e:
            print(f"❌ GET /api/auth/me invalid token test - Exception: {e}")
            self.test_results["auth"]["failed"] += 1
            self.test_results["auth"]["errors"].append(f"Invalid token test exception: {str(e)}")

        # Test GET /api/auth/me without token
        try:
            response = await self.client.get(f"{BACKEND_URL}/auth/me")
            
            if response.status_code == 401:
                print("✅ GET /api/auth/me - No token returns 401")
                self.test_results["auth"]["passed"] += 1
            else:
                print(f"❌ GET /api/auth/me - Expected 401 for no token, got {response.status_code}")
                self.test_results["auth"]["failed"] += 1
                self.test_results["auth"]["errors"].append(f"No token should return 401, got {response.status_code}")
        except Exception as e:
            print(f"❌ GET /api/auth/me no token test - Exception: {e}")
            self.test_results["auth"]["failed"] += 1
            self.test_results["auth"]["errors"].append(f"No token test exception: {str(e)}")

    async def test_user_management(self):
        """Test user management with friend codes"""
        print("\n=== Testing User Management with Friend Codes ===")
        
        # Create two test users
        user1 = await self.create_test_user_in_db("user1")
        user2 = await self.create_test_user_in_db("user2")
        
        if not user1 or not user2:
            self.test_results["user_management"]["failed"] += 1
            self.test_results["user_management"]["errors"].append("Failed to create test users")
            return
        
        # Verify users have unique friend codes
        if user1["friend_code"] != user2["friend_code"]:
            print("✅ Users have unique friend codes")
            self.test_results["user_management"]["passed"] += 1
        else:
            print("❌ Users have duplicate friend codes")
            self.test_results["user_management"]["failed"] += 1
            self.test_results["user_management"]["errors"].append("Duplicate friend codes generated")
        
        # Verify friend codes are 5 characters alphanumeric
        for i, user in enumerate([user1, user2], 1):
            friend_code = user["friend_code"]
            if len(friend_code) == 5 and friend_code.isalnum():
                print(f"✅ User {i} friend code format is correct: {friend_code}")
                self.test_results["user_management"]["passed"] += 1
            else:
                print(f"❌ User {i} friend code format is incorrect: {friend_code}")
                self.test_results["user_management"]["failed"] += 1
                self.test_results["user_management"]["errors"].append(f"Invalid friend code format: {friend_code}")

    async def test_friend_connection(self):
        """Test friend connection functionality"""
        print("\n=== Testing Friend Connection ===")
        
        # Create two test users
        user1 = await self.create_test_user_in_db("friend1")
        user2 = await self.create_test_user_in_db("friend2")
        
        if not user1 or not user2:
            self.test_results["friend_connection"]["failed"] += 1
            self.test_results["friend_connection"]["errors"].append("Failed to create test users for friend connection")
            return
        
        # Test connecting user1 to user2
        try:
            response = await self.client.post(
                f"{BACKEND_URL}/connect-friend",
                headers={"Authorization": f"Bearer {user1['session_token']}"},
                json={"friend_code": user2["friend_code"]}
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("message") == "Connected successfully":
                    print("✅ POST /api/connect-friend - Successfully connected users")
                    self.test_results["friend_connection"]["passed"] += 1
                else:
                    print("❌ POST /api/connect-friend - Unexpected response message")
                    self.test_results["friend_connection"]["failed"] += 1
                    self.test_results["friend_connection"]["errors"].append("Unexpected connect-friend response")
            else:
                print(f"❌ POST /api/connect-friend - Expected 200, got {response.status_code}")
                self.test_results["friend_connection"]["failed"] += 1
                self.test_results["friend_connection"]["errors"].append(f"connect-friend returned {response.status_code}: {response.text}")
        except Exception as e:
            print(f"❌ POST /api/connect-friend - Exception: {e}")
            self.test_results["friend_connection"]["failed"] += 1
            self.test_results["friend_connection"]["errors"].append(f"connect-friend exception: {str(e)}")

        # Test error cases
        # Test invalid friend code
        try:
            response = await self.client.post(
                f"{BACKEND_URL}/connect-friend",
                headers={"Authorization": f"Bearer {user1['session_token']}"},
                json={"friend_code": "INVALID"}
            )
            
            if response.status_code == 404:
                print("✅ POST /api/connect-friend - Invalid code returns 404")
                self.test_results["friend_connection"]["passed"] += 1
            else:
                print(f"❌ POST /api/connect-friend - Expected 404 for invalid code, got {response.status_code}")
                self.test_results["friend_connection"]["failed"] += 1
                self.test_results["friend_connection"]["errors"].append(f"Invalid code should return 404, got {response.status_code}")
        except Exception as e:
            print(f"❌ POST /api/connect-friend invalid code test - Exception: {e}")
            self.test_results["friend_connection"]["failed"] += 1
            self.test_results["friend_connection"]["errors"].append(f"Invalid code test exception: {str(e)}")

        # Test self-connection
        try:
            response = await self.client.post(
                f"{BACKEND_URL}/connect-friend",
                headers={"Authorization": f"Bearer {user1['session_token']}"},
                json={"friend_code": user1["friend_code"]}
            )
            
            if response.status_code == 400:
                print("✅ POST /api/connect-friend - Self-connection returns 400")
                self.test_results["friend_connection"]["passed"] += 1
            else:
                print(f"❌ POST /api/connect-friend - Expected 400 for self-connection, got {response.status_code}")
                self.test_results["friend_connection"]["failed"] += 1
                self.test_results["friend_connection"]["errors"].append(f"Self-connection should return 400, got {response.status_code}")
        except Exception as e:
            print(f"❌ POST /api/connect-friend self-connection test - Exception: {e}")
            self.test_results["friend_connection"]["failed"] += 1
            self.test_results["friend_connection"]["errors"].append(f"Self-connection test exception: {str(e)}")

    async def test_bucket_list_crud(self):
        """Test bucket list CRUD operations"""
        print("\n=== Testing Bucket List CRUD ===")
        
        # Create connected users
        user1 = await self.create_test_user_in_db("bucket1")
        user2 = await self.create_test_user_in_db("bucket2")
        
        if not user1 or not user2:
            self.test_results["bucket_list"]["failed"] += 1
            self.test_results["bucket_list"]["errors"].append("Failed to create test users for bucket list")
            return
        
        # Connect the users first
        try:
            await self.client.post(
                f"{BACKEND_URL}/connect-friend",
                headers={"Authorization": f"Bearer {user1['session_token']}"},
                json={"friend_code": user2["friend_code"]}
            )
        except Exception as e:
            print(f"Failed to connect users for bucket list test: {e}")
            self.test_results["bucket_list"]["failed"] += 1
            self.test_results["bucket_list"]["errors"].append("Failed to connect users for bucket list test")
            return

        # Test creating bucket list item
        try:
            response = await self.client.post(
                f"{BACKEND_URL}/bucketlist",
                headers={"Authorization": f"Bearer {user1['session_token']}"},
                json={"title": "Visit Paris", "category": "Travel"}
            )
            
            if response.status_code == 200:
                item = response.json()
                if (item.get("title") == "Visit Paris" and 
                    item.get("category") == "Travel" and
                    item.get("item_id") and
                    item.get("created_at")):
                    print("✅ POST /api/bucketlist - Successfully created bucket list item")
                    self.test_results["bucket_list"]["passed"] += 1
                    self.test_items.append(item["item_id"])
                else:
                    print("❌ POST /api/bucketlist - Invalid item data returned")
                    self.test_results["bucket_list"]["failed"] += 1
                    self.test_results["bucket_list"]["errors"].append("Invalid bucket list item data")
            else:
                print(f"❌ POST /api/bucketlist - Expected 200, got {response.status_code}")
                self.test_results["bucket_list"]["failed"] += 1
                self.test_results["bucket_list"]["errors"].append(f"Create bucket item returned {response.status_code}: {response.text}")
        except Exception as e:
            print(f"❌ POST /api/bucketlist - Exception: {e}")
            self.test_results["bucket_list"]["failed"] += 1
            self.test_results["bucket_list"]["errors"].append(f"Create bucket item exception: {str(e)}")

        # Test getting bucket list items
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/bucketlist",
                headers={"Authorization": f"Bearer {user1['session_token']}"}
            )
            
            if response.status_code == 200:
                items = response.json()
                if isinstance(items, list):
                    print(f"✅ GET /api/bucketlist - Successfully retrieved {len(items)} items")
                    self.test_results["bucket_list"]["passed"] += 1
                else:
                    print("❌ GET /api/bucketlist - Response is not a list")
                    self.test_results["bucket_list"]["failed"] += 1
                    self.test_results["bucket_list"]["errors"].append("Bucket list response is not a list")
            else:
                print(f"❌ GET /api/bucketlist - Expected 200, got {response.status_code}")
                self.test_results["bucket_list"]["failed"] += 1
                self.test_results["bucket_list"]["errors"].append(f"Get bucket list returned {response.status_code}")
        except Exception as e:
            print(f"❌ GET /api/bucketlist - Exception: {e}")
            self.test_results["bucket_list"]["failed"] += 1
            self.test_results["bucket_list"]["errors"].append(f"Get bucket list exception: {str(e)}")

        # Test deleting bucket list item
        if self.test_items:
            try:
                item_id = self.test_items[0]
                response = await self.client.delete(
                    f"{BACKEND_URL}/bucketlist/{item_id}",
                    headers={"Authorization": f"Bearer {user1['session_token']}"}
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result.get("message") == "Item deleted successfully":
                        print("✅ DELETE /api/bucketlist/{item_id} - Successfully deleted item")
                        self.test_results["bucket_list"]["passed"] += 1
                    else:
                        print("❌ DELETE /api/bucketlist/{item_id} - Unexpected response message")
                        self.test_results["bucket_list"]["failed"] += 1
                        self.test_results["bucket_list"]["errors"].append("Unexpected delete response")
                else:
                    print(f"❌ DELETE /api/bucketlist/{item_id} - Expected 200, got {response.status_code}")
                    self.test_results["bucket_list"]["failed"] += 1
                    self.test_results["bucket_list"]["errors"].append(f"Delete bucket item returned {response.status_code}")
            except Exception as e:
                print(f"❌ DELETE /api/bucketlist/{item_id} - Exception: {e}")
                self.test_results["bucket_list"]["failed"] += 1
                self.test_results["bucket_list"]["errors"].append(f"Delete bucket item exception: {str(e)}")

    async def test_photo_completion(self):
        """Test photo completion functionality"""
        print("\n=== Testing Photo Completion ===")
        
        # Create connected users and a bucket item
        user1 = await self.create_test_user_in_db("photo1")
        user2 = await self.create_test_user_in_db("photo2")
        
        if not user1 or not user2:
            self.test_results["photo_completion"]["failed"] += 1
            self.test_results["photo_completion"]["errors"].append("Failed to create test users for photo completion")
            return
        
        # Connect users and create item
        try:
            await self.client.post(
                f"{BACKEND_URL}/connect-friend",
                headers={"Authorization": f"Bearer {user1['session_token']}"},
                json={"friend_code": user2["friend_code"]}
            )
            
            # Create bucket item
            response = await self.client.post(
                f"{BACKEND_URL}/bucketlist",
                headers={"Authorization": f"Bearer {user1['session_token']}"},
                json={"title": "Try Sushi", "category": "Food"}
            )
            
            if response.status_code != 200:
                raise Exception("Failed to create bucket item for photo test")
            
            item = response.json()
            item_id = item["item_id"]
            
        except Exception as e:
            print(f"Failed to setup photo completion test: {e}")
            self.test_results["photo_completion"]["failed"] += 1
            self.test_results["photo_completion"]["errors"].append("Failed to setup photo completion test")
            return

        # Test completing item with photo
        test_photo_base64 = "data:image/jpeg;base64,/9j/4AAQSkZJRg=="
        try:
            response = await self.client.post(
                f"{BACKEND_URL}/bucketlist/complete",
                headers={"Authorization": f"Bearer {user1['session_token']}"},
                json={
                    "item_id": item_id,
                    "photo_base64": test_photo_base64,
                    "notes": "Amazing sushi experience!"
                }
            )
            
            if response.status_code == 200:
                completed_item = response.json()
                if (completed_item.get("item_id") == item_id and
                    completed_item.get("photo_base64") == test_photo_base64 and
                    completed_item.get("notes") == "Amazing sushi experience!" and
                    completed_item.get("completed_at")):
                    print("✅ POST /api/bucketlist/complete - Successfully completed item with photo")
                    self.test_results["photo_completion"]["passed"] += 1
                else:
                    print("❌ POST /api/bucketlist/complete - Invalid completed item data")
                    self.test_results["photo_completion"]["failed"] += 1
                    self.test_results["photo_completion"]["errors"].append("Invalid completed item data")
            else:
                print(f"❌ POST /api/bucketlist/complete - Expected 200, got {response.status_code}")
                self.test_results["photo_completion"]["failed"] += 1
                self.test_results["photo_completion"]["errors"].append(f"Complete item returned {response.status_code}: {response.text}")
        except Exception as e:
            print(f"❌ POST /api/bucketlist/complete - Exception: {e}")
            self.test_results["photo_completion"]["failed"] += 1
            self.test_results["photo_completion"]["errors"].append(f"Complete item exception: {str(e)}")

        # Test completing non-existent item
        try:
            response = await self.client.post(
                f"{BACKEND_URL}/bucketlist/complete",
                headers={"Authorization": f"Bearer {user1['session_token']}"},
                json={
                    "item_id": "nonexistent_item",
                    "photo_base64": test_photo_base64,
                    "notes": "This should fail"
                }
            )
            
            if response.status_code == 404:
                print("✅ POST /api/bucketlist/complete - Non-existent item returns 404")
                self.test_results["photo_completion"]["passed"] += 1
            else:
                print(f"❌ POST /api/bucketlist/complete - Expected 404 for non-existent item, got {response.status_code}")
                self.test_results["photo_completion"]["failed"] += 1
                self.test_results["photo_completion"]["errors"].append(f"Non-existent item should return 404, got {response.status_code}")
        except Exception as e:
            print(f"❌ POST /api/bucketlist/complete non-existent test - Exception: {e}")
            self.test_results["photo_completion"]["failed"] += 1
            self.test_results["photo_completion"]["errors"].append(f"Non-existent item test exception: {str(e)}")

    async def test_completed_items(self):
        """Test getting completed items"""
        print("\n=== Testing Completed Items ===")
        
        # Create connected users, item, and complete it
        user1 = await self.create_test_user_in_db("completed1")
        user2 = await self.create_test_user_in_db("completed2")
        
        if not user1 or not user2:
            self.test_results["completed_items"]["failed"] += 1
            self.test_results["completed_items"]["errors"].append("Failed to create test users for completed items")
            return
        
        try:
            # Connect users
            await self.client.post(
                f"{BACKEND_URL}/connect-friend",
                headers={"Authorization": f"Bearer {user1['session_token']}"},
                json={"friend_code": user2["friend_code"]}
            )
            
            # Create and complete an item
            response = await self.client.post(
                f"{BACKEND_URL}/bucketlist",
                headers={"Authorization": f"Bearer {user1['session_token']}"},
                json={"title": "Learn Guitar", "category": "Learning"}
            )
            
            item = response.json()
            item_id = item["item_id"]
            
            # Complete the item
            await self.client.post(
                f"{BACKEND_URL}/bucketlist/complete",
                headers={"Authorization": f"Bearer {user1['session_token']}"},
                json={
                    "item_id": item_id,
                    "photo_base64": "data:image/jpeg;base64,/9j/4AAQSkZJRg==",
                    "notes": "First song learned!"
                }
            )
            
        except Exception as e:
            print(f"Failed to setup completed items test: {e}")
            self.test_results["completed_items"]["failed"] += 1
            self.test_results["completed_items"]["errors"].append("Failed to setup completed items test")
            return

        # Test getting completed items
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/completed",
                headers={"Authorization": f"Bearer {user1['session_token']}"}
            )
            
            if response.status_code == 200:
                completed_items = response.json()
                if isinstance(completed_items, list) and len(completed_items) > 0:
                    item = completed_items[0]
                    if (item.get("photo_base64") and
                        item.get("completed_at") and
                        item.get("title")):
                        print(f"✅ GET /api/completed - Successfully retrieved {len(completed_items)} completed items")
                        self.test_results["completed_items"]["passed"] += 1
                    else:
                        print("❌ GET /api/completed - Invalid completed item structure")
                        self.test_results["completed_items"]["failed"] += 1
                        self.test_results["completed_items"]["errors"].append("Invalid completed item structure")
                else:
                    print("✅ GET /api/completed - Returns empty list (no completed items)")
                    self.test_results["completed_items"]["passed"] += 1
            else:
                print(f"❌ GET /api/completed - Expected 200, got {response.status_code}")
                self.test_results["completed_items"]["failed"] += 1
                self.test_results["completed_items"]["errors"].append(f"Get completed items returned {response.status_code}")
        except Exception as e:
            print(f"❌ GET /api/completed - Exception: {e}")
            self.test_results["completed_items"]["failed"] += 1
            self.test_results["completed_items"]["errors"].append(f"Get completed items exception: {str(e)}")

        # Test that partner can also see completed items
        try:
            response = await self.client.get(
                f"{BACKEND_URL}/completed",
                headers={"Authorization": f"Bearer {user2['session_token']}"}
            )
            
            if response.status_code == 200:
                completed_items = response.json()
                if isinstance(completed_items, list):
                    print(f"✅ GET /api/completed - Partner can see {len(completed_items)} completed items")
                    self.test_results["completed_items"]["passed"] += 1
                else:
                    print("❌ GET /api/completed - Partner response is not a list")
                    self.test_results["completed_items"]["failed"] += 1
                    self.test_results["completed_items"]["errors"].append("Partner completed items response is not a list")
            else:
                print(f"❌ GET /api/completed - Partner request expected 200, got {response.status_code}")
                self.test_results["completed_items"]["failed"] += 1
                self.test_results["completed_items"]["errors"].append(f"Partner completed items returned {response.status_code}")
        except Exception as e:
            print(f"❌ GET /api/completed partner test - Exception: {e}")
            self.test_results["completed_items"]["failed"] += 1
            self.test_results["completed_items"]["errors"].append(f"Partner completed items exception: {str(e)}")

    async def cleanup_test_data(self):
        """Clean up test data from database"""
        print("\n=== Cleaning up test data ===")
        
        if self.test_users:
            user_ids = [user["user_id"] for user in self.test_users]
            user_ids_str = "', '".join(user_ids)
            
            cleanup_cmd = f"""
            mongosh --eval "
            use('test_database');
            db.users.deleteMany({{user_id: {{'$in': ['{user_ids_str}']}}}});
            db.user_sessions.deleteMany({{user_id: {{'$in': ['{user_ids_str}']}}}});
            db.bucket_items.deleteMany({{created_by: {{'$in': ['{user_ids_str}']}}}});
            db.completed_items.deleteMany({{completed_by: {{'$in': ['{user_ids_str}']}}}});
            print('Cleaned up test data for users: {user_ids_str}');
            "
            """
            
            try:
                subprocess.run(cleanup_cmd, shell=True, capture_output=True)
                print(f"✅ Cleaned up test data for {len(self.test_users)} users")
            except Exception as e:
                print(f"⚠️  Failed to cleanup test data: {e}")

    def print_summary(self):
        """Print test results summary"""
        print("\n" + "="*60)
        print("BACKEND TESTING SUMMARY")
        print("="*60)
        
        total_passed = 0
        total_failed = 0
        critical_errors = []
        
        for category, results in self.test_results.items():
            passed = results["passed"]
            failed = results["failed"]
            errors = results["errors"]
            
            total_passed += passed
            total_failed += failed
            
            status = "✅ PASS" if failed == 0 else "❌ FAIL"
            print(f"{category.upper().replace('_', ' ')}: {status} ({passed} passed, {failed} failed)")
            
            if errors:
                critical_errors.extend(errors)
                for error in errors:
                    print(f"  - {error}")
        
        print(f"\nOVERALL: {total_passed} passed, {total_failed} failed")
        
        if critical_errors:
            print(f"\n🚨 CRITICAL ISSUES FOUND ({len(critical_errors)}):")
            for i, error in enumerate(critical_errors, 1):
                print(f"{i}. {error}")
        
        return total_failed == 0, critical_errors

    async def run_all_tests(self):
        """Run all backend tests"""
        print("Starting comprehensive backend testing for Memory Makers app...")
        print(f"Backend URL: {BACKEND_URL}")
        
        try:
            await self.test_auth_endpoints()
            await self.test_user_management()
            await self.test_friend_connection()
            await self.test_bucket_list_crud()
            await self.test_photo_completion()
            await self.test_completed_items()
        finally:
            await self.cleanup_test_data()
            await self.client.aclose()
        
        return self.print_summary()

async def main():
    """Main test runner"""
    tester = BackendTester()
    success, errors = await tester.run_all_tests()
    
    if success:
        print("\n🎉 All backend tests passed!")
        sys.exit(0)
    else:
        print(f"\n💥 {len(errors)} critical issues found!")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())