from fastapi import FastAPI, APIRouter, HTTPException, Header, Depends, Response, Cookie
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import random
import string
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============ MODELS ============

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    session_token: str
    user: dict

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    friend_code: str
    partner_id: Optional[str] = None
    created_at: datetime

class SessionDataResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: Optional[str] = None
    session_token: str

class BucketItem(BaseModel):
    item_id: str
    title: str
    category: str
    created_by: str
    created_at: datetime
    completed: bool = False
    shared_with: List[str]

class BucketItemCreate(BaseModel):
    title: str
    category: str

class CompletedItem(BaseModel):
    completed_id: str
    item_id: str
    title: str
    category: str
    photo_base64: str
    notes: Optional[str] = None
    completed_at: datetime
    completed_by: str

class CompleteItemRequest(BaseModel):
    item_id: str
    photo_base64: str
    notes: Optional[str] = None

class ConnectFriendRequest(BaseModel):
    friend_code: str

# ============ AUTH HELPERS ============

def generate_friend_code() -> str:
    """Generate a unique 5-character alphanumeric code"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))

async def get_current_user(authorization: Optional[str] = Header(None)) -> User:
    """Get current user from session token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_token = authorization.replace("Bearer ", "")
    
    # Find session
    session = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    # Get user
    user_doc = await db.users.find_one(
        {"user_id": session["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    return User(**user_doc)

# ============ AUTH ENDPOINTS ============

# ============ EMAIL/PASSWORD AUTH ENDPOINTS ============

@api_router.post("/auth/register", response_model=LoginResponse)
async def register(request: RegisterRequest):
    """Register a new user with email/password"""
    # Check if user already exists
    existing_user = await db.users.find_one(
        {"email": request.email.lower()},
        {"_id": 0}
    )
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = pwd_context.hash(request.password)
    
    # Generate unique user ID and friend code
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    friend_code = generate_friend_code()
    
    # Ensure friend code is unique
    while await db.users.find_one({"friend_code": friend_code}):
        friend_code = generate_friend_code()
    
    # Create user
    user_doc = {
        "user_id": user_id,
        "email": request.email.lower(),
        "name": request.name,
        "password_hash": hashed_password,
        "picture": None,
        "friend_code": friend_code,
        "partner_id": None,
        "created_at": datetime.now(timezone.utc)
    }
    
    await db.users.insert_one(user_doc)
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    # Return response
    user_response = {
        "user_id": user_id,
        "email": request.email.lower(),
        "name": request.name,
        "picture": None,
        "friend_code": friend_code,
        "partner_id": None,
        "created_at": user_doc["created_at"].isoformat()
    }
    
    return LoginResponse(session_token=session_token, user=user_response)

@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """Login with email/password"""
    # Find user
    user_doc = await db.users.find_one(
        {"email": request.email.lower()},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Check if user has password (might be Google OAuth only user)
    if "password_hash" not in user_doc:
        raise HTTPException(status_code=401, detail="Please use Google sign-in for this account")
    
    # Verify password
    if not pwd_context.verify(request.password, user_doc["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    await db.user_sessions.insert_one({
        "user_id": user_doc["user_id"],
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    # Return response
    user_response = {
        "user_id": user_doc["user_id"],
        "email": user_doc["email"],
        "name": user_doc["name"],
        "picture": user_doc.get("picture"),
        "friend_code": user_doc["friend_code"],
        "partner_id": user_doc.get("partner_id"),
        "created_at": user_doc["created_at"].isoformat() if isinstance(user_doc["created_at"], datetime) else user_doc["created_at"]
    }
    
    return LoginResponse(session_token=session_token, user=user_response)


@api_router.post("/auth/session")
async def create_session(session_id: str = Header(None, alias="X-Session-ID")):
    """Exchange session_id for session_token and user data"""
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session ID")
        
        user_data = response.json()
    
    session_token = user_data["session_token"]
    
    # Check if user exists
    existing_user = await db.users.find_one(
        {"email": user_data["email"]},
        {"_id": 0}
    )
    
    if existing_user:
        user_id = existing_user["user_id"]
    else:
        # Create new user with unique friend code
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        friend_code = generate_friend_code()
        
        # Ensure friend code is unique
        while await db.users.find_one({"friend_code": friend_code}):
            friend_code = generate_friend_code()
        
        await db.users.insert_one({
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "friend_code": friend_code,
            "partner_id": None,
            "created_at": datetime.now(timezone.utc)
        })
    
    # Store session
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc)
    })
    
    return SessionDataResponse(**user_data)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user

@api_router.post("/auth/logout")
async def logout(current_user: User = Depends(get_current_user), authorization: Optional[str] = Header(None)):
    """Logout user"""
    if authorization:
        session_token = authorization.replace("Bearer ", "")
        await db.user_sessions.delete_one({"session_token": session_token})
    return {"message": "Logged out successfully"}

# ============ FRIEND CONNECTION ============

@api_router.post("/connect-friend")
async def connect_friend(request: ConnectFriendRequest, current_user: User = Depends(get_current_user)):
    """Connect with a friend using their code"""
    if current_user.partner_id:
        raise HTTPException(status_code=400, detail="You already have a partner")
    
    # Find friend by code
    friend = await db.users.find_one(
        {"friend_code": request.friend_code},
        {"_id": 0}
    )
    
    if not friend:
        raise HTTPException(status_code=404, detail="Friend code not found")
    
    if friend["user_id"] == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot connect with yourself")
    
    if friend.get("partner_id"):
        raise HTTPException(status_code=400, detail="This user already has a partner")
    
    # Connect both users
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"partner_id": friend["user_id"]}}
    )
    
    await db.users.update_one(
        {"user_id": friend["user_id"]},
        {"$set": {"partner_id": current_user.user_id}}
    )
    
    return {"message": "Connected successfully", "partner": friend}

