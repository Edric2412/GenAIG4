from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Document, Subject, User
from app.routers.auth import get_current_user
from app.services.file_service import file_service
from app.services.embedding_service import embedding_service
from app.utils.loader import load_text
import logging

logger = logging.getLogger(__name__)
router = APIRouter(tags=["upload"])

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    subject_name: str = Form("General"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can upload documents")
    try:
        logger.info(f"Uploading file: {file.filename} with subject: {subject_name}")
        
        # 1. Get or create subject
        subject = db.query(Subject).filter(Subject.name == subject_name).first()
        if not subject:
            subject = Subject(name=subject_name)
            db.add(subject)
            db.commit()
            db.refresh(subject)

        # 2. Save physical file
        file_path = await file_service.save_file(file)
        
        # 3. Extract and chunk
        text = load_text(file_path)
        if not text:
            raise HTTPException(status_code=400, detail="Could not extract text from file.")
            
        doc_id, chunk_count = embedding_service.process_and_store(text, file.filename, subject_name)
        
        # 4. Store metadata in Postgres
        new_doc = Document(
            id=doc_id,
            filename=file.filename,
            subject_id=subject.id,
            chunk_count=chunk_count
        )
        db.add(new_doc)
        db.commit()
        
        return {"id": doc_id, "filename": file.filename, "chunks": chunk_count, "subject": subject_name}
    except Exception as e:
        logger.error(f"Error during upload: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
