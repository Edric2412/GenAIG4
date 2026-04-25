from app.services.gemini_service import gemini_service
from app.services.pinecone_service import pinecone_service
from app.utils.chunking import split_text
import logging

logger = logging.getLogger(__name__)

class EmbeddingService:
    def process_and_store(self, text: str, filename: str, subject: str):
        logger.info(f"Processing text for {filename} (Subject: {subject})...")
        chunks = split_text(text)
        logger.info(f"Split into {len(chunks)} chunks.")
        
        embeddings = gemini_service.get_embeddings(chunks)
        doc_id = pinecone_service.store_chunks(chunks, embeddings, filename, subject)
        
        return doc_id, len(chunks)

embedding_service = EmbeddingService()
