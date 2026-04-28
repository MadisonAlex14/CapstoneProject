"""
Local LLM Service with Knowledge Base
Wraps Ollama model with a custom knowledge base
"""

import os
import json
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn

# Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
MODEL_NAME = "gemma2:2b"
KNOWLEDGE_BASE_FILE = "knowledge_base.json"
PORT = int(os.getenv("LLM_PORT", 8000))

# FastAPI app
app = FastAPI(title="Local LLM Service")

# Enable CORS for requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Models ====================

class KnowledgeItem(BaseModel):
    """Individual knowledge base entry"""
    id: str
    title: str
    content: str
    category: Optional[str] = None
    tags: Optional[List[str]] = None


class KnowledgeBase:
    """Manages knowledge base storage and retrieval"""
    
    def __init__(self, file_path: str = KNOWLEDGE_BASE_FILE):
        self.file_path = file_path
        self.items: dict[str, KnowledgeItem] = {}
        self.load()
    
    def load(self):
        """Load knowledge base from file"""
        if os.path.exists(self.file_path):
            try:
                with open(self.file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.items = {
                        item_id: KnowledgeItem(**item)
                        for item_id, item in data.items()
                    }
                print(f"Loaded {len(self.items)} knowledge items")
            except Exception as e:
                print(f"Error loading knowledge base: {e}")
                self.items = {}
        else:
            self.items = {}
    
    def save(self):
        """Save knowledge base to file"""
        try:
            with open(self.file_path, "w", encoding="utf-8") as f:
                data = {
                    item_id: item.model_dump()
                    for item_id, item in self.items.items()
                }
                json.dump(data, f, indent=2, ensure_ascii=False)
            print(f"Saved {len(self.items)} knowledge items")
        except Exception as e:
            print(f"Error saving knowledge base: {e}")
    
    def add(self, item: KnowledgeItem):
        """Add or update knowledge item"""
        self.items[item.id] = item
        self.save()
    
    def remove(self, item_id: str):
        """Remove knowledge item"""
        if item_id in self.items:
            del self.items[item_id]
            self.save()
            return True
        return False
    
    def get(self, item_id: str) -> Optional[KnowledgeItem]:
        """Get specific knowledge item"""
        return self.items.get(item_id)
    
    def search(self, query: str, category: Optional[str] = None) -> List[KnowledgeItem]:
        """Search knowledge base with improved matching"""
        query_lower = query.lower()
        query_words = set(query_lower.split())
        results = []
        
        for item in self.items.values():
            if category and item.category != category:
                continue
            
            # Score based on title match (highest), tags match, and content match
            score = 0
            title_lower = item.title.lower()
            content_lower = item.content.lower()
            
            # Title matches are worth most
            if query_lower in title_lower:
                score += 100
            for word in query_words:
                if word in title_lower:
                    score += 30
            
            # Tag matches
            if item.tags:
                for tag in item.tags:
                    if query_lower in tag.lower() or tag.lower() in query_lower:
                        score += 20
            
            # Content matches
            if query_lower in content_lower:
                score += 10
            for word in query_words:
                if word in content_lower:
                    score += 5
            
            if score > 0:
                results.append((score, item))
        
        # Sort by score descending
        results.sort(key=lambda x: x[0], reverse=True)
        return [item for score, item in results]
    
    def get_all(self) -> List[KnowledgeItem]:
        """Get all knowledge items"""
        return list(self.items.values())
    
    def get_context(self, query: str, max_items: int = 3) -> str:
        """Get relevant context for a query"""
        results = self.search(query)
        if not results:
            return ""
        
        context_parts = []
        for item in results[:max_items]:
            context_parts.append(f"[{item.title}]\n{item.content}")
        
        return "\n\n".join(context_parts)


# Initialize knowledge base
kb = KnowledgeBase()


# ==================== Request/Response Models ====================

class ChatRequest(BaseModel):
    """Chat request to LLM"""
    message: str
    use_knowledge_base: bool = True
    temperature: float = 0.7
    top_p: float = 0.9


class ChatResponse(BaseModel):
    """Response from LLM"""
    response: str
    knowledge_used: bool
    model: str


class KnowledgeItemRequest(BaseModel):
    """Request to add/update knowledge item"""
    id: str
    title: str
    content: str
    category: Optional[str] = None
    tags: Optional[List[str]] = None


# ==================== Knowledge Base Routes ====================

@app.get("/kb/items")
async def list_knowledge_items(category: Optional[str] = None):
    """List all knowledge items, optionally filtered by category"""
    items = kb.get_all()
    if category:
        items = [item for item in items if item.category == category]
    return {"items": items, "count": len(items)}


@app.post("/kb/items")
async def add_knowledge_item(item: KnowledgeItemRequest):
    """Add or update knowledge item"""
    kb_item = KnowledgeItem(**item.model_dump())
    kb.add(kb_item)
    return {"status": "success", "id": item.id}


@app.get("/kb/items/{item_id}")
async def get_knowledge_item(item_id: str):
    """Get specific knowledge item"""
    item = kb.get(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    return item


@app.delete("/kb/items/{item_id}")
async def delete_knowledge_item(item_id: str):
    """Delete knowledge item"""
    if kb.remove(item_id):
        return {"status": "success"}
    raise HTTPException(status_code=404, detail="Knowledge item not found")


@app.get("/kb/search")
async def search_knowledge(query: str, category: Optional[str] = None):
    """Search knowledge base"""
    results = kb.search(query, category)
    return {"results": results, "count": len(results)}


# ==================== Chat Routes ====================

def query_ollama(prompt: str, temperature: float = 0.7, top_p: float = 0.9) -> str:
    """Query Ollama model"""
    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/api/generate",
            json={
                "model": MODEL_NAME,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": temperature,
                    "top_p": top_p,
                    "num_predict": 256,
                }
            },
            timeout=60
        )
        
        if response.status_code != 200:
            raise Exception(f"Ollama API error: {response.status_code}")
        
        data = response.json()
        return data.get("response", "").strip()
    
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail=f"Cannot connect to Ollama at {OLLAMA_BASE_URL}. Make sure Ollama is running."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM error: {str(e)}")


