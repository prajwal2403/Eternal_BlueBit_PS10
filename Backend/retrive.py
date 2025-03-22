from groq import Groq
import os
from sentence_transformers import SentenceTransformer
from database import collection_name2, client, stories_collection
import uuid
import qdrant_client

# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
LLM_MODEL = "llama3-8b-8192"
groq_client = Groq(api_key=GROQ_API_KEY)

# Load SentenceTransformer embedding model
embedding_model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")

def generate_new_story(id: str, genre: str, brutality: int, emotion: int, ending: str, suspense:int, humor:int, romance:int, intensity:int, mystery:int):
    """
    Generates the first part of a new story using Groq and stores it.
    """
    story_id = str(uuid.uuid4())

    prompt = f"""
## Role: AI Storyteller

## Task: Generate a compelling short story based on the given parameters.
### Parameters:
- **Genre:** {genre}
- **Brutality Level:** {brutality} (scale of 1 to 10)
- **Emotion Level:** {emotion} (scale of 1 to 10)
- **Ending Type:** {ending}
- **Suspense Level:** {suspense} (scale of 1 to 10)
- **Humor Level:** {humor} (scale of 1 to 10)
- **Romance Level:** {romance} (scale of 1 to 10)
- **Intensity Level:** {intensity} (scale of 1 to 10)
- **Mystery Level:** {mystery} (scale of 1 to 10)

## Story Requirements:
- The story should be engaging, vivid, and immersive.
- Ensure the brutality and emotion levels are reflected appropriately.
- The ending should align with the specified type (Happy, Tragic, Cliffhanger, etc.).
- The main character should be relatable and undergo meaningful development.
-Generate only a story part,Not the entire story 
## Expected Output:
A well-structured short story in a narrative format.
"""
    conversation_history = [{"role": "system", "content": "You are a world-class AI storyteller."}]
    conversation_history.append({"role": "user", "content": prompt})

    # Use Groq SDK to generate response
    try:
        chat_completion = groq_client.chat.completions.create(
            messages=conversation_history,
            model="llama-3.3-70b-versatile"
        )
        story_text = chat_completion.choices[0].message.content
        conversation_history.append({"role": "assistant", "content": story_text})
        stories_collection.insert_one({
        "story_id": story_id,
        "status": "incomplete"
    })
        story_embedding = embedding_model.encode(story_text).tolist()
        client.upsert(
            collection_name=collection_name2,
            points=[{
                "id": story_id, "vector": story_embedding, "payload": {"plot":story_text, "story_id": story_id, "user_id": id}
            }]
        )
        return story_text,str(story_id)
    except Exception as e:
            return {"error": f"Error generating story: {e}"}

    

def continue_existing_story(id: str, story_id: str,suspense:int, humor:int, romance:int, intensity:int, mystery:int):
    """
    Generates the next part of an existing story using Groq and vector embeddings.
    """
    search_result = qdrant_client.scroll(
        collection_name=collection_name2,
        scroll_filter={"must": [{"key": "story_id", "match": {"value": story_id}}]},
        limit=1,
    )

    if not search_result or not search_result["points"]:
        print("Story not found")
        return None

    previous_plot = search_result["points"][0]["payload"]["plot"]

    prompt = f"""## Role: AI Storyteller & Plot Continuation Expert  
    ## Objective: Generate the **next part** of an ongoing story while maintaining coherence and excitement.  
      
    ## **Story So Far:**  
    {previous_plot}  
      
    ## **User Preferences for Continuation:**  
    - **Suspense Level:** {suspense}/10  
    - **Humor Level:** {humor}/10  
    - **Romance Level:** {romance}/10  
    - **Intensity Level:** {intensity}/10  
    - **Mystery Level:** {mystery}/10  

    ## **Instructions for Story Progression:**  
    - The next part should **seamlessly connect** with the existing plot.  
    - Maintain **consistent character development** and world-building.  
    - Ensure that suspense, humor, romance, intensity, and mystery align with the given levels.  
    - If suspense is high, build tension with unexpected twists.  
    - If humor is high, incorporate witty dialogue or comedic elements.  
    - If romance is high, deepen relationships between key characters.  
    - If intensity is high, increase action, stakes, or urgency.  
    - If mystery is high, introduce intriguing clues or unresolved questions.  
    """

    # Use Groq SDK to generate response
    response = groq_client.chat.completions.create(
        model=LLM_MODEL,
        prompt=prompt
    )

    next_part = response.choices[0].text.strip()

    # Store embedding in Qdrant
    updated_embedding = embedding_model.encode(previous_plot + " " + next_part).tolist()
    client.upsert(
        collection_name=collection_name2,
        points=[{
            "id": story_id, "vector": updated_embedding, "payload": {"plot": next_part, "story_id": story_id, "user_id": id}
        }]
    )

    return {"story_id": story_id, "plot": next_part}
