from fastapi import FastAPI, HTTPException, status, Depends, Request, Query
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.responses import RedirectResponse
import logging
from starlette.middleware.sessions import SessionMiddleware
from pymongo.errors import PyMongoError
import os
import base64
import uuid
from retrive import generate_new_story, generate_story_options, generate_next_story_part
from database import stories_collection, users_collection, client, collection_name, collection_name2

# Generate a secure secret key
def generate_secret_key():
    return base64.urlsafe_b64encode(os.urandom(32)).decode()

# Initialize FastAPI app
app = FastAPI()
user_story_options: Dict[str, List[str]] = {}


# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add SessionMiddleware
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET_KEY", generate_secret_key()),  # Use a secure secret key
    session_cookie="session",
)

# MongoDB connection
MONGO_DETAILS = "mongodb+srv://prajwal2403:Mysql321@prajwal2403.s8a1j.mongodb.net/story?retryWrites=true&w=majority"

# Initialize MongoDB client
client2 = AsyncIOMotorClient(MONGO_DETAILS)
database = client2.story
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
    user: UserInDB

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
    user_id: str
    genre: str
    initial_input: str
    brutality: int = Field(ge=0, le=10)
    emotion: int = Field(ge=0, le=10)
    suspense: int = Field(ge=0, le=10)
    humor: int = Field(ge=0, le=10)
    romance: int = Field(ge=0, le=10)
    intensity: int = Field(ge=0, le=10)
    mystery: int = Field(ge=0, le=10)
    ending: str


class StoryResponse(BaseModel):
    id: str
    title: Optional[str] = "Untitled"
    genre: str
    status: str = "pending"
    createdAt: datetime
    updatedAt: datetime

class StoryCreateResponse(BaseModel):
    story_id: str
    first_part: str

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
@app.post("/new-story/")
async def create_new_story(story: StoryCreate):
    """
    Creates a new story with user-selected parameters and generates the first part.
    """
    try:
        user_data = await users_collection.find_one({"_id": ObjectId(story.user_id)})

        status = user_data.get("status", "Introduction(setting & characters)")
        first_part, story_id = generate_new_story(
            story.user_id, story.genre, story.initial_input, story.brutality, story.emotion, 
            story.ending, story.suspense, story.humor, story.romance, story.intensity, 
            story.mystery, status
        ) 
        if not first_part or not story_id:
            raise HTTPException(status_code=500, detail="Failed to generate story.")
        # Create a new story document
        story_data = {

            "story_id": story_id,
            "user_id": story.user_id,
            "genre": story.genre,
            "initial_input": story.initial_input,
            "brutality": story.brutality,
            "emotion": story.emotion,
            "suspense": story.suspense,
            "humor": story.humor,
            "romance": story.romance,
            "intensity": story.intensity,
            "mystery": story.mystery,
            "ending": story.ending,
            "first_part": first_part,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "status": status
        }
        await stories_collection.insert_one(story_data)
        
        # Add the story ID to the user's document
        await users_collection.update_one(
            {"_id": ObjectId(story.user_id)},
            {"$addToSet": {"stories": story_id}}
        )
        
        logging.info(f"New story created: {story_id} for user {story.user_id}")
        return {"story_id": story_id, "first_part": first_part}
    except Exception as e:
        logging.error(f"Error creating new story: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stories/", response_model=List[Story])
async def get_stories(current_user: User = Depends(get_current_user)):
    """Get all stories for the current user."""
    try:
        # Fetch the user document
        user = await users_collection.find_one({"_id": ObjectId(current_user["id"])})
        if not user or "stories" not in user:
            return []  # Return empty list if user has no stories

        # Fetch stories using the story_id list
        story_ids = user["stories"]
        if not story_ids:
            return []  # Return empty list if no story IDs are found

        # Convert story_ids to ObjectId (if they are not already)
        try:
            story_object_ids = [ObjectId(story_id) for story_id in story_ids]
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid story ID format: {str(e)}")

        # Fetch stories from the database
        stories = await stories_collection.find({"_id": {"$in": story_object_ids}}).to_list(len(story_object_ids))

        # Convert ObjectId to string for JSON serialization
        for story in stories:
            story["_id"] = str(story["_id"])

        return stories
    except PyMongoError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching stories: {str(e)}")
    
    
