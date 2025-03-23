# Eternal_BlueBit_PS10
![image](https://github.com/user-attachments/assets/0fd0c5f0-36d8-4ca5-b18d-9f418de7ae78)

# AI-Powered Storytelling Platform

## Problem Statement
Creating an AI-powered storytelling platform that allows users to generate dynamic, branching narratives with a memory system for coherence, while also visualizing key story moments through high-quality generated images. The platform should allow users to explore various genres, customize plot elements, and maintain contextual integrity throughout the storytelling process.

## Project Overview
This project aims to build a comprehensive storytelling system that integrates:
- Retrieval-Augmented Generation (RAG) for contextually accurate story generation.
- Token-based memory for maintaining coherence and improving context recall.
- Dynamic branching for flexible plot progression.
- High-quality image generation for visual storytelling.

## Problems and Solutions
| Problem                          | Solution                                               |
|---------------------------------|-------------------------------------------------------|
| Ensuring narrative coherence     | Implementing token-based memory for context retention |
| High-context image generation    | Passing the finalized story to image generation model |
| Dynamic plot generation          | Utilizing RAG to generate diverse storytelling paths   |
| Visual storytelling integration  | Generating images at critical plot points             |

## Retrieval-Augmented Generation (RAG) Explanation
# DataSources
![image](https://github.com/user-attachments/assets/3900a0d1-99f6-4008-8f20-40e4c2766036)
# Vector DB Status
![image](https://github.com/user-attachments/assets/37176b7e-0eb3-4180-a830-777e7be2b379)
 ### story_plots collection for RAG source
 ### User_plots collection for User plot Status
- RAG is used to pull contextually relevant data from a pre-built vector database.
- The platform allows for dynamic plot generation by fetching relevant story points from the database.
- It ensures consistency in storytelling across various genres by using specific RAG databases for different genres/topics.

## LLM Generation Process (5 Stages)
1. **Introduction & Context Setup**: User selects genre/topic and provides initial context. Token-based memory is initialized.
2. **Story Building**: Dynamic plot generation using RAG to fetch contextually relevant data.
3. **Branching Logic**: The story progresses based on user input, generating new plot points.
4. **Memory Integration**: Ensuring coherence by updating memory with new context tokens.
5. **Final Story Confirmation**: User finalizes the story before proceeding to visuals generation.

### Branching for Each Stage
- Each stage allows the user to interact with the generated plot, offering options to modify or branch the storyline.
- Token-based memory ensures that key plot elements are retained and referenced appropriately.

## Visuals Generation
![Screenshot 2025-03-23 120712](https://github.com/user-attachments/assets/1797d7d7-dacb-4abf-af6a-df3d55bef804)
- Once the final story is confirmed, it is divided into five parts.
- Each part is processed as a separate prompt with high-context inputs.
- The prompts are fed to the image generation model, which uses the context-rich descriptions to generate detailed visuals.
- The generated images reflect critical moments of the plot, enhancing the storytelling experience.

## Key Features
- **RAG Integration**: Dynamic storytelling using a vector database.
- **Token-based Memory**: Improved coherence through memory-based context management.
- **Branching Storylines**: Interactive plot generation with user-driven choices.
- **High-Context Visual Generation**: Creating detailed visuals based on finalized story sections.
- **Genre Diversity**: Supporting various genres with tailored RAG databases.

  ![image](https://github.com/user-attachments/assets/3e70e3a0-0b55-487c-9390-af0bba53e463)

## Installations
- Frontend
 ```bash
cd app
npm install
npm run dev
```
- Backend
  ```bash
  cd Backend
  pip install -r requirements.txt
  uvicorn main:app --reload
  ```
## Future Improvements
- Integrating real-time visual updates during storytelling.
- Improving memory system for enhanced coherence.
- Allowing users to refine generated visuals further.

---

