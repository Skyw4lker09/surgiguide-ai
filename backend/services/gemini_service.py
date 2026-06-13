import os
import logging
from typing import List, Dict
import google.generativeai as genai
from google.generativeai.types import GenerateContentResponse
from dotenv import load_dotenv
from models.schemas import ChatMessage
from prompts.templates import (
    SYSTEM_INSTRUCTIONS,
    INTENT_CLASSIFIER_PROMPT,
    OVERVIEW_PROMPT,
    OBJECTIVE_PROMPT,
    METHODOLOGY_PROMPT,
    ARCHITECTURE_PROMPT,
    DATASET_PROMPT,
    VIVA_PROMPT,
    PRESENTATION_PROMPT,
    FUTURE_SCOPE_PROMPT,
    RESEARCH_PAPER_PROMPT
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load env variables
load_dotenv()

# Initialize Gemini Client
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    logger.info("Gemini API configured successfully.")
else:
    logger.warning("GEMINI_API_KEY not found in environment variables. Gemini calls will fail until it is set.")

# Model configuration
MODEL_NAME = "gemini-3.5-flash"

def get_model(system_instruction: str = None) -> genai.GenerativeModel:
    """Helper to instantiate GenerativeModel with optional system instructions."""
    config = {}
    if system_instruction:
        config["system_instruction"] = system_instruction
    return genai.GenerativeModel(MODEL_NAME, **config)

def check_api_key():
    """Raises ValueError if API Key is not set."""
    if not os.getenv("GEMINI_API_KEY"):
        raise ValueError("GEMINI_API_KEY is not set. Please set the GEMINI_API_KEY environment variable in backend/.env or your terminal.")

async def classify_intent(user_input: str) -> str:
    """Classifies user queries into one of the 13 categories using Gemini."""
    check_api_key()
    try:
        model = get_model()
        prompt = INTENT_CLASSIFIER_PROMPT.format(user_input=user_input)
        
        # Call model with temperature 0 for deterministic classification
        response = await model.generate_content_async(
            prompt,
            generation_config=genai.GenerationConfig(temperature=0.0)
        )
        intent = response.text.strip().lower()
        
        # Valid intents list
        valid_intents = {
            "project_overview", "project_objective", "methodology", "architecture",
            "dataset", "computer_vision", "natural_language_processing", "robotic_surgery",
            "viva_questions", "presentation_help", "future_scope", "research_paper_help", "general_chat"
        }
        
        # Clean up any quotes or trailing text
        for valid in valid_intents:
            if valid in intent:
                return valid
                
        return "general_chat"
    except Exception as e:
        logger.error(f"Error during intent classification: {e}")
        return "general_chat"

async def generate_response(
    user_input: str,
    history: List[ChatMessage],
    intent: str
) -> Dict:
    """Generates the chat response and dynamic follow-up suggestions."""
    check_api_key()
    
    # 1. Determine prompt routing based on intent
    intent_prompts = {
        "project_overview": OVERVIEW_PROMPT,
        "project_objective": OBJECTIVE_PROMPT,
        "methodology": METHODOLOGY_PROMPT,
        "architecture": ARCHITECTURE_PROMPT,
        "dataset": DATASET_PROMPT,
        "viva_questions": VIVA_PROMPT,
        "presentation_help": PRESENTATION_PROMPT,
        "future_scope": FUTURE_SCOPE_PROMPT,
        "research_paper_help": RESEARCH_PAPER_PROMPT
    }
    
    # Base instructions for general domains
    domain_instructions = {
        "computer_vision": "You are a Computer Vision expert. Answer the following surgical vision question using concrete examples from laparoscopic/robotic surgeries.",
        "natural_language_processing": "You are a Natural Language Processing and Multimodal Learning expert. Answer the following surgical language grounding question, explaining terms like cross-modal learning and embeddings.",
        "robotic_surgery": "You are a Robotic Surgery expert. Answer the following question about surgical robots, da Vinci platform, navigation, and safety checks.",
        "general_chat": "You are SurgiGuide AI, a helpful and academic project assistant. Answer the query professionally and clearly."
    }

    # Format the prompt context
    system_instruction = SYSTEM_INSTRUCTIONS
    if intent in domain_instructions:
        system_instruction += "\n" + domain_instructions[intent]
        
    model = get_model(system_instruction=system_instruction)
    
    # 2. Build the chat session with history
    # Convert history into Google GenAI format: {"role": "user"|"model", "parts": [content]}
    formatted_history = []
    for msg in history:
        # Gemini API expects "user" and "model" roles
        role = "user" if msg.role in ["user", "assistant"] and msg.role != "model" else "model"
        if msg.role == "assistant":
            role = "model"
        formatted_history.append({"role": role, "parts": [msg.content]})
        
    chat = model.start_chat(history=formatted_history)
    
    # 3. Create context-aware query
    query = user_input
    if intent in intent_prompts:
        query = f"Provide assistance based on this topic: {intent_prompts[intent]}. User input context: {user_input}"
        
    # We ask the model to also output 3 suggested follow-up questions at the end, separated by a separator.
    # We do this to ensure we can parse out the suggestions dynamically.
    separator = "|||SUGGESTIONS|||"
    query += f"\n\nAt the very end of your response, output exactly 3 short follow-up questions that the user might want to ask next. Format them as a single line separated by '|'. Prefix this section with '{separator}' so the system can parse it. Example:\n{separator}Explain visual attention | What datasets are used? | How does zero-shot work?"
    
    try:
        response: GenerateContentResponse = await chat.send_message_async(query)
        response_text = response.text
        
        # Parse suggestions
        suggestions = []
        if separator in response_text:
            parts = response_text.split(separator)
            response_text = parts[0].strip()
            suggestions_text = parts[1].strip()
            suggestions = [s.strip() for s in suggestions_text.split("|") if s.strip()]
            # Clean suggestions from trailing/leading punctuation
            suggestions = [s.strip("?\"' ") + "?" for s in suggestions]
        else:
            # Fallback default suggestions based on intent
            fallback_suggestions = {
                "project_overview": ["What are the objectives?", "Tell me about the methodology", "What datasets are used?"],
                "project_objective": ["What problems are solved?", "Explain the main objective", "What are the benefits?"],
                "methodology": ["Explain the Vision Encoder", "How does Cross-Attention work?", "What is the output head?"],
                "architecture": ["Explain the visual backbone", "What is the loss function?", "Show the flow diagram"],
                "dataset": ["Tell me about Cholec80", "What is EndoVis?", "How is data annotated?"],
                "computer_vision": ["Explain Vision Transformers", "What is semantic segmentation?", "How does YOLO work?"],
                "natural_language_processing": ["What are text embeddings?", "How does cross-modal learning work?", "Explain Transformers"],
                "robotic_surgery": ["Tell me about the da Vinci system", "How does navigation work?", "What are the safety steps?"],
                "viva_questions": ["Give me an intermediate question", "Give me an advanced question", "Explain the ideal answer"],
                "presentation_help": ["Show the Title slide contents", "Explain the methodology slide", "Show the future scope slide"],
                "future_scope": ["What are VLA models?", "Explain federated learning", "How does haptic fusion work?"],
                "research_paper_help": ["Explain the research gaps", "What are the novel contributions?", "Draft the related work outline"],
                "general_chat": ["Explain the project", "Help me prepare for viva", "Help me prepare slides"]
            }
            suggestions = fallback_suggestions.get(intent, ["Explain the project", "How does VLG work?", "What is the architecture?"])

        return {
            "response": response_text,
            "intent": intent,
            "suggestions": suggestions[:3]  # Ensure max 3 suggestions
        }
        
    except Exception as e:
        logger.error(f"Error calling Gemini API: {e}")
        raise e
