from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User

router = APIRouter(tags=["auth"])

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Basic mock validation
    if request.password not in ["admin123", "student123", "password123"]:
        raise HTTPException(status_code=401, detail="Invalid credentials. Please use 'admin123' or 'student123' for the demo.")

    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        # For simplicity in this stage, we'll auto-create users if they don't exist
        # except for the admin check
        if request.email == "admin@atlas.com" or request.email == "admin@atlas.edu":
             user = User(email=request.email, role="admin")
             db.add(user)
             db.commit()
             db.refresh(user)
        else:
             user = User(email=request.email, role="student")
             db.add(user)
             db.commit()
             db.refresh(user)
             
    return {"role": user.role, "id": str(user.id)}
