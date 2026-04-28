/**
 * LLM Service Integration
 * Communicates with local LLM service running on localhost:8000
 *
 * In production we would likely call our llm service from a serverless function, however since we are hosting the llm service locally 
 * for development, we can call it directly from the frontend.
 */

const LLM_API_URL = process.env.NEXT_PUBLIC_LLM_URL || "http://localhost:8000";

export interface ChatRequest {
  message: string;
  use_knowledge_base?: boolean;
  temperature?: number;
  top_p?: number;
}

export interface ChatResponse {
  response: string;
  knowledge_used: boolean;
  model: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
}

/**
 * Send a chat message to the LLM service
 */
export async function chat(request: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${LLM_API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: request.message,
      use_knowledge_base: request.use_knowledge_base ?? true,
      temperature: request.temperature ?? 0.7,
      top_p: request.top_p ?? 0.9,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to get LLM response");
  }

  return res.json();
}

/**
 * Get all knowledge items
 */
export async function getKnowledgeItems(
  category?: string
): Promise<KnowledgeItem[]> {
  const url = new URL(`${LLM_API_URL}/kb/items`);
  if (category) url.searchParams.set("category", category);

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error("Failed to fetch knowledge items");
  }

  const data = await res.json();
  return data.items;
}

/**
 * Add or update a knowledge item
 */
export async function addKnowledgeItem(
  item: KnowledgeItem
): Promise<{ status: string; id: string }> {
  const res = await fetch(`${LLM_API_URL}/kb/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Failed to add knowledge item");
  }

  return res.json();
}

/**
 * Get specific knowledge item
 */
export async function getKnowledgeItem(id: string): Promise<KnowledgeItem> {
  const res = await fetch(`${LLM_API_URL}/kb/items/${id}`);

  if (!res.ok) {
    throw new Error("Knowledge item not found");
  }

  return res.json();
}

/**
 * Delete knowledge item
 */
export async function deleteKnowledgeItem(id: string): Promise<void> {
  const res = await fetch(`${LLM_API_URL}/kb/items/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error("Failed to delete knowledge item");
  }
}

/**
 * Search knowledge base
 */
export async function searchKnowledge(
  query: string,
  category?: string
): Promise<KnowledgeItem[]> {
  const url = new URL(`${LLM_API_URL}/kb/search`);
  url.searchParams.set("query", query);
  if (category) url.searchParams.set("category", category);

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error("Failed to search knowledge base");
  }

  const data = await res.json();
  return data.results;
}

/**
 * Check LLM service health
 */
export async function checkLLMHealth(): Promise<{
  status: string;
  ollama: string;
  model: string;
  knowledge_items: number;
}> {
  const res = await fetch(`${LLM_API_URL}/health`);

  if (!res.ok) {
    throw new Error("LLM service unhealthy");
  }

  return res.json();
}
