@echo off
REM Quick start script for LLM service (Windows)
REM Usage: start-llm.bat
REM Automatically loads knowledge base from knowledge_base.json

echo Starting LLM Service...
echo =====================
echo.
echo Prerequisites:
echo - Ollama running on localhost:11434
echo - Python 3.9+ installed
echo - seed_knowledge_base.py will populate the knowledge base
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo X Python is not installed
    exit /b 1
)

for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
echo ^+ %PYTHON_VERSION%
echo.

REM Navigate to llm directory
cd /d "%~dp0"

REM Check if knowledge base script exists
if exist seed_knowledge_base.py (
    echo ^+ Knowledge base seeder found (seed_knowledge_base.py)
) else (
    echo ! No seed_knowledge_base.py found - cannot populate knowledge base
)
echo.

REM Create virtual environment if it doesn't exist
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Installing dependencies...
pip install -q -r requirements.txt

echo.
echo ^+ Setup complete
echo.
echo Starting LLM service on http://localhost:8000
echo.
echo Starting main service...
start python main.py
timeout /t 3 /nobreak

echo.
echo Seeding knowledge base...
python seed_knowledge_base.py
echo.
echo LLM service is running at http://localhost:8000
echo Knowledge base populated with user-focused help content
echo Press Ctrl+C in the main window to stop the service
echo.

