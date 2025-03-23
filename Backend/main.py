from fastapi import FastAPI, HTTPException, status, Depends, Request, Query
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.responses import RedirectResponse
import logging
from starlette.middleware.sessions import SessionMiddleware
import os
import base64
import uuid
import yagmail 
from dotenv import load_dotenv
import os
from fastapi.responses import JSONResponse

# Load environment variables
load_dotenv()

# Generate a secure secret key
def generate_secret_key():
    return base64.urlsafe_b64encode(os.urandom(32)).decode()

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5174", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
SENDER_EMAIL = "kotkarprasanna96@gmail.com"  # Replace with your Gmail
SENDER_PASSWORD = "zoya pqwr tvgt wken"  # Use an App Password for security

# Add SessionMiddleware
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET_KEY", generate_secret_key()),  # Use a secure secret key
    session_cookie="session",
)

# MongoDB connection
MONGO_DETAILS = "mongodb+srv://prajwal2403:Mysql321@prajwal2403.s8a1j.mongodb.net/story?retryWrites=true&w=majority"

# Initialize MongoDB client
client = AsyncIOMotorClient(MONGO_DETAILS)
database = client.story
users_collection = database.get_collection("users")
stories_collection = database.get_collection("stories")

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = generate_secret_key()  # Use a secure secret key
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# === Google OAuth2 configuration with environment variables ===
config_data = {
    "GOOGLE_CLIENT_ID": os.getenv("GOOGLE_CLIENT_ID"),
    "GOOGLE_CLIENT_SECRET": os.getenv("GOOGLE_CLIENT_SECRET"),
    "GOOGLE_REDIRECT_URI": os.getenv("GOOGLE_REDIRECT_URI")
}
config = Config(environ=config_data)

oauth = OAuth(config)
oauth.register(
    name="google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_id=config_data["GOOGLE_CLIENT_ID"],
    client_secret=config_data["GOOGLE_CLIENT_SECRET"],
    redirect_uri=config_data["GOOGLE_REDIRECT_URI"],
    client_kwargs={
        "scope": "openid email profile",
        "prompt": "select_account"
    }
)

# Pydantic models
class User(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserInDB(BaseModel):
    id: str
    name: str
    email: EmailStr

class Token(BaseModel):
    access_token: str
    token_type: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenData(BaseModel):
    email: Optional[str] = None

class Story(BaseModel):
    title: str
    content: str
    author_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    tags: List[str] = []
    is_published: bool = False

class StoryCreate(BaseModel):
    title: str
    content: str
    tags: List[str] = []
    is_published: bool = False

class StoryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    tags: Optional[List[str]] = None
    is_published: Optional[bool] = None

# Helper functions
def user_helper(user) -> dict:
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"]
    }

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception

    user = await users_collection.find_one({"email": token_data.email})
    if user is None:
        raise credentials_exception

    return user

# === Google OAuth2 routes ===
@app.get("/auth/google")
async def login_via_google(request: Request):
    """ Initiate Google OAuth login """
    redirect_uri = config_data["GOOGLE_REDIRECT_URI"]
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/google/callback")
async def google_callback(request: Request):
    """ Handle Google OAuth callback """
    try:
        # Fetch the access token from Google
        token = await oauth.google.authorize_access_token(request)
        if not token:
            logging.error("Failed to fetch access token")
            raise HTTPException(status_code=400, detail="Failed to fetch access token")

        # Log the token for debugging purposes
        logging.error(f"Token received: {token}")

        # Get user info directly from userinfo endpoint instead of parsing id_token
        userinfo = await oauth.google.parse_id_token(request, token)
        if not userinfo:
            # If userinfo is not directly available, fetch it using the access token
            resp = await oauth.google.get('https://openidconnect.googleapis.com/v1/userinfo', token=token)
            userinfo = await resp.json()
            
        # Log the user info for debugging
        logging.error(f"User info: {userinfo}")

        # Extract user information
        email = userinfo.get("email")
        name = userinfo.get("name")

        if not email:
            logging.error("Email not found in user info")
            raise HTTPException(status_code=400, detail="Email not found in user info")

        # Check if the user already exists in the database
        user = await users_collection.find_one({"email": email})
        if not user:
            # Create a new user if they don't exist
            user_data = {
                "name": name or "Google User",
                "email": email,
                "password": ""  # No password for OAuth users
            }
            await users_collection.insert_one(user_data)

        # Generate a JWT token for the user
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(data={"sub": email}, expires_delta=access_token_expires)

        # Redirect to the frontend with the JWT token
        frontend_url = f"http://localhost:5173/auth/google/callback?access_token={access_token}"  # Replace with your frontend URL
        return RedirectResponse(url=frontend_url)

    except HTTPException as e:
        logging.error(f"HTTPException: {e.detail}")
        raise e
    except Exception as e:
        logging.error(f"Error in google_callback: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error")

