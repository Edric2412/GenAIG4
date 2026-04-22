from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List
import json
import logging

from app.database import get_db
from app.models import User
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

class Question(BaseModel):
    question: str
    options: List[str]
    answer: str
    explanation: str
    source: str

class QuizResponse(BaseModel):
    topic: str
    questions: List[Question]

# HELPER
def safe_parse_json(text: str):
    try:
        return json.loads(text)
    except:
        logger.error("Failed JSON parse, raw output: %s", text)
        raise HTTPException(status_code=500, detail="LLM returned invalid JSON")

# ROUTE 
@router.post("/quiz", response_model=QuizResponse)
async def generate_quiz(
    req: QuizRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
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
You are an AI tutor.

Generate EXACTLY {req.num_questions} multiple-choice questions.

STRICT RULES:
- Use ONLY the context below
- DO NOT use outside knowledge
- If context is insufficient → return "INSUFFICIENT_CONTEXT"
- Each question must have 4 options
- Include correct answer and explanation
- Keep answers factual and grounded

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

        # Generate
        response = await gemini_service.generate_response(prompt)

        quiz_data = safe_parse_json(response)

        return {
            "topic": req.topic,
            "questions": quiz_data["questions"]
        }

    except Exception as e:
        logger.error(f"Quiz generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))