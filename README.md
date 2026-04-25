# <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsrC2l9JcxRoaPl_FIg00yb3VmMJCVdgualEX0Whif1gp7brGWXvUnl0mUF4ALL-B3y5Jsn-iePPMKyMCdT61ZSCnmZUtBHB9WEd_ob4-qPyMzq27H0_SS6bczKkkAslYuFLJUtAELP3eei2tt4S8ZlHmgd5RLO2W6_065VS_Kv5Xy0mnu2sBEssCjCyg5IxeBOOBW-QTIsBG4B1k1LhCn2jNfsbI6ToF5k82NMytIGsl7BLcNRcQTE4ox8xCfn4wcOIM3Kezoo2s" width="45" auto="center"> Atlas: The Ethereal AI Tutor

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2015-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Pinecone](https://img.shields.io/badge/Vector%20DB-Pinecone-231F20?style=for-the-badge&logo=pinecone)](https://www.pinecone.io/)
[![Cohere](https://img.shields.io/badge/Rerank-Cohere-5C2D91?style=for-the-badge&logo=cohere)](https://cohere.ai/)
[![Gemini](https://img.shields.io/badge/LLM-Gemini%202.5-4285F4?style=for-the-badge&logo=google-gemini)](https://deepmind.google/technologies/gemini/)

Atlas is a state-of-the-art AI Tutoring System that transforms static course curriculums into interactive, 3D visual universes. By combining **Advanced RAG** with **Cross-Encoder Re-ranking**, Atlas provides precise, syllabus-grounded tutoring that adapts to every student's pace.

---

## ✨ Core Superpowers

*   🧠 **Advanced RAG Pipeline**: High-precision retrieval using Gemini embeddings, Pinecone storage, and Cohere Rerank-3 for zero-hallucination tutoring.
*   🌌 **Knowledge Universe**: A breathtaking 3D/2D visualization powered by **Nomic Atlas**. Explore your syllabus as a constellation of connected concepts.
*   📊 **Adaptive Learning Loop**: Personalized quiz generation (Easy/Medium/Hard) that automatically scales based on your real-time performance.
*   🔢 **STEM Optimized**: Built-in LaTeX support renders complex calculus and physics formulas with textbook-quality precision.
*   📝 **Interactive Citations**: Granular, line-level citations displayed as hoverable "curved boxes" that link directly to your source materials.
*   ⚡ **Async Streaming**: Token-by-token streaming via asynchronous SSE for sub-2s initial response engagement.

---

## 🏗️ Database Architecture

Atlas uses a robust relational schema to track your learning journey.

```mermaid
erDiagram
    User ||--o{ Conversation : initiates
    User ||--o{ QuizAttempt : takes
    Subject ||--o{ Document : contains
    Conversation ||--o{ ChatHistory : contains
    
    User {
        string id PK
        string email
        string role "student | admin"
    }
    Document {
        string id PK
        string filename
        int chunk_count
    }
    ChatHistory {
        string id PK
        text query
        text response
        datetime created_at
    }
    QuizAttempt {
        string id PK
        string topic
        int score
        string difficulty "Easy | Medium | Hard"
    }
```

---

## 🛠️ Getting Started

### 1. Prerequisites
Ensure you have Python 3.10+ and Node.js 18+ installed.

### 2. Environment Configuration
Create a `.env` file in the `backend/` directory with the following:
```env
GEMINI_API_KEY=your_key
PINECONE_API_KEY=your_key
PINECONE_INDEX_NAME=atlas-tutor
COHERE_API_KEY=your_key
NOMIC_API_KEY=your_key
```

### 3. Backend Setup & Migrations
```bash
cd backend
# Create virtual environment
python -m venv venv
source venv/bin/activate # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations
alembic upgrade head

# Start the engine
python -m uvicorn app.main:app --reload
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to enter the Archive.

---

## 📈 Performance KPIs

| Metric | Target | Status |
| :--- | :--- | :--- |
| **Initial Latency (TTFT)** | < 2.0s | ✅ Optimized |
| **Retrieval Depth** | Top 20 Candidates | ✅ Implemented |
| **Rerank Accuracy** | Cohere Rerank-3 | ✅ Integrated |
| **Response Faithfulness** | LLM-as-a-Judge (GPT-4/Gemini) | ✅ Monitored |

---

## 📜 Roadmap & Final Deliverables
- [x] Document Ingestion & Chunking
- [x] Pinecone Vector Integration
- [x] Cohere Cross-Encoder Reranking
- [x] Adaptive Quiz Difficulty Loop
- [x] Nomic Atlas Knowledge Mapping
- [x] Interactive LaTeX Math Rendering