@app.post("/chat")
async def chat(request: ChatRequest) -> ChatResponse:
    """Chat with LLM, optionally using knowledge base"""
    
    knowledge_used = False
    context = ""
    system_prompt = ""
    
    # Get system prompt from knowledge base
    system_item = kb.get("system_prompt")
    if system_item:
        system_prompt = system_item.content + "\n\n"
    
    # Augment prompt with knowledge base context if enabled
    if request.use_knowledge_base:
        context = kb.get_context(request.message, max_items=5)
        knowledge_used = bool(context)
    
    # Build prompt with clear instructions
    if context:
        prompt = f"""{system_prompt}KNOWLEDGE BASE CONTEXT:
{context}

USER QUESTION: {request.message}

RESPONSE:"""
    else:
        prompt = f"""{system_prompt}USER QUESTION: {request.message}

RESPONSE:"""
    
    # Query Ollama
    response = query_ollama(prompt, request.temperature, request.top_p)
    
    return ChatResponse(
        response=response,
        knowledge_used=knowledge_used,
        model=MODEL_NAME
    )


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        ollama_available = response.status_code == 200
    except:
        ollama_available = False
    
    return {
        "status": "healthy",
        "ollama": "connected" if ollama_available else "disconnected",
        "model": MODEL_NAME,
        "knowledge_items": len(kb.items)
    }


# ==================== Initialization ====================

def initialize_default_knowledge():
    """Add default knowledge items if knowledge base is empty"""
    if len(kb.items) == 0:
        default_items = [
            KnowledgeItem(
                id="credit_cards_101",
                title="Credit Cards 101",
                category="credit_cards",
                content="""Credit cards are financial tools that allow you to borrow money from a card issuer to pay for purchases. You receive a monthly bill (statement) and can choose to pay it in full or in installments. Interest is charged on unpaid balances.""",
                tags=["basics", "credit"]
            ),
            KnowledgeItem(
                id="rewards_explained",
                title="Understanding Credit Card Rewards",
                category="rewards",
                content="""Credit card rewards are benefits offered by card issuers for using their card. Common types include:
- Cash back: Direct percentage rebate on purchases
- Points: Accumulated credits redeemable for rewards
- Miles: Points specifically for travel rewards
Rewards rates vary by spending category.""",
                tags=["rewards", "benefits"]
            ),
            KnowledgeItem(
                id="credit_score",
                title="Credit Score Impact",
                category="credit_cards",
                content="""Your credit card activity affects your credit score. Factors include:
- Payment history (35%): Pay on time to build score
- Credit utilization (30%): Use less than 30% of your limit
- Credit history length (15%): Keep old accounts open
- Credit mix (10%): Mix of credit types helps
- New inquiries (10%): Minimize hard inquiries""",
                tags=["credit", "score"]
            ),
        ]
        
        for item in default_items:
            kb.add(item)
        
        print("Initialized default knowledge base")


if __name__ == "__main__":
    # Initialize default knowledge
    initialize_default_knowledge()
    
    print(f"Starting LLM service on http://localhost:{PORT}")
    print(f"Ollama endpoint: {OLLAMA_BASE_URL}")
    print(f"Model: {MODEL_NAME}")
    
    uvicorn.run(app, host="0.0.0.0", port=PORT)