@app.get("/stories/{story_id}")
async def get_story(story_id: str, current_user: User = Depends(get_current_user)):
    try:
        story = await stories_collection.find_one({
            "_id": ObjectId(story_id),
            "user_id": str(current_user["_id"])
        })
        
        if not story:
            raise HTTPException(status_code=404, detail="Story not found")
            
        return {
            "story_id": str(story["_id"]),
            "first_part": story["first_part"],
            "title": story.get("title", "Untitled"),
            "created_at": story.get("created_at"),
            "status": story.get("status", "completed")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/get-story-options/")
async def get_story_options(user_id: str, story_id: str):
    """
    Generates three possible story options and stores them in a global dictionary for the user.
    """
    global user_story_options

    # Search for the story in the database
    search_result = client.scroll(
        collection_name=collection_name2,
        scroll_filter={"must": [{"key": "story_id", "match": {"value": story_id}}]},
        limit=1,
    )

    records, _ = search_result
    if not records:
        print("Story not found")
        # Return a valid response with empty options
        return {"user_id": user_id, "story_id": story_id, "options": []}

    record = records[0]
    previous_plot = record.payload["plot"]
    story_options = generate_story_options(previous_plot)  # Generate options

    # Store options for this user
    user_story_options[user_id] = story_options

    return {"user_id": user_id, "story_id": story_id, "options": story_options}


@app.post("/continue-story/")
async def continue_story(user_id: str, story_id: str, choice: int = Query(1, ge=1, le=3)):
        """
        Continues the story based on the user's choice from their stored options.
        """
        global user_story_options

        if user_id not in user_story_options:
            return {"error": "No story options available for this user. Call /get-story-options first."}

        # Get the user's chosen option
        story_options = user_story_options[user_id]
        selected_option = story_options[choice - 1]  # Convert choice (1,2,3) to index (0,1,2)
        search_result = client.scroll(
            collection_name=collection_name2,
            scroll_filter={"must": [{"key": "story_id", "match": {"value": story_id}}]},
            limit=1,
        )
        
        records, _ = search_result
        if not records:
            print("Story not found")
            return None
        
        record = records[0]
        previous_plot = record.payload["plot"]
        # Generate the next part of the story
        next_part = generate_next_story_part(previous_plot, selected_option)

        return {"user_id": user_id, "story_id": story_id, "chosen_option": selected_option, "plot": next_part}

@app.delete("/stories/{story_id}")
async def delete_story(story_id: str, current_user: User = Depends(get_current_user)):
    """Delete a story."""
    try:
        result = await stories_collection.delete_one({
            "_id": ObjectId(story_id),
            "author_id": current_user["id"]
        })
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Story not found or not authorized")
            
        return {"message": "Story deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting story: {str(e)}")

# User routes
@app.post("/signup/", response_model=UserInDB)
async def create_user(user: User):
    user_dict = user.dict()
    # Generate unique doctor ID
    # user_dict["_id"] = f"DOC{uuid.uuid4().hex[:6].upper()}"
    user_dict["password"] = get_password_hash(user_dict["password"])
    logging.info(f"Creating user: {user_dict}")  # Log user creation
    if await users_collection.find_one({"email": user_dict["email"]}):
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = await users_collection.insert_one(user_dict)
    logging.info(f"User created with ID: {new_user.inserted_id}")  # Log user creation result
    created_user = await users_collection.find_one({"_id": new_user.inserted_id})
    if created_user:
        created_user["_id"] = str(created_user["_id"])  # Convert ObjectId to string
        logging.info(f"Created user: {created_user}")  # Log the created user
        return user_helper(created_user)
    raise HTTPException(status_code=500, detail="User creation failed")

@app.post("/login", response_model=Token)
async def login(user: UserLogin):
    user_data = await users_collection.find_one({"email": user.email})
    if not user_data:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not verify_password(user.password, user_data["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    user_info = user_helper(user_data)
    return {"access_token": access_token, "token_type": "bearer", "user": user_info}

@app.get("/user", response_model=UserInDB)
async def get_current_user_data(current_user: User = Depends(get_current_user)):
    """Endpoint to get the current user's data."""
    return user_helper(current_user)

def add_story_to_user(user_id: str, story_id: str):
    """
    Adds the generated story_id to the user's document.
    """
    users_collection.update_one(
        {"_id": user_id},
        {"$addToSet": {"stories": story_id}},  # Add story_id without duplication
        upsert=True  # Create user if not exists
    )

# Verify token endpoint
@app.get("/auth/verify/")
async def verify_token(current_user: User = Depends(get_current_user)):
    try:
        return {
            "status": "valid",
            "user": {
                "id": str(current_user["_id"]),
                "email": current_user["email"],
                "name": current_user["name"]
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

# Get user's stories endpoint
@app.get("/stories/user/{user_id}", response_model=List[StoryResponse])
async def get_user_stories(user_id: str):
    try:
        # Fetch stories directly from the stories_collection using the user_id
        stories = await stories_collection.find({"user_id": user_id}).to_list(None)
        
        # Prepare the response
        response = [
            {
                "id": str(story["story_id"]),
                "title": story.get("title", "Untitled"),
                "genre": story["genre"],
                "status": story.get("status", "pending"),
                "createdAt": story.get("created_at", datetime.utcnow()),
                "updatedAt": story.get("updated_at", datetime.utcnow())
            }
            for story in stories
        ]

        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
    
# Create new story endpoint
@app.post("/stories/new/", response_model=StoryCreateResponse)
async def create_story(
    story: StoryCreate,
    current_user: User = Depends(get_current_user)
):
    try:
        story_data = story.dict()
        story_data["user_id"] = str(current_user["_id"])
        story_data["created_at"] = datetime.utcnow()
        story_data["updated_at"] = datetime.utcnow()
        story_data["status"] = "pending"
        
        result = await stories_collection.insert_one(story_data)
        
        return {
            "story_id": str(result.inserted_id),
            "first_part": "Story initialization successful"  # Replace with actual story generation
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)