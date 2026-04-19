from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User
from app.config import settings
from datetime import datetime, timedelta
from jose import jwt
from typing import Optional

from jose import jwt, JWTError
from typing import Optional
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

class LoginRequest(BaseModel):
    email: str
    password: str

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Basic demo validation
    if request.password not in ["admin123", "student123", "password123"]:
        raise HTTPException(status_code=401, detail="Invalid credentials. Please use 'admin123' or 'student123' for the demo.")

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # Auto-create for demo
        role = "admin" if "admin" in request.email.lower() else "student"
        user = User(email=request.email, role=role)
        db.add(user)
        db.commit()
        db.refresh(user)
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
             
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": user.role, 
        "id": str(user.id)
    }
