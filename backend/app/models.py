from sqlalchemy import Column, String, ForeignKey, DateTime, Integer, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(String, default="student") # admin, student
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, nullable=False)
    documents = relationship("Document", back_populates="subject")

class Document(Base):
    __tablename__ = "documents"
    id = Column(String, primary_key=True) # Matches ChromaDB doc_id (UUID string)
    filename = Column(String, nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id"))
    chunk_count = Column(Integer)
    upload_date = Column(DateTime(timezone=True), server_default=func.now())
    
    subject = relationship("Subject", back_populates="documents")

class Conversation(Base):
    __tablename__ = "conversations"
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    title = Column(String, nullable=False, default="New Conversation")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    messages = relationship("ChatHistory", back_populates="conversation", cascade="all, delete-orphan")

class ChatHistory(Base):
    __tablename__ = "chat_history"
    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"))
    query = Column(Text, nullable=False)
    response = Column(Text, nullable=False)
    citations = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")
