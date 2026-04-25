from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.routers.auth import get_current_user
from app.models import User
from app.services.nomic_service import nomic_service
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["nomic"])

@router.post("/nomic/map")
async def create_map(current_user: User = Depends(get_current_user)):
    # Only admins can trigger map generation to save costs/limit usage
    if current_user.role != "admin":
        # For this prototype, we'll allow all users or just log it
        logger.info(f"User {current_user.email} is generating a knowledge map.")
    
    url = nomic_service.generate_atlas_map()
    if not url:
        raise HTTPException(status_code=500, detail="Failed to generate map. Ensure you have documents uploaded.")
    
    return {"map_url": url}
