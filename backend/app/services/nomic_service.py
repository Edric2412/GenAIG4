import nomic
from nomic import atlas
import pandas as pd
import numpy as np
from app.config import settings
from app.services.pinecone_service import pinecone_service
import logging
import time

logger = logging.getLogger(__name__)

class NomicService:
    def __init__(self):
        if not settings.NOMIC_API_KEY:
            logger.warning("NOMIC_API_KEY not set. NomicService will be inactive.")
            return
        
        nomic.login(settings.NOMIC_API_KEY)

    def generate_atlas_map(self):
        """
        Fetches all vectors from Pinecone and creates a Nomic Atlas map.
        """
        if not settings.NOMIC_API_KEY or not pinecone_service.index:
            return None

        logger.info("Starting Nomic Atlas map generation...")

        try:
            # 1. Fetch all vectors from Pinecone
            results = pinecone_service.index.query(
                vector=[0.0] * 3072, 
                top_k=10000,
                include_metadata=True,
                include_values=True
            )

            if not results['matches']:
                logger.warning("No data found in Pinecone to visualize.")
                return None

            data = []
            for match in results['matches']:
                data.append({
                    "id": match['id'],
                    "text": match['metadata']['text'],
                    "filename": match['metadata']['filename'],
                    "subject": match['metadata']['subject'],
                    "vector": match['values']
                })

            df = pd.DataFrame(data)
            embeddings = np.array(df['vector'].tolist())
            df = df.drop(columns=['vector'])

            # 2. Handle existing dataset
            dataset_id = "atlas-tutor-knowledge-base"
            try:
                # Attempt to delete existing dataset if it exists to allow a fresh map
                from nomic import dataset
                existing = dataset.AtlasDataset(f"edricjeffrey07/{dataset_id}")
                logger.info(f"Deleting existing dataset to allow fresh sync: {dataset_id}")
                existing.delete()
                time.sleep(2) # Brief pause for cleanup
            except Exception:
                logger.debug("No existing dataset found, proceeding to create.")

            # 3. Upload and Map
            project = atlas.map_data(
                data=df.to_dict('records'),
                embeddings=embeddings,
                identifier=dataset_id,
                description="A visual map of the student's academic syllabus and documents.",
                topic_model=True
            )

            map_url = project.maps[0].map_link
            logger.info(f"Nomic Atlas map created: {map_url}")
            return map_url

        except Exception as e:
            logger.error(f"Failed to generate Nomic map: {e}")
            return None

nomic_service = NomicService()
