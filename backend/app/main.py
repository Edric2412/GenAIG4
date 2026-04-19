from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, upload, library, chat
from app.database import engine, Base
import logging

# Create tables
Base.metadata.create_all(bind=engine)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

app = FastAPI(title="Atlas Tutor API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Conversation-ID"],
)

# Include routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(library.router)
app.include_router(chat.router)

@app.get("/")
async def root():
    return {"message": "Atlas Tutor API is running"}
