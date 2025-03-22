from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
import qdrant_client
# Load embedding model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

# Initialize Qdrant client
client = qdrant_client.QdrantClient(
    url="https://8108fa10-87c0-489a-a138-e5742baa513d.europe-west3-0.gcp.cloud.qdrant.io:6333",
    api_key="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.ota-qmq7LDu8VAg1XW-RRzgXPngfjoSvuA01b7a-PLo"  # Use environment variables for security
)
collection_name = "story_plots"
collection_name2="user_plots"
MONGO_DETAILS = "mongodb+srv://prajwal2403:Mysql321@prajwal2403.s8a1j.mongodb.net/story?retryWrites=true&w=majority"

# Initialize MongoDB client
mongo_client = AsyncIOMotorClient(MONGO_DETAILS)
database = mongo_client.story
users_collection = database.get_collection("users")
stories_collection = database.get_collection("stories")
def save_story_to_mongo(user_id, story_id, plot, status="incomplete"):
    """
    Save a new story in MongoDB.
    """
    try:
        story_data = {
            "user_id": user_id,
            "story_id": story_id,
           
            "status": status
        }
        stories_collection.insert_one(story_data)
        return {"message": "Story saved successfully"}
    except Exception as e:
        print(f"Error saving story to MongoDB: {e}")
        return None


def update_story_in_mongo(story_id, next_part):
    """
    Append the next story part to an existing story.
    """
    try:
        result = stories_collection.update_one(
            {"story_id": story_id},
            {"$push": {"plot": next_part}}  # Append the next part
        )
        return result.modified_count > 0  # Returns True if updated
    except Exception as e:
        print(f"Error updating story in MongoDB: {e}")
        return False


def fetch_all_stories(user_id):
    """
    Retrieve all stories for a given user.
    """
    try:
        stories = list(stories_collection.find({"user_id": user_id}, {"_id": 0}))
        return stories
    except Exception as e:
        print(f"Error fetching stories: {e}")
        return []


def mark_story_complete(story_id):
    """
    Marks a story as complete.
    """
    try:
        result = stories_collection.update_one({"story_id": story_id}, {"$set": {"status": "complete"}})
        return {"message": "Story marked as complete"} if result.modified_count > 0 else {"error": "Story not found"}
    except Exception as e:
        print(f"Error marking story complete: {e}")
        return {"error": "Failed to update status"}


### 🔹 **Qdrant Functions**
def save_story_to_qdrant(user_id, story_id, plot):
    """
    Store the story plot embedding in Qdrant.
    """
    try:
        embedded_plot = embedding_model.encode(plot).tolist()
        qdrant_client.upsert(
            collection_name=collection_name,
            points=[
                PointStruct(
                    id=story_id,
                    vector=embedded_plot,
                    payload={"user_id": user_id, "story_id": story_id, "plot": plot}
                )
            ]
        )
        return {"message": "Story plot stored in Qdrant"}
    except Exception as e:
        print(f"Error storing story in Qdrant: {e}")
        return None


def fetch_latest_plot(story_id):
    """
    Retrieve the last saved plot for continuing the story.
    """
    try:
        story = stories_collection.find_one({"story_id": story_id}, {"_id": 0, "plot": 1})
        if story and "plot" in story and story["plot"]:
            return story["plot"][-1]  # Get the last plot part
        return None
    except Exception as e:
        print(f"Error fetching latest plot: {e}")
        return None