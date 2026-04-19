from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Document, Subject, User
from app.routers.auth import get_current_user
from app.services.chroma_service import chroma_service
from app.services.file_service import file_service

router = APIRouter(tags=["library"])

@router.get("/documents")
async def get_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    docs = db.query(Document).all()
    return [{
        "id": str(d.id),
        "filename": d.filename,
        "subject": d.subject.name if d.subject else "General",
        "upload_date": d.upload_date,
        "chunk_count": d.chunk_count
    } for d in docs]

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete documents")
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    filename = doc.filename
    
    # Delete from DB
    db.delete(doc)
    db.commit()
    
    # Delete from Chroma
    chroma_service.delete_document(document_id)
    
    # Delete from Filesystem
    file_service.delete_file(filename)
        
    return {"message": f"Document {document_id} deleted successfully."}