# Story routes
@app.post("/stories/", response_model=Story)
async def create_story(story: StoryCreate, current_user: User = Depends(get_current_user)):
    """Create a new story."""
    try:
        story_dict = story.dict()
        story_dict["author_id"] = current_user["id"]
        story_dict["created_at"] = datetime.utcnow()
        result = await stories_collection.insert_one(story_dict)
        
        created_story = await stories_collection.find_one({"_id": result.inserted_id})
        created_story["_id"] = str(created_story["_id"])
        return created_story
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating story: {str(e)}")

@app.get("/stories/", response_model=List[Story])
async def get_stories(current_user: User = Depends(get_current_user)):
    """Get all stories for the current user."""
    try:
        stories = await stories_collection.find(
            {"author_id": current_user["id"]}
        ).to_list(1000)
        
        for story in stories:
            story["_id"] = str(story["_id"])
        return stories
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stories: {str(e)}")

@app.get("/stories/{story_id}", response_model=Story)
async def get_story(story_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific story by ID."""
    try:
        story = await stories_collection.find_one({
            "_id": ObjectId(story_id),
            "author_id": current_user["id"]
        })
        if story:
            story["_id"] = str(story["_id"])
            return story
        raise HTTPException(status_code=404, detail="Story not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching story: {str(e)}")

@app.put("/stories/{story_id}", response_model=Story)
async def update_story(
    story_id: str, 
    story_update: StoryUpdate, 
    current_user: User = Depends(get_current_user)
):
    """Update a story."""
    try:
        update_data = {k: v for k, v in story_update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow()
        
        result = await stories_collection.update_one(
            {"_id": ObjectId(story_id), "author_id": current_user["id"]},
            {"$set": update_data}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Story not found or not authorized")
            
        updated_story = await stories_collection.find_one({"_id": ObjectId(story_id)})
        updated_story["_id"] = str(updated_story["_id"])
        return updated_story
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating story: {str(e)}")

@app.delete("/stories/{story_id}")
async def delete_story(story_id: str, current_user: User = Depends(get_current_user)):
    """Delete a story."""
    try:
        result = await stories_collection.delete_one({
            "_id": ObjectId(story_id),
            "author_id": current_user["id"]}
        )
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Story not found or not authorized")
            
        return {"message": "Story deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting story: {str(e)}")

# User routes
@app.post("/signup/", response_model=UserInDB)
async def create_user(user: User):
    user_dict = user.dict()
    user_dict["password"] = get_password_hash(user_dict["password"])
    logging.info(f"Creating user: {user_dict}")  # Log user creation
    if await users_collection.find_one({"email": user_dict["email"]}):
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = await users_collection.insert_one(user_dict)
    logging.info(f"User created with ID: {new_user.inserted_id}")  # Log user creation result
    created_user = await users_collection.find_one({"_id": new_user.inserted_id})
    logging.info(f"Created user: {created_user}")  # Log the created user
    return user_helper(created_user)

@app.post("/login", response_model=Token)
async def login(user: UserLogin):
    user_data = await users_collection.find_one({"email": user.email})
    if not user_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not verify_password(user.password, user_data["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/user", response_model=UserInDB)
async def get_current_user_data(current_user: User = Depends(get_current_user)):
    """Endpoint to get the current user's data."""
    return user_helper(current_user)

@app.post("/logout")
async def logout(request: Request, response: JSONResponse):
    """Endpoint to handle user logout"""
    try:
        # Clear session data
        request.session.clear()
        
        # Create response
        response = JSONResponse(content={"message": "Successfully logged out"})
        
        # Clear any session cookies
        response.delete_cookie("session")
        response.delete_cookie("Authorization")
        
        return response
    except Exception as e:
        logging.error(f"Error during logout: {str(e)}")
        raise HTTPException(status_code=500, detail="Error during logout")

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)