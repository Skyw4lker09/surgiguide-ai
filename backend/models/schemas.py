from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str  # "user" or "model" (or "assistant")
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    tab: Optional[str] = None  # "general", "viva", "presentation", "future-scope"

class ChatResponse(BaseModel):
    response: str
    intent: str
    suggestions: List[str] = []

class TopicRequest(BaseModel):
    # Used for structured page loads, e.g., requesting custom initial state
    history: Optional[List[ChatMessage]] = []
