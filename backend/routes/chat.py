from fastapi import APIRouter, HTTPException, status
from models.schemas import ChatRequest, ChatResponse, TopicRequest
from services import gemini_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """General chat endpoint with dynamic intent classification."""
    try:
        # Detect intent
        intent = await gemini_service.classify_intent(request.message)
        logger.info(f"Classified intent: {intent}")
        
        # Override intent if specific tab is active
        tab_mappings = {
            "viva": "viva_questions",
            "presentation": "presentation_help",
            "future-scope": "future_scope"
        }
        if request.tab in tab_mappings:
            intent = tab_mappings[request.tab]
            logger.info(f"Tab override intent: {intent}")
            
        # Generate response using history
        result = await gemini_service.generate_response(
            user_input=request.message,
            history=request.history,
            intent=intent
        )
        
        return ChatResponse(
            response=result["response"],
            intent=result["intent"],
            suggestions=result["suggestions"]
        )
    except ValueError as ve:
        # Catch API key missing errors specifically
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(ve)
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while communicating with the Gemini API: {str(e)}"
        )

@router.post("/project-overview", response_model=ChatResponse)
async def project_overview(request: TopicRequest):
    """Directly requests the structured project overview."""
    try:
        result = await gemini_service.generate_response(
            user_input="Give me the project overview.",
            history=request.history,
            intent="project_overview"
        )
        return ChatResponse(
            response=result["response"],
            intent=result["intent"],
            suggestions=result["suggestions"]
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/viva", response_model=ChatResponse)
async def viva_endpoint(request: TopicRequest):
    """Triggers viva preparation mode with a mock question."""
    try:
        result = await gemini_service.generate_response(
            user_input="Ask me a viva question.",
            history=request.history,
            intent="viva_questions"
        )
        return ChatResponse(
            response=result["response"],
            intent=result["intent"],
            suggestions=result["suggestions"]
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/presentation", response_model=ChatResponse)
async def presentation_endpoint(request: TopicRequest):
    """Requests slide deck structuring help."""
    try:
        result = await gemini_service.generate_response(
            user_input="Create a presentation slide deck outline.",
            history=request.history,
            intent="presentation_help"
        )
        return ChatResponse(
            response=result["response"],
            intent=result["intent"],
            suggestions=result["suggestions"]
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/future-scope", response_model=ChatResponse)
async def future_scope_endpoint(request: TopicRequest):
    """Requests detailed research future scope suggestions."""
    try:
        result = await gemini_service.generate_response(
            user_input="What are the future enhancements and scope of this research?",
            history=request.history,
            intent="future_scope"
        )
        return ChatResponse(
            response=result["response"],
            intent=result["intent"],
            suggestions=result["suggestions"]
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
