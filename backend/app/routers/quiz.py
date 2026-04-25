from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Optional
import json
import logging
import time

from app.database import get_db
from app.models import User, QuizAttempt
from app.routers.auth import get_current_user
from app.services.pinecone_service import pinecone_service
from app.services.gemini_service import gemini_service
from app.services.rerank_service import rerank_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["quiz"])

# SCHEMAS

class QuizRequest(BaseModel):
    topic: str
    subject: str
    num_questions: int = 5

class QuizResultSave(BaseModel):
    topic: str
    score: int
    total_questions: int
    difficulty: str

class Question(BaseModel):
    question: str
    options: List[str]
    answer: str
    explanation: str
    source: str

class QuizResponse(BaseModel):
    topic: str
    difficulty: str
    questions: List[Question]

# HELPER
def safe_parse_json(text: str):
    try:
        # Remove markdown code blocks if present
        clean_text = text.strip()
        if clean_text.startswith("```"):
            # Find the first { and last }
            start = clean_text.find("{")
            end = clean_text.rfind("}")
            if start != -1 and end != -1:
                clean_text = clean_text[start:end+1]
        
        return json.loads(clean_text)
    except Exception as e:
        logger.error("Failed JSON parse: %s. Raw output: %s", str(e), text)
        raise HTTPException(status_code=500, detail=f"LLM returned invalid JSON format: {str(e)}")

# ROUTE 
@router.post("/quiz", response_model=QuizResponse)
async def generate_quiz(
    req: QuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # 1. Determine Adaptive Difficulty
        previous_attempts = db.query(QuizAttempt).filter(
            QuizAttempt.user_id == current_user.id,
            QuizAttempt.topic == req.topic
        ).order_by(QuizAttempt.created_at.desc()).limit(3).all()

        difficulty = "Medium"
        if previous_attempts:
            avg_score = sum([a.score / a.total_questions for a in previous_attempts]) / len(previous_attempts)
            if avg_score > 0.8:
                difficulty = "Hard"
            elif avg_score < 0.5:
                difficulty = "Easy"
        
        logger.info(f"Generating {difficulty} difficulty quiz for {current_user.email} on {req.topic}")

        # 2. Embed query
        query_embedding = gemini_service.get_query_embedding(req.topic)

        # 3. Retrieve context from Pinecone (Initial Top 20)
        initial_docs = pinecone_service.query_docs(
            query_embedding=query_embedding,
            query_text=req.topic,
            subject=req.subject,
            n_results=20
        )

        if not initial_docs:
            raise HTTPException(
                status_code=400,
                detail="INSUFFICIENT_CONTEXT: No relevant material found"
            )

        # 4. Rerank with Cohere (Top 5)
        relevant_docs = rerank_service.rerank(req.topic, initial_docs, 5)

        context_parts = []
        for doc in relevant_docs:
            source = doc['metadata'].get('filename', 'Unknown Source')
            context_parts.append(f"[Source: {source}]\n{doc['text']}")
        context = "\n\n".join(context_parts)

        # 5. STRICT PROMPT
        difficulty_instruction = ""
        if difficulty == "Hard":
            difficulty_instruction = "Make the questions CHALLENGING and deep, focusing on advanced applications and critical thinking."
        elif difficulty == "Easy":
            difficulty_instruction = "Make the questions SIMPLE and foundational, focusing on core definitions and basic concepts."
        else:
            difficulty_instruction = "Make the questions of moderate difficulty, covering standard curriculum expectations."

        prompt = f"""
You are an AI tutor. Your task is to generate a quiz specifically about the topic: "{req.topic}".
Target Difficulty: {difficulty}
{difficulty_instruction}

Generate EXACTLY {req.num_questions} multiple-choice questions.

STRICT RULES:
- The questions MUST be about "{req.topic}".
- Use ONLY the context provided below.
- If the context is about a different subject or does not contain enough information to generate high-quality questions about "{req.topic}" → return ONLY the string "INSUFFICIENT_CONTEXT".
- DO NOT use outside knowledge to fill gaps.
- Each question must have 4 options.
- Include correct answer and explanation.

Context:
{context}

Return STRICT JSON:
{{
  "questions": [
    {{
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "answer": "...",
      "explanation": "...",
      "source": "from context"
    }}
  ]
}}
"""

        # 6. Generate
        response = await gemini_service.generate_response(prompt)

        if "INSUFFICIENT_CONTEXT" in response:
             raise HTTPException(
                status_code=400,
                detail="The archive does not contain enough information on this topic to generate a quiz."
            )

        quiz_data = safe_parse_json(response)

        return {
            "topic": req.topic,
            "difficulty": difficulty,
            "questions": quiz_data["questions"]
        }

    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/quiz/result")
async def save_quiz_result(
    req: QuizResultSave,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        new_result = QuizAttempt(
            user_id=current_user.id,
            topic=req.topic,
            score=req.score,
            total_questions=req.total_questions,
            difficulty=req.difficulty
        )
        db.add(new_result)
        db.commit()
        return {"status": "success", "message": "Quiz result saved"}
    except Exception as e:
        logger.error(f"Failed to save quiz result: {e}")
        raise HTTPException(status_code=500, detail="Database error")
