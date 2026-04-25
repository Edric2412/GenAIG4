import os
import time
from pinecone import Pinecone, ServerlessSpec
from app.config import settings
import logging
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

class PineconeService:
    def __init__(self):
        self.pc = None
        self.index = None
        self.index_name = settings.PINECONE_INDEX_NAME

        if not settings.PINECONE_API_KEY:
            logger.warning("PINECONE_API_KEY not set. PineconeService will be inactive.")
            return

        try:
            # Strip key just in case whitespace leaked in
            api_key = settings.PINECONE_API_KEY.strip()
            self.pc = Pinecone(api_key=api_key)
            
            # Check if index exists - this is where 401 usually happens
            existing_indexes = [idx.name for idx in self.pc.list_indexes()]
            
            if self.index_name not in existing_indexes:
                logger.info(f"Creating new index: {self.index_name}")
                self.pc.create_index(
                    name=self.index_name,
                    dimension=3072, 
                    metric="cosine",
                    spec=ServerlessSpec(
                        cloud="aws",
                        region="us-east-1" # Ensure this matches your Pinecone project region
                    )
                )
                # Wait for index to be ready
                while not self.pc.describe_index(self.index_name).status['ready']:
                    logger.info("Waiting for Pinecone index to initialize...")
                    time.sleep(2)
            
            self.index = self.pc.Index(self.index_name)
            logger.info(f"Successfully connected to Pinecone index: {self.index_name}")

        except Exception as e:
            logger.error(f"Failed to initialize Pinecone: {e}")
            self.pc = None

    def store_chunks(self, chunks: list[str], embeddings: list[list[float]], filename: str, subject: str):
        if not self.index:
            logger.error("Cannot store chunks: Pinecone not initialized.")
            return None

        doc_id = str(uuid.uuid4())
        upload_date = datetime.now().isoformat()
        
        vectors = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            vectors.append({
                "id": f"{doc_id}_{i}",
                "values": embedding,
                "metadata": {
                    "document_id": doc_id,
                    "text": chunk,
                    "filename": filename,
                    "subject": subject,
                    "upload_date": upload_date,
                    "chunk_count": len(chunks)
                }
            })
        
        # Upsert in batches
        for i in range(0, len(vectors), 100):
            self.index.upsert(vectors=vectors[i:i+100])
            
        logger.info(f"Stored {len(chunks)} chunks for {filename} in Pinecone.")
        return doc_id

    def query_docs(self, query_embedding: list[float], query_text: str = None, subject: str = None, n_results: int = 20):
        if not self.index:
            logger.warning("Query ignored: Pinecone index not connected.")
            return []

        filter_dict = {"subject": subject} if subject and subject != "all" else None
        
        results = self.index.query(
            vector=query_embedding,
            top_k=n_results,
            filter=filter_dict,
            include_metadata=True
        )
        
        formatted_results = []
        for match in results['matches']:
            formatted_results.append({
                "text": match['metadata']['text'],
                "metadata": {
                    "filename": match['metadata']['filename'],
                    "document_id": match['metadata']['document_id'],
                    "subject": match['metadata']['subject']
                },
                "score": match['score']
            })
            
        return formatted_results

    def delete_document(self, document_id: str):
        if not self.index:
            return
        self.index.delete(filter={"document_id": document_id})
        logger.info(f"Deleted document ID {document_id} from Pinecone.")

pinecone_service = PineconeService()
