# Atlas Tutor: The Ethereal Archive

Atlas Tutor is a premium, AI-powered RAG (Retrieval-Augmented Generation) application designed to help students and researchers navigate their academic archives. It provides an "Ethereal Archive" interface—a high-end, academic-focused UI built for deep learning and concept exploration.

## 🌟 Key Features

- **The Ethereal UI**: A modern, dark-themed interface with glassmorphism, smooth animations, and academic typography.
- **RAG-Powered Chat**: Ask questions directly to your documents. Atlas uses Gemini 2.0 and ChromaDB to retrieve relevant context.
- **Adaptive Quiz System**: Generate context-aware, multiple-choice quizzes from your study materials to test your knowledge and track progress.
- **Intelligent Tutoring**: Atlas doesn't just quote text; it bridges the gap between your archive and general knowledge to explain foundational concepts.
- **Archive Management**: Upload center for admins to curate knowledge sources and a library to manage the digital archive.
- **Subject-Aware**: Filter your queries by specific subjects or search the universal archive.

## 🏗️ Technical Stack

- **Frontend**: Next.js 15+, Tailwind CSS 3.4+, React Markdown.
- **Backend**: FastAPI (Python 3.12+), SQLAlchemy (SQLite).
- **AI/LLM**: Google Gemini 2.0 (Flash & Pro), Gemini Embeddings.
- **Vector Database**: ChromaDB.
- **Migrations**: Alembic.

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.12+
- Node.js 18+
- Google Gemini API Key

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
GEMINI_API_KEY=your_key_here
CHROMA_DB_PATH=./chroma_db
UPLOADS_DIR=./uploads
DATABASE_URL=sqlite:///./atlas_tutor.db
SECRET_KEY=your_secret_key_here_for_demo
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
```

#### Database Migrations (Alembic)
Before starting the server for the first time, or after pulling new changes, ensure your database schema is up to date:
```bash
# From the backend directory
alembic upgrade head
```

#### Start the Server
```bash
./start.sh
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env.local` file in the `frontend/` directory:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Start the development server:
```bash
npm run dev
```

---

## 📖 Usage for Teamates

### Roles
- **Student**: Default role. Focuses on the Chat interface and Quiz module.
- **Admin**: Full access, including the Upload Center (`/upload`) and Document Library (`/library`).
- *Note: Role is currently persisted in localStorage as `atlas_role`.*

### Chatting with Atlas
1. Select a subject from the top navbar or use "All Subjects".
2. Ask questions about the concepts in your documents.
3. Use the **Copy** button on Atlas's responses to quickly grab explanations.

### Adaptive Quizzes
1. Navigate to the **Quiz** section from the sidebar.
2. Enter a specific topic you've been studying (e.g., "Backpropagation").
3. Atlas will retrieve relevant context from your archive and generate a 5-question multiple-choice quiz.
4. If the topic is not found in your archive, Atlas will notify you rather than using external knowledge.

### Uploading Documents
1. Log in as an Admin.
2. Go to the **Upload Center**.
3. Select a subject name (e.g., "Abstract Mathematics") and upload your PDF.
4. Atlas will automatically chunk, embed, and store the document in the vector database.

## 🎨 UI Philosophy: "The Ethereal Archive"
The UI is designed to feel like a high-end educational tool. 
- **Typography**: Uses `Newsreader` for headers to give an academic, editorial feel.
- **Scrolling**: The custom `ethereal-scrollbar` is minimalist to keep focus on content.
- **Tone**: The AI persona "Atlas" is programmed to be academic yet accessible.

---
*Created with ❤️ by the GenAI G4 Team*
