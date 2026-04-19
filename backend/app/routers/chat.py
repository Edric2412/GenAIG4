from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services.gemini_service import gemini_service
from app.services.chroma_service import chroma_service
import logging
import json
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter(tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    subject: str = "all"

@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        logger.info(f"Chat query: {request.message} (Subject: {request.subject})")
        
        # 1. Get embedding for the query
        query_embedding = gemini_service.get_query_embedding(request.message)
        
        # 2. Retrieve relevant context from ChromaDB with subject filter
        relevant_chunks = chroma_service.query_docs(query_embedding, subject=request.subject)
        context = "\n\n".join(relevant_chunks)
        
        # 3. Build RAG prompt
        prompt = f"""
You are Atlas, an expert AI tutor. Your goal is to help the user understand the concepts in their archive.

Context from the archive:
{context}

Question:
{request.message}

Instructions:
1. Primary Source: Use the provided context to answer the question as accurately as possible.
2. Handling Gaps: If the context doesn't explicitly contain the full answer but the topic is related to the context (e.g., mathematical foundations of a topic), use your general knowledge to provide a comprehensive answer, connecting it to the concepts found in the materials.
3. Out-of-Scope: If the question is completely unrelated to the archive context, answer it helpfully using your general knowledge, but briefly mention that this specific topic is not covered in the archive.
4. Tone: Be encouraging, academic yet accessible, and avoid robotic phrases like "Based on the provided archive, I don't know". Integrate the archive context seamlessly into your explanation.
"""
        
        # 4. Stream response using Gemini
        return StreamingResponse(
            gemini_service.generate_response_stream(prompt),
            media_type="text/plain"
        )

    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
