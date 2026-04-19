import google.generativeai as genai
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-3-flash-preview')

    async def generate_response(self, prompt: str) -> str:
        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Error generating response from Gemini: {e}")
            return "I'm sorry, I couldn't generate a response at this time."

    async def generate_response_stream(self, prompt: str):
        import asyncio
        try:
            response = self.model.generate_content(prompt, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    await asyncio.sleep(0.01)
        except Exception as e:
            logger.error(f"Error streaming response from Gemini: {e}")
            yield "I encountered an error accessing the archive. Please try again."

    def get_embeddings(self, text_chunks: list[str]):
        try:
            result = genai.embed_content(
                model="models/gemini-embedding-2-preview",
                content=text_chunks,
                task_type="retrieval_document"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"Error generating embeddings from Gemini: {e}")
            raise e

    def get_query_embedding(self, query: str):
        try:
            result = genai.embed_content(
                model="models/gemini-embedding-2-preview",
                content=query,
                task_type="retrieval_query"
            )
            return result['embedding']
        except Exception as e:
            logger.error(f"Error generating query embedding from Gemini: {e}")
            raise e

gemini_service = GeminiService()
