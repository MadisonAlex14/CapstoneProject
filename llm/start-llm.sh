#!/bin/bash
# Quick start script for LLM service
# Usage: ./start-llm.sh

echo "Starting LLM Service..."
echo "====================="
echo ""
echo "Prerequisites:"
echo "- Ollama running on localhost:11434"
echo "- Python 3.9+ installed"
echo "- seed_knowledge_base.py will populate the knowledge base"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

echo "✓ Python found: $(python3 --version)"
echo ""

# Navigate to llm directory
cd "$(dirname "$0")" || exit

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

echo "Activating virtual environment..."
source venv/bin/activate

echo "Installing dependencies..."
pip install -q -r requirements.txt

# Check if seed_knowledge_base.py exists
if [ ! -f "seed_knowledge_base.py" ]; then
    echo "❌ seed_knowledge_base.py not found in $(pwd)"
    exit 1
fi

echo ""
echo "✓ Setup complete"
echo ""
echo "Starting LLM service..."
echo ""

python main.py &
MAIN_PID=$!

sleep 3

echo "Seeding knowledge base..."
python seed_knowledge_base.py

wait $MAIN_PID
