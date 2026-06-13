import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import chat
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="SurgiGuide AI Backend",
    description="FastAPI Backend for Vision-Language Grounding Project Assistant",
    version="1.0.0"
)

# Configure CORS
# React frontend usually runs on http://localhost:5173 or http://localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local development, allow all. In production, restrict to frontend domain.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes directly on the root to match user specifications:
# POST /chat, POST /viva, POST /presentation, POST /project-overview, POST /future-scope
app.include_router(chat.router)

@app.get("/")
def read_root():
    return {"message": "SurgiGuide AI Backend is running.", "status": "healthy"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    # Run the server
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
