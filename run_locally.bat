@echo off
echo Starting Lumina Enterprise Agentic RAG Local Environment...

:: Start the Python Backend
echo Starting Backend Server on http://127.0.0.1:8001...
start "Lumina RAG Backend" cmd /k "cd backend && .\venv\Scripts\activate && python -m uvicorn main:app --host 127.0.0.1 --port 8001"

:: Start the Frontend
echo Starting Frontend Dev Server on http://localhost:3000...
start "Lumina RAG Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo All services started! 
echo Frontend: http://localhost:3000
echo Backend API: http://127.0.0.1:8001
echo.
pause
