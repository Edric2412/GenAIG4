import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        # Using the requested model gemini-2.5-flash
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Optimized for a Tutor: High precision, lower creativity
        self.generation_config = {
            "temperature": 0.3,
            "top_p": 0.8,
            "top_k": 40,
            "max_output_tokens": 8192,
        }

        # Safety settings to prevent buffering/blocking on educational content
        self.safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }

    async def generate_response(self, prompt: str) -> str:
        try:
            response = await self.model.generate_content_async(
                prompt, 
                generation_config=self.generation_config,
                safety_settings=self.safety_settings
            )
            return response.text
        except Exception as e:
            logger.error(f"Error generating response from Gemini: {e}")
            return "I'm sorry, I couldn't generate a response at this time."

    async def generate_response_stream(self, prompt: str):
        try:
            # generate_content_async with stream=True is the key to faster TTFT
            response = await self.model.generate_content_async(
                prompt, 
                stream=True,
                generation_config=self.generation_config,
                safety_settings=self.safety_settings
            )
            async for chunk in response:
                if chunk.text:
                    yield chunk.text
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
