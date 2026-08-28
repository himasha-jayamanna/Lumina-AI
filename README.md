# Lumina Agentic RAG (Personal Edition)

> **Personal AI Assistant for Policy & Procedure Documents**  
> Powered by OpenRouter · LangGraph · FastAPI · React · MSSQL

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Running the Application Locally](#4-running-the-application-locally)
5. [Environment Setup](#5-environment-setup)
6. [Database Schema](#6-database-schema)
7. [Admin Tools](#7-admin-tools)
8. [API Reference](#8-api-reference)
9. [AI Agent Pipeline](#9-ai-agent-pipeline)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Overview

**Lumina Agentic RAG** is a powerful AI assistant that enables querying internal documents through a secure, conversational interface.

Users log in via Google SSO. The AI reads uploaded policy PDFs, understands questions in plain language, and responds with accurate, cited answers — verified by a multi-agent hallucination-checking pipeline.

### Key Features

| Feature | Detail |
|---|---|
| **AI Model** | OpenRouter Models / Local Ollama |
| **PDF Parsing** | LlamaParse |
| **Vector Store** | ChromaDB (persistent, on-server) |
| **Embeddings** | HuggingFace (`BAAI/bge-small-en-v1.5`) |
| **Agent Pipeline** | LangGraph — Researcher → Communicator → Reviewer → Audit |
| **Semantic Cache** | ChromaDB-based similarity cache (reduces API costs) |
| **Authentication** | Google SSO |
| **Database** | Microsoft SQL Server 2022 |
| **API** | FastAPI with SSE streaming |
| **Frontend** | React 19 + Vite + TailwindCSS |

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend                            │
│  (Vite + TailwindCSS · Port 3000)                           │
│                                                             │
│  ┌──────────────┐   ┌────────────────────────────────────┐  │
│  │  Google SSO  │   │  Chat View (SSE Streaming)          │  │
│  │  Login Page  │   │  • Session History Sidebar          │  │
│  └──────────────┘   │  • Agent Pipeline Progress View     │  │
│  ┌──────────────┐   │  • Document Citations & Download    │  │
│  │  Admin Panel │   └────────────────────────────────────┘  │
│  │  • Upload PDF│                                           │
│  │  • Manage KB │                                           │
│  └──────────────┘                                           │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTP / SSE
                            ▼
┌─────────────────────────────────────────────────────────────┐
│          FastAPI Backend  (Port 8001)                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │               LangGraph Pipeline                     │   │
│  │                                                      │   │
│  │  Semantic Cache Check                                │   │
│  │       │                                              │   │
│  │       ├── CACHE HIT  → Return instantly              │   │
│  │       │                                              │   │
│  │       └── CACHE MISS → Run AI Pipeline:              │   │
│  │                                                      │   │
│  │  [Researcher] → [Communicator] → [Reviewer]          │   │
│  │                                      │               │   │
│  │                              ┌───────┴──────┐        │   │
│  │                           PASS            FAIL       │   │
│  │                              │         (retry ≤3)    │   │
│  │                              ▼               │       │   │
│  │                         [Audit Node] ◄───────┘       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

### Backend
| Component | Technology |
|---|---|
| Language | Python 3.11 |
| API Framework | FastAPI + Uvicorn |
| AI Orchestration | LangGraph (StateGraph) |
| LLM | Google/OpenRouter/Ollama Dynamic Selection |
| Embeddings | `BAAI/bge-small-en-v1.5` |
| Vector Database | ChromaDB |
| PDF Parsing | LlamaParse |
| Database | Microsoft SQL Server 2022 |

### Frontend
| Component | Technology |
|---|---|
| Framework | React 19 + Vite |
| Styling | TailwindCSS |
| Authentication | Google OAuth 2.0 (SSO) |
| Streaming | Server-Sent Events (SSE) |

---

## 4. Running the Application Locally

The absolute easiest way to start both the frontend and backend simultaneously is to use the provided shortcut script.

### Using the One-Click Script (Recommended)
1. Go to your project root folder (`Lumina_Enterprise Agentic RAG`).
2. Double-click the **`run_locally.bat`** file.
3. It will automatically open two terminal windows (one for the backend and one for the frontend).
4. Once loaded, open your browser and go to **`http://localhost:3000`**.

### Using the Manual Method
If you prefer running them manually via separate terminals, do the following:

**Terminal 1 (Backend):**
```powershell
cd backend
.\venv\Scripts\activate
python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```
Then visit **`http://localhost:3000`** in your browser.

*(Default Admin Account: Username: `master_admin` | Password: `admin123`)*

---

## 5. Environment Setup

### `.env` File (backend directory)

```env
# Microsoft SQL Server
MSSQL_SERVER=localhost\SQLEXPRESS
MSSQL_DATABASE=Enterprise_Copilot
MSSQL_USER=
MSSQL_PASS=

# AI Settings
MAX_REWRITES=2
RAG_TOP_K=5

# LlamaParse
LLAMA_CLOUD_API_KEY=llx-<your_key_here>

# Model Options
OPENROUTER_API_KEY=sk-or-v1-<your_key_here>
OPENROUTER_MODEL=openrouter/free
USE_LOCAL_EMBEDDINGS=True
EMBED_MODEL=BAAI/bge-small-en-v1.5
```

---

## 6. Database Schema

### Tables

| Table | Purpose |
|---|---|
| `Accounts` | User accounts with roles and details |
| `AuditTrail` | Query + AI response logged |
| `KnowledgeDocuments` | Uploaded PDFs with validity date ranges |
| `DocumentLogs` | Admin actions (upload, delete, rename) |
| `QueryCache` | Exact-match query cache |
| `IntelligenceAudit` | Failed hallucination checks |

---

## 7. Admin Tools

Run these from the `backend/` folder:

| Script | Purpose | Command |
|---|---|---|
| `wipe_kb.py` | Clear semantic cache | `python wipe_kb.py` |
| `reset_kb.py` | Full ChromaDB reset | `python reset_kb.py` |
| `update_password.py` | Change user password | `python update_password.py` |

> ⚠️ Always clear the semantic cache (`wipe_kb.py`) after uploading or deleting policy documents.

---

## 8. API Reference

Local Development: `http://localhost:8001`  
Swagger UI: `http://localhost:8001/docs`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | System health check |
| `POST` | `/auth/google` | Google SSO authentication |
| `POST` | `/chat/stream` | SSE streaming chat |
| `POST` | `/upload` | Upload PDF to knowledge base |

---

## 9. AI Agent Pipeline

The system uses a **LangGraph StateGraph** with 4 nodes:

1. **Researcher**: Embeds the query and fetches relevant ChromaDB chunks.
2. **Communicator**: Drafts a cited answer based on the chunks.
3. **Reviewer**: Verifies the answer purely logically to eliminate hallucinations.
4. **Audit Node**: Logs the final interaction to the MSSQL database.

---

## 10. Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| AI gives wrong answers / says no docs | Cache/ChromaDB state out of sync | Run `python wipe_kb.py` or clear the entire DB |
| Backend connection refused/error | Missing DB Connection | Make sure SQL Server Express is running |
| Rate limits on questions | Google API Exceeded | Ensure OpenRouter is configured in `.env` |

---

*Lumina Agentic RAG — Personal Build*
