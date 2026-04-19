# Atlas Tutor: The Ethereal Archive

Atlas Tutor is a premium, AI-powered RAG (Retrieval-Augmented Generation) application designed to help students and researchers navigate their academic archives. It provides an "Ethereal Archive" interface—a high-end, academic-focused UI built for deep learning and concept exploration.

## 🌟 Key Features

- **The Ethereal UI**: A modern, dark-themed interface with glassmorphism, smooth animations, and academic typography.
- **RAG-Powered Chat**: Ask questions directly to your documents. Atlas uses Gemini 2.0 and ChromaDB to retrieve relevant context.
- **Intelligent Tutoring**: Atlas doesn't just quote text; it bridges the gap between your archive and general knowledge to explain foundational concepts.
- **Archive Management**: Upload center for admins to curate knowledge sources and a library to manage the digital archive.
- **Subject-Aware**: Filter your queries by specific subjects or search the universal archive.

## 🏗️ Technical Stack

- **Frontend**: Next.js 15+, Tailwind CSS 3.4+, React Markdown.
- **Backend**: FastAPI (Python 3.12+), SQLAlchemy (SQLite).
- **AI/LLM**: Google Gemini 2.0 (Flash & Pro), Gemini Embeddings.
- **Vector Database**: ChromaDB.

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
```

Run migrations and start the server:
```bash
alembic upgrade head
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
- **Student**: Default role. Focuses on the Chat interface (`/chat`).
- **Admin**: Can access the Upload Center (`/upload`) and Document Library (`/library`).
- *Note: Role is currently persisted in localStorage as `atlas_role`.*

### Chatting with Atlas
1. Select a subject from the top navbar or use "All Subjects".
2. Ask questions about the concepts in your documents.
3. Use the **Copy** button on Atlas's responses to quickly grab explanations.

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
