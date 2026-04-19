from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from .database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="student") # admin, student
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    documents = relationship("Document", back_populates="subject")

class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True) # Matches ChromaDB doc_id (UUID string)
    filename = Column(String, nullable=False)
    subject_id = Column(UUID(as_uuid=True), ForeignKey("subjects.id"))
    chunk_count = Column(Integer)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    
    subject = relationship("Subject", back_populates="documents")

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
