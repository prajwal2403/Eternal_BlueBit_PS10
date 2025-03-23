from groq import Groq
import os
from sentence_transformers import SentenceTransformer
from database import collection_name2, client, stories_collection,users_collection,collection_name
import uuid
import qdrant_client

# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
LLM_MODEL = "llama3-8b-8192"
groq_client = Groq(api_key=GROQ_API_KEY)

# Load SentenceTransformer embedding model
embedding_model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")

def generate_new_story(id: str, genre: str, brutality: int, emotion: int, ending: str, suspense:int, humor:int, romance:int, intensity:int, mystery:int,status:str):
    """
    Generates the first part of a new story using Groq and stores it.
    """
    story_id = str(uuid.uuid4())
    plot_summary = f"A {genre} story."

    # Perform semantic search for similar stories
    similar_stories = search_similar_stories(plot_summary)
    print(similar_stories)
    # Prepare similar stories context for prompt
    if isinstance(similar_stories, dict):
    # Could be {"message": "..."} or {"error": "..."}
        similar_stories_text = similar_stories.get("message") or similar_stories.get("error") or "No similar stories."
    else:
    # Otherwise, it's a list, so proceed with the list comprehension
        similar_stories_text = "\n".join(
            [f"**{story['title']}** - {story['plot_summary'][:300]}..." for story in similar_stories])
    print(similar_stories_text)
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

## Reference from Similar Stories:
{similar_stories_text}
## Story Requirements:
**Generate a unique, engaging story title** that captures the essence of the story.
-after generating title live a line and then start the story.
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
        story_lines = story_text.split("\n")
        story_title = story_lines[0].strip()  # First line as title
        story_text = "\n".join(story_lines[1:]).strip()
        print(story_title)
        stories_collection.insert_one({
        "story_id": story_id,
        "title": story_title,
        "status": "Conflict (Rising Action)"
    })
        update_result =  users_collection.update_one(
            {"user_id": id, "story_id": story_id},  # Find the story
            {"$set": {"status": status,"Title":story_title}}  # Update status field
        )
        story_embedding = embedding_model.encode(story_text).tolist()
        client.upsert(
            collection_name=collection_name2,
            points=[{
                "id": story_id, "vector": story_embedding, "payload": {"plot":story_text, "story_id": story_id, "user_id": id,"story_title":story_title}
            }]
        )
        return story_text,str(story_id)
    except Exception as e:
            return {"error": f"Error generating story: {e}"}

    

def continue_existing_story(id: str, story_id: str, suspense_boost: int, emotion_boost: int, brutality_boost: int, mystery_boost: int, status: str):
    """
    Generates the next part of an existing story using Groq and vector embeddings with user choice-based progression.
    """
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
    
    # Step 1: Generate three possible options
    options_prompt = f"""
    ## Role: AI Storyteller & Narrative Architect
    You are an expert in crafting immersive and captivating storylines. Your task is to provide three possible **engaging and distinct** directions for the next part of the story.
    
    ### Story Context:
    {previous_plot}
    
    Each option should offer a unique twist or development in the plot. Ensure they evoke different emotions or escalate the tension uniquely. 
    
    ### Format:
    Provide exactly **three options** as short, make each option descriptive so that user can have a bit clear picture of option to choose
    1. **[Option 1]** - Describe an intense, unexpected turn of events.
    2. **[Option 2]** - Introduce an emotional or character-driven moment.
    3. **[Option 3]** - Reveal a mystery or shocking revelation.
    """
    
    conversation_history = [{"role": "system", "content": "You are a world-class AI storyteller and expert in narrative progression."}]
    conversation_history.append({"role": "user", "content": options_prompt})
    
    try:
        options_response = groq_client.chat.completions.create(
            messages=conversation_history,
            model="llama-3.3-70b-versatile"
        )
        options_text = options_response.choices[0].message.content.strip()
        options_list = options_text.split("\n")  # Extract the three options
    
        # Display options to the user
        print("Choose one of the following options:")
        for option in options_list:
            print(option)
        
        user_choice = int(input("Enter 1, 2, or 3: "))
        selected_option = options_list[user_choice - 1].split(". ")[1]  # Extract text after "1. "
        
        # Step 2: Continue the story based on the selected option
        story_prompt = f"""
        ## Role: AI Storyteller & Master of Suspense
        You are a master at weaving thrilling, emotionally engaging, and immersive narratives. Your goal is to continue the story by integrating the selected plot direction seamlessly while maintaining coherence and excitement.
        
        ### Story So Far:
        {previous_plot}
        
        ### User's Choice:
        "{selected_option}"
        
        ### Instructions:
        - Expand the story in a natural and compelling way.
        - Maintain a consistent tone and pacing based on the genre.
        - Enhance suspense, emotion, brutality, or mystery based on the user's settings.
        - Ensure smooth transitions and avoid abrupt shifts in the narrative.
        
        **Continue the story now:**
        """
    
        conversation_history.append({"role": "user", "content": story_prompt})
        
        chat_completion = groq_client.chat.completions.create(
            messages=conversation_history,
            model="llama-3.3-70b-versatile"
        )
        next_part = chat_completion.choices[0].message.content.strip()
    
        # Step 3: Store updated embedding in Qdrant
        updated_embedding = embedding_model.encode(previous_plot + " " + next_part).tolist()
    
        # Step 4: Update story status
        if status == "Conflict (Rising Action)":
            status = "Climax (Turning Point)"
        elif status == "Climax (Turning Point)":
            status = "Falling Action (Resolution Building)"
        else:
            status = "Conclusion (Final Resolution)"
    
        users_collection.update_one(
            {"user_id": id, "story_id": story_id},
            {"$set": {"status": status}}
        )
    
        client.upsert(
            collection_name=collection_name2,
            points=[{
                "id": story_id, "vector": updated_embedding, "payload": {"plot": next_part, "story_id": story_id, "user_id": id}
            }]
        )
    
        return {"story_id": story_id, "plot": next_part}
    
    except Exception as e:
        return {"error": f"Error generating story: {e}"}


def search_similar_stories(plot_summary: str, top_k: int = 5):
    """
    Performs semantic search using Qdrant to find similar stories based on plot summary.
    """
    try:
        query_embedding = embedding_model.encode(plot_summary).tolist()
    except Exception as e:
        print(f"Error encoding plot summary: {e}")
        return {"error": "Failed to encode plot summary."}

    try:
        search_result = client.search(
            collection_name=collection_name,
            query_vector=query_embedding,
            limit=top_k
        )
    except Exception as e:
        print(f"Error querying Qdrant: {e}")
        return {"error": "Failed to retrieve search results."}

    if not search_result:
        return {"message": "No similar stories found."}

    similar_stories = []
    for item in search_result:
        

        payload = item.payload
        if not isinstance(payload, dict):
            print(f"Skipping item with invalid payload: {payload}")
            continue

        
        title = payload.get("title", "Unknown Title")
        plot = payload.get("plot_summary", "No summary available.")

        
        similar_stories.append({
                
                "title": title,
                "plot_summary": plot
            })

    return similar_stories if similar_stories else {"message": "No similar stories found."}
