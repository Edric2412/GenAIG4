import logging
from app.services.gemini_service import gemini_service

logger = logging.getLogger(__name__)

async def evaluate_faithfulness(question: str, context: str, answer: str) -> float:
    """
    Evaluates how faithful the AI's answer is to the provided context.
    Returns a score between 0 and 1.
    """
    prompt = f"""
Evaluate the following AI response for "Faithfulness" to the provided context.
Faithfulness means the answer is strictly derived from the context and does not contain outside hallucinations.

Context:
{context}

Student Question:
{question}

AI Response:
{answer}

Criteria:
1. Is every claim in the AI response supported by the Context?
2. Did the AI introduce any facts NOT found in the Context?

Return ONLY a numeric score between 0.0 and 1.0 (where 1.0 is perfectly faithful).
"""
    try:
        response = await gemini_service.generate_response(prompt)
        # Try to extract a float
        score = float(response.strip())
        return min(max(score, 0.0), 1.0)
    except Exception as e:
        logger.error(f"Faithfulness evaluation failed: {e}")
        return 0.5 # Neutral fallback

async def evaluate_context_relevance(question: str, context: str) -> float:
    """
    Evaluates how relevant the retrieved context is to the student's question.
    """
    prompt = f"""
Evaluate the relevance of the following Context to the Student Question.

Student Question:
{question}

Context:
{context}

Return ONLY a numeric score between 0.0 and 1.0 (where 1.0 means the context contains the direct answer).
"""
    try:
        response = await gemini_service.generate_response(prompt)
        score = float(response.strip())
        return min(max(score, 0.0), 1.0)
    except Exception as e:
        logger.error(f"Relevance evaluation failed: {e}")
        return 0.5
