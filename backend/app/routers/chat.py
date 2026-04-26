from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.services.gemini_service import gemini_service
from app.services.chroma_service import chroma_service
from app.database import get_db
from app.models import ChatHistory, User, Conversation
from app.routers.auth import get_current_user
from typing import Optional
import logging
import json
import asyncio

logger = logging.getLogger(__name__)
router = APIRouter(tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    subject: str = "all"
    conversation_id: Optional[str] = None

@router.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        logger.info(f"Chat query by {current_user.email}: {request.message} (Subject: {request.subject})")
        
        # 1. Handle Conversation
        if request.conversation_id:
            conversation = db.query(Conversation).filter(
                Conversation.id == request.conversation_id, 
                Conversation.user_id == current_user.id
            ).first()
            if not conversation:
                raise HTTPException(status_code=404, detail="Conversation not found")
        else:
            # Create new conversation if no ID provided
            # Use first 30 chars of message as title
            title = request.message[:30] + ("..." if len(request.message) > 30 else "")
            conversation = Conversation(user_id=current_user.id, title=title)
            db.add(conversation)
            db.commit()
            db.refresh(conversation)
        # 2. Fetch prior conversation history (last 5 turns)
        prior_messages = db.query(ChatHistory).filter(
            ChatHistory.conversation_id == conversation.id
        ).order_by(ChatHistory.created_at.asc()).limit(5).all()

        history_text = ""
        if prior_messages:
            history_lines = []
            for msg in prior_messages:
                history_lines.append(f"Student: {msg.query}")
                history_lines.append(f"Atlas: {msg.response}")
            history_text = "\n".join(history_lines)

        # 2. Get embedding for the query
        query_embedding = gemini_service.get_query_embedding(request.message)
        
        # 3. Retrieve relevant context from ChromaDB with subject filter
        relevant_chunks = chroma_service.query_docs(query_embedding, subject=request.subject)
        context = "\n\n".join(relevant_chunks)
        
        # 4. Build RAG prompt
        prompt = f"""
YYou are Atlas, an expert AI tutor. Your primary authority is the "Academic Syllabus" represented by the provided archive materials.

Context from the Academic Syllabus:
{context}

{history_text}
Current Question:
{request.message}

Syllabus Grounding Instructions:
1. Primary Authority: Your answers must be primarily grounded in the provided archive context. Treat this context as the student's official syllabus.
2. Handling Out-of-Syllabus Topics: If the question is about a topic not present in the Academic Syllabus:
   - Clearly state that this specific topic is not covered in the current archive/syllabus.
   - Do NOT answer from general knowledge.
3. Memory: Use the previous conversation above to maintain context. If the student says "explain that again" or refers to something said earlier, use the conversation history to understand what they mean.
4. Tone & Persona: Maintain an academic, encouraging persona.
"""
        
        # 5. Generate response and save to history
        full_response = ""
        async def stream_and_collect():
            nonlocal full_response
            async for chunk in gemini_service.generate_response_stream(prompt):
                full_response += chunk
                yield chunk
            
            # Save to DB after stream completes
            try:
                new_chat = ChatHistory(
                    conversation_id=conversation.id,
                    query=request.message,
                    response=full_response
                )
                db.add(new_chat)
                db.commit()
                logger.info(f"Saved chat interaction for conversation {conversation.id}")
            except Exception as e:
                logger.error(f"Error saving chat history: {e}")

        return StreamingResponse(
            stream_and_collect(),
            headers={"X-Conversation-ID": str(conversation.id)},
            media_type="text/plain"
        )

    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/conversations")
async def get_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conversations = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.created_at.desc()).all()
    return [{
        "id": str(c.id),
        "title": c.title,
        "created_at": c.created_at
    } for c in conversations]

@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages(conversation_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id, 
        Conversation.user_id == current_user.id
    ).first()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    messages = db.query(ChatHistory).filter(
        ChatHistory.conversation_id == conversation.id
    ).order_by(ChatHistory.created_at.asc()).all()
    
    return [{
        "query": m.query,
        "response": m.response,
        "timestamp": m.created_at
    } for m in messages]