# ============ BUCKET LIST ============

@api_router.get("/bucketlist", response_model=List[BucketItem])
async def get_bucket_list(current_user: User = Depends(get_current_user)):
    """Get all active bucket list items"""
    items = await db.bucket_items.find(
        {
            "shared_with": current_user.user_id,
            "completed": False
        },
        {"_id": 0}
    ).to_list(1000)
    
    return [BucketItem(**item) for item in items]

@api_router.post("/bucketlist", response_model=BucketItem)
async def create_bucket_item(item: BucketItemCreate, current_user: User = Depends(get_current_user)):
    """Create a new bucket list item"""
    # Get partner ID
    user_doc = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    
    if not user_doc.get("partner_id"):
        raise HTTPException(status_code=400, detail="You need a partner to create bucket list items")
    
    shared_with = [current_user.user_id, user_doc["partner_id"]]
    
    item_id = f"item_{uuid.uuid4().hex[:12]}"
    bucket_item = {
        "item_id": item_id,
        "title": item.title,
        "category": item.category,
        "created_by": current_user.user_id,
        "created_at": datetime.now(timezone.utc),
        "completed": False,
        "shared_with": shared_with
    }
    
    await db.bucket_items.insert_one(bucket_item)
    
    return BucketItem(**bucket_item)

@api_router.delete("/bucketlist/{item_id}")
async def delete_bucket_item(item_id: str, current_user: User = Depends(get_current_user)):
    """Delete a bucket list item"""
    result = await db.bucket_items.delete_one({
        "item_id": item_id,
        "shared_with": current_user.user_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    
    return {"message": "Item deleted successfully"}

# ============ COMPLETED ITEMS ============

@api_router.post("/bucketlist/complete", response_model=CompletedItem)
async def complete_bucket_item(request: CompleteItemRequest, current_user: User = Depends(get_current_user)):
    """Complete a bucket list item with photo"""
    # Get the bucket item
    item = await db.bucket_items.find_one(
        {
            "item_id": request.item_id,
            "shared_with": current_user.user_id,
            "completed": False
        },
        {"_id": 0}
    )
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found or already completed")
    
    # Mark as completed
    await db.bucket_items.update_one(
        {"item_id": request.item_id},
        {"$set": {"completed": True}}
    )
    
    # Create completed item
    completed_id = f"completed_{uuid.uuid4().hex[:12]}"
    completed_item = {
        "completed_id": completed_id,
        "item_id": request.item_id,
        "title": item["title"],
        "category": item["category"],
        "photo_base64": request.photo_base64,
        "notes": request.notes,
        "completed_at": datetime.now(timezone.utc),
        "completed_by": current_user.user_id
    }
    
    await db.completed_items.insert_one(completed_item)
    
    return CompletedItem(**completed_item)

@api_router.get("/completed", response_model=List[CompletedItem])
async def get_completed_items(current_user: User = Depends(get_current_user)):
    """Get all completed items"""
    # Get user's partner
    user_doc = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0})
    
    if not user_doc.get("partner_id"):
        return []
    
    # Get all completed items for both users
    items = await db.completed_items.find(
        {
            "completed_by": {"$in": [current_user.user_id, user_doc["partner_id"]]}
        },
        {"_id": 0}
    ).sort("completed_at", -1).to_list(1000)
    
    return [CompletedItem(**item) for item in items]

# Include router
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
