from groq import Groq
import os
from sentence_transformers import SentenceTransformer
from database import collection_name2, client, stories_collection,users_collection,collection_name
import uuid
import qdrant_client
from typing import List
import spacy
# Initialize Groq client
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
LLM_MODEL = "llama3-8b-8192"
groq_client = Groq(api_key="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")

# Load SentenceTransformer embedding model
embedding_model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")

def generate_new_story(user_id: str, genre: str,initial_input: str, brutality: int, emotion: int, ending: str, suspense:int, humor:int, romance:int, intensity:int, mystery:int,style: str,status:str):
    """
    Generates the first part of a new story using Groq and stores it.
    """
    story_id = str(uuid.uuid4())
    plot_summary = f"A {genre} story."

    # Perform semantic search for similar stories
    similar_stories = search_similar_stories(plot_summary)
    # print(similar_stories)
    # Prepare similar stories context for prompt
    if isinstance(similar_stories, dict):
    # Could be {"message": "..."} or {"error": "..."}
        similar_stories_text = similar_stories.get("message") or similar_stories.get("error") or "No similar stories."
    else:
    # Otherwise, it's a list, so proceed with the list comprehension
        similar_stories_text = "\n".join(
            [f"**{story['title']}** - {story['plot_summary'][:300]}..." for story in similar_stories])
    # print(similar_stories_text)
    prompt = f"""
## Role: AI Storyteller

## Task: Generate a compelling short story based on the given parameters.
### Parameters:
- **Genre:** {genre}
- **Initial Input:** {initial_input}
- **Brutality Level:** {brutality} (scale of 1 to 10)
- **Emotion Level:** {emotion} (scale of 1 to 10)
- **Ending Type:** {ending}
- **Suspense Level:** {suspense} (scale of 1 to 10)
- **Humor Level:** {humor} (scale of 1 to 10)
- **Romance Level:** {romance} (scale of 1 to 10)
- **Intensity Level:** {intensity} (scale of 1 to 10)
- **Mystery Level:** {mystery} (scale of 1 to 10)
- **Style:** {style} (e.g., shakespearean, cyberpunk, etc.)

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
-Generate the story based on the style mentioned by user
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
        
        # print(story_title)
        stories_collection.update_one(
    {"story_id": story_id},  # Search for existing story
    {"$set": {  
        "title": story_title,
        "status": "Conflict",
    }} # Create a new document if it doesn't exist
)
        status="Conflict"
        update_result =  users_collection.update_one(
            {"user_id": user_id, "story_id": story_id},  # Find the story
            {"$set": {"status": status,"Title":story_title}}  # Update status field
        )
        story_embedding = embedding_model.encode(story_text).tolist()
        client.upsert(
            collection_name=collection_name2,
            points=[{
                "id": story_id, "vector": story_embedding, "payload": {"plot":story_text, "story_id": story_id, "user_id": user_id,"story_title":story_title}
            }]
        )
        # print(story_text,story_id,story_title,ar_metadata,status)
        return story_text,str(story_id),story_title,status
    except Exception as e:
            return {"error": f"Error generating story: {e}"}

    

def generate_story_options(previous_plot: str, status: str) -> List[str]:
    """
    Uses the Groq API to generate three possible story options.
    Returns exactly three options, properly formatted.
    """
    prompt = f"""
    ## Role: AI Storyteller & Master of Suspense  
    You are an expert in crafting immersive and captivating storylines. Your task is to provide three engaging and distinct directions for the next part of the story.
    currently status of the story is {status}
    ### 📜 Story Context:  
    {previous_plot}
    
    Each option should offer a unique twist or development in the plot. Make them highly descriptive so the user can clearly visualize their choices.  

    ### 📝 Instructions:  
    - Ensure exactly three distinct options are generated.  
    - Option 1: Introduce an intense, unexpected turn of events. Create suspense or danger.  
    - Option 2: Focus on an emotional or character-driven moment that deepens relationships or motivations.  
    - Option 3: Reveal a mystery, shocking truth, or hidden secret that changes the course of the story.  

    Provide the three options in the following strict format:  

    1. [Option 1] - (Describe an intense, unexpected turn)  
    2. [Option 2] - (Introduce emotional depth or character moment)  
    3. [Option 3] - (Reveal a hidden truth or shocking revelation)  
    """

    conversation_history = [
        {"role": "system", "content": "You are a master at weaving thrilling, immersive, and emotionally engaging narratives."},
        {"role": "user", "content": prompt}
    ]

    response = groq_client.chat.completions.create(
        messages=conversation_history,
        model="llama3-70b-8192"
    )

    options_text = response.choices[0].message.content.strip()
    
    # Improved parsing logic
    options = []
    lines = options_text.split('\n')
    for line in lines:
        line = line.strip()
        # Match lines that start with number+dot or contain [Option X]
        if line.startswith(('1.', '2.', '3.')) or '[Option' in line:
            options.append(line)
        # Stop after we have 3 options
        if len(options) >= 3:
            break
    
    # If we still don't have 3 options, fallback to simple split
    if len(options) < 3:
        options = options_text.split('\n')[:3]
    
    # Ensure we return exactly 3 options
    return [opt.strip() for opt in options[:3]]


def generate_next_story_part(user_id,story_id,previous_plot: str, selected_option: str,status:str) -> str:
    """
    Continues the story based on the selected option.
    """
    prompt = f"""
    ## Role: AI Storyteller & Master of Suspense  
    You are a master at weaving thrilling, emotionally engaging, and immersive narratives. Your goal is to **seamlessly continue the story** while integrating the selected plot direction.  
    
    ### 📜 Story So Far:  
    {previous_plot}
    
    ### 🔥 User's Choice:  
    "{selected_option}"  

    ### 🎭 Instructions:  
    - Expand the story **in a natural and compelling way**.  
    - Maintain a **consistent tone and pacing** based on the genre.  
    - Enhance **suspense, emotion, brutality, or mystery** based on the setting.  
    - Ensure **smooth transitions** and avoid abrupt shifts in the narrative.  

    **Continue the story now:**  
    """

    conversation_history = [
        {"role": "system", "content": "You are a world-class AI storyteller."},
        {"role": "user", "content": prompt}
    ]

    chat_completion = groq_client.chat.completions.create(
        messages=conversation_history,
        model="llama-3.3-70b-versatile"
    )

    next_part = chat_completion.choices[0].message.content.strip()
    updated_plot = previous_plot + "\n\n" + next_part
    print(status)
    story_embedding = embedding_model.encode(updated_plot).tolist()
    if status == "Conflict":
        status = "Climax"
    elif status == "Climax":
        status = "Falling Action"
    elif status == "Falling Action":  # Ensure it transitions properly
        status = "Conclusion"
    elif status == "Conclusion":
        status = "End"
    
    users_collection.update_one(
            {"user_id": user_id, "story_id": story_id},
            {"$set": {"status": status}}
        )
    stories_collection.update_one(
    {"story_id": story_id},  # Search for existing story
    {"$set": {  
        
        "status": status
    }}
     # Create a new document if it doesn't exist
)
    records,_ = client.scroll(
    collection_name=collection_name2,
    scroll_filter={"must": [{"key": "story_id", "match": {"value": story_id}}]},
    limit=1
)
    
    existing_payload =records[0].payload
    print(existing_payload)
    updated_payload = {
    **existing_payload,  # Keep old fields
    "plot": updated_plot,
    "story_id": story_id,
    "user_id": user_id,
    # Keep or set any other fields you want to preserve
}
    client.upsert(
    collection_name=collection_name2,
    points=[{
        "id": story_id,
        "vector": story_embedding,
        "payload": updated_payload
    }]
)
    return next_part


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

