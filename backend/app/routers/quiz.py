from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
import json
import logging

from app.database import get_db
from app.models import User, QuizAttempt
from app.routers.auth import get_current_user
from app.services.chroma_service import chroma_service
from app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)
router = APIRouter(tags=["quiz"])

# SCHEMAS

class QuizRequest(BaseModel):
    topic: str
    subject: str
    num_questions: int = 5
    previous_score: int = 0

class Question(BaseModel):
    question: str
    options: List[str]
    answer: str
    explanation: str
    source: str
    difficulty: str

class QuizResponse(BaseModel):
    topic: str
    difficulty: str
    questions: List[Question]

# HELPER
def safe_parse_json(text: str):
    try:
        cleaned = text.strip()

        if cleaned.startswith("```json"):
            cleaned = cleaned.replace("```json", "").replace("```", "").strip()

        return json.loads(cleaned)

    except Exception as e:
        logger.error(f"Failed JSON parse: {e}")
        logger.error(f"Raw output: {text}")

        raise HTTPException(
            status_code=500,
            detail="LLM returned invalid JSON"
        )

# ROUTE 
@router.post("/quiz", response_model=QuizResponse)
async def generate_quiz(
    req: QuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    difficulty = "medium"

    if req.previous_score > 0:
        if req.previous_score >= 4:
            difficulty = "hard"
        elif req.previous_score <= 2:
            difficulty = "easy"
    try:
        # Embed query
        query_embedding = gemini_service.get_query_embedding(req.topic)

        # Retrieve context
        docs = chroma_service.query_docs(
            query_embedding=query_embedding,
            subject=req.subject,
            n_results=5
        )

        if not docs:
            raise HTTPException(
                status_code=400,
                detail="INSUFFICIENT_CONTEXT: No relevant material found"
            )

        context = "\n\n".join(docs)

        # STRICT PROMPT
        prompt = f"""
You are an adaptive AI tutor.

Generate EXACTLY {req.num_questions} MCQs.

Difficulty Level: {difficulty}

STRICT RULES:
- Use ONLY the provided context
- DO NOT use outside knowledge
- Questions MUST match the difficulty level
- Easy = basic understanding
- Medium = conceptual reasoning
- Hard = analytical/problem-solving
- Each question must have 4 options
- Include explanation
- Return STRICT JSON ONLY

Context:
{context}

Return JSON:
{{
  "questions": [
    {{
      "question": "...",
      "options": ["A", "B", "C", "D"],
      "answer": "...",
      "explanation": "...",
      "source": "context",
      "difficulty": "{difficulty}"
    }}
  ]
}}
"""

        # Generate
        response = await gemini_service.generate_response(prompt)

        quiz_data = safe_parse_json(response)

        # Save quiz attempt
        attempt = QuizAttempt(
            user_id=current_user.id,
            topic=req.topic,
            difficulty=difficulty,
            score=0
        )

        db.add(attempt)
        db.commit()

        return {
            "topic": req.topic,
            "difficulty": difficulty,
            "questions": quiz_data["questions"]
        }

    except HTTPException:
        raise

    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))