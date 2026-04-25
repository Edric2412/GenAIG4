from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.services.gemini_service import gemini_service
from app.services.pinecone_service import pinecone_service
from app.services.rerank_service import rerank_service
from app.database import get_db
from app.models import ChatHistory, User, Conversation
from app.routers.auth import get_current_user
from typing import Optional
import logging
import json
import asyncio
import time

logger = logging.getLogger(__name__)
router = APIRouter(tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    subject: str = "all"
    conversation_id: Optional[str] = None

@router.post("/chat")
async def chat(request: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    try:
        start_time = time.time()
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

        # 2. Get embedding for the query (Run in threadpool to avoid blocking)
        embed_start = time.time()
        loop = asyncio.get_event_loop()
        query_embedding = await loop.run_in_executor(
            None, gemini_service.get_query_embedding, request.message
        )
        embed_time = time.time() - embed_start
        
        # 3. Retrieve relevant context from Pinecone (Initial Top 20)
        retrieve_start = time.time()
        initial_docs = await loop.run_in_executor(
            None, pinecone_service.query_docs, query_embedding, request.message, request.subject, 20
        )
        retrieve_time = time.time() - retrieve_start
        
        # 4. Rerank with Cohere (Top 5)
        rerank_start = time.time()
        relevant_docs = await loop.run_in_executor(
            None, rerank_service.rerank, request.message, initial_docs, 5
        )
        rerank_time = time.time() - rerank_start
        
        # Format context with source metadata
        context_parts = []
        for doc in relevant_docs:
            source = doc['metadata'].get('filename', 'Unknown Source')
            context_parts.append(f"[Source: {source}]\n{doc['text']}")
        context = "\n\n".join(context_parts)

        # 5. Fetch Conversation History (last 5 interactions)
        history = db.query(ChatHistory).filter(
            ChatHistory.conversation_id == conversation.id
        ).order_by(ChatHistory.created_at.desc()).limit(5).all()
        
        history_text = ""
        if history:
            # Reverse to get chronological order
            for msg in reversed(history):
                history_text += f"Student: {msg.query}\nAtlas: {msg.response}\n\n"
        
        # 6. Build RAG prompt
        prompt = f"""
You are Atlas, an expert AI tutor. Your primary authority is the "Academic Syllabus" represented by the provided archive materials.

Context from the Academic Syllabus:
{context}

Conversation History:
{history_text}

Current Student Question:
{request.message}

Syllabus Grounding Instructions:
1. Primary Authority: Your answers must be primarily grounded in the provided archive context. Treat this context as the student's official syllabus.
2. Citations: Use numbered citations like [^1], [^2], etc., at the end of specific sentences.
3. MANDATORY SOURCE MAPPING: At the absolute end of your response, you MUST provide a hidden mapping section. This is CRITICAL for the system to work. Follow this EXACT format:

---SOURCES---
1: {{filename}} | {{Specific Topic/Section}}
2: {{filename}} | {{Specific Topic/Section}}
---END---

- Replace {{filename}} with the actual filename from the context.
- Replace {{Specific Topic/Section}} with a 3-5 word summary of the content.
- Ensure every [^n] used in the text has a corresponding entry in this list.
- Do NOT skip this section even if there is only one source.

4. Interactive Tone: Personalize your explanations by relating new information back to the student's previous questions.
   - Clearly and explicitly state that this specific topic is not covered in the current archive/syllabus.
   - You may provide a concise, high-level overview of the external topic to remain helpful, but prioritize brevity for non-syllabus content.
   - Pivot the conversation back to the syllabus by explaining how the topic relates to, contrasts with, or depends on concepts that ARE in the archive.
4. Gap Filling: If the syllabus contains related foundational concepts but not the specific answer, use your general knowledge to bridge the gap, but always make the connection to the archive materials explicit.
5. Tone & Persona: Maintain an academic, encouraging, and helpful persona. Maintain clear boundaries between the syllabus and general knowledge.
"""
        
        # 7. Generate response and save to history
        gen_start = time.time()
        full_response = ""
        async def stream_and_collect():
            nonlocal full_response
            first_chunk = True
            async for chunk in gemini_service.generate_response_stream(prompt):
                if first_chunk:
                    ttft = time.time() - gen_start
                    logger.info(f"Time to first token (TTFT): {ttft:.3f}s")
                    first_chunk = False
                full_response += chunk
                yield chunk
            
            total_time = time.time() - start_time
            logger.info(f"RAG Metrics: Embed={embed_time:.3f}s, Retrieve={retrieve_time:.3f}s, Rerank={rerank_time:.3f}s, Total={total_time:.3f}s")
            
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
            headers={
                "X-Conversation-ID": str(conversation.id),
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
            media_type="text/event-stream"
        )

    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        if isinstance(e, HTTPException):
            raise e
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

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id, 
        Conversation.user_id == current_user.id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    db.delete(conversation)
    db.commit()
    return {"status": "success", "message": "Conversation deleted"}
