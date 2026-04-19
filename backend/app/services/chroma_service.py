import chromadb
from app.config import settings
import logging
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

class ChromaService:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)
        self.collection = self.client.get_or_create_collection(name="atlas_tutor_docs")

    def store_chunks(self, chunks: list[str], embeddings: list[list[float]], filename: str, subject: str):
        doc_id = str(uuid.uuid4())
        upload_date = datetime.now().isoformat()
        ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
        metadatas = [{
            "document_id": doc_id,
            "filename": filename,
            "subject": subject,
            "upload_date": upload_date,
            "chunk_count": len(chunks)
        } for _ in chunks]
        
        self.collection.add(
            ids=ids,
            embeddings=embeddings,
            documents=chunks,
            metadatas=metadatas
        )
        logger.info(f"Stored {len(chunks)} chunks for {filename} (Subject: {subject}) in ChromaDB.")
        return doc_id

    def query_docs(self, query_embedding: list[float], subject: str = None, n_results: int = 5):
        where_filter = {"subject": subject} if subject and subject != "all" else None
        
        logger.info(f"Querying ChromaDB with subject filter: {subject}")
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            where=where_filter
        )
        
        if results['documents'] and results['documents'][0]:
            logger.info(f"Retrieved {len(results['documents'][0])} relevant chunks.")
            return results['documents'][0]
        return []

    def list_documents(self):
        results = self.collection.get(include=['metadatas'])
        seen_ids = set()
        docs = []
        if results['metadatas']:
            for meta in results['metadatas']:
                doc_id = meta['document_id']
                if doc_id not in seen_ids:
                    docs.append({
                        "id": doc_id,
                        "filename": meta['filename'],
                        "subject": meta['subject'],
                        "upload_date": meta['upload_date'],
                        "chunk_count": meta['chunk_count']
                    })
                    seen_ids.add(doc_id)
        return docs

    def delete_document(self, document_id: str):
        # We need to find the filename to delete the local file, or just use document_id for chroma
        # Since our router currently uses filename, let's adapt to document_id
        self.collection.delete(where={"document_id": document_id})
        logger.info(f"Deleted document ID {document_id} from ChromaDB.")

chroma_service = ChromaService()
