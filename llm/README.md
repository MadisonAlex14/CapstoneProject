# Local LLM Service Setup Guide

## Overview

This guide walks you through setting up a local LLM service that:
- Runs the `mistral:7b` model via Ollama
- Manages a custom knowledge base (JSON-backed)
- Provides a REST API for your frontend to query
- Augments responses with contextual knowledge

## Prerequisites

1. **Ollama installed and running** with `mistral:7b` model
   - Download from https://ollama.ai
   - Run: `ollama pull mistral:7b`
   - Start: `ollama serve` (default port 11434)

2. **Python 3.9+**

3. **Your CapstoneProject workspace**

## Step 1: Install Python Dependencies

```bash
cd llm
pip install -r requirements.txt
```

## Step 2: Start ollama 

Cd to wherever you downloaded ollama:

```bash
ollama serve
```

## Step 3: Start the LLM Service
- For Windows:
```bash
.\start-llm.bat
```

- For Mac
```bash
./start-llm.sh
```
You should see the model being seeded with information from the seed_knowledge_base. In a seperate terminal you should see post requests being recieved from the model.