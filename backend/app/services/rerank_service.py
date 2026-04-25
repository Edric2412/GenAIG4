import cohere
from app.config import settings
import logging

logger = logging.getLogger(__name__)

class RerankService:
    def __init__(self):
        if not settings.COHERE_API_KEY:
            logger.warning("COHERE_API_KEY not set. RerankService will be inactive.")
            self.co = None
            return
        
        self.co = cohere.Client(api_key=settings.COHERE_API_KEY)

    def rerank(self, query: str, documents: list[dict], top_n: int = 5):
        """
        Reranks a list of documents based on a query using Cohere's Rerank API.
        
        Documents should be a list of dictionaries with at least a 'text' key.
        """
        if not self.co or not documents:
            # Fallback: return top_n from original list if rerank is disabled
            return documents[:top_n]

        try:
            # Extract texts for Cohere
            texts = [doc['text'] for doc in documents]
            
            # Call Cohere Rerank
            # model='rerank-english-v3.0' or 'rerank-multilingual-v3.0'
            results = self.co.rerank(
                query=query,
                documents=texts,
                top_n=top_n,
                model='rerank-english-v3.0'
            )
            
            # Reorder original documents based on rerank indices
            reranked_docs = []
            for result in results.results:
                index = result.index
                doc = documents[index]
                # Attach rerank score if needed
                doc['rerank_score'] = result.relevance_score
                reranked_docs.append(doc)
                
            logger.info(f"Successfully reranked {len(documents)} documents down to {len(reranked_docs)}")
            return reranked_docs
            
        except Exception as e:
            logger.error(f"Error during reranking: {e}")
            # Fallback to original order on error
            return documents[:top_n]

rerank_service = RerankService()
