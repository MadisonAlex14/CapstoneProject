/**
 * Creditmaxxing AI Assistant
 * Uses self-hosted smollm:360m LLM with project charter knowledge base
 * Communicates with local LLM service on localhost:8000
 */

"use client";

import { useState, useEffect } from "react";
import { chat, checkLLMHealth } from "@/lib/functions/llmService";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  knowledge_used?: boolean;
  timestamp: Date;
}

interface HealthStatus {
  status: string;
  ollama: string;
  model: string;
  knowledge_items: number;
}

export function CreditCardAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [serviceAvailable, setServiceAvailable] = useState(false);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  // Check if LLM service is available on component mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthData = await checkLLMHealth();
        setHealth(healthData);
        setServiceAvailable(true);
      } catch (error) {
        console.error("LLM service unavailable:", error);
        setServiceAvailable(false);
      }
    };

    checkHealth();
    // Optionally re-check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await chat({
        message: input,
        use_knowledge_base: true,
        temperature: 0.7,
      });

      const assistantMessage: Message = {
        role: "assistant",
        content: response.response,
        knowledge_used: response.knowledge_used,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get response"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!serviceAvailable) {
    return (
      <div
        style={{
          padding: "2rem",
          backgroundColor: "#fff3cd",
          border: "1px solid #ffc107",
          borderRadius: "8px",
          margin: "2rem auto",
          maxWidth: "600px",
        }}
      >
        <h3 style={{ marginTop: 0, color: "#856404" }}>LLM Service Unavailable</h3>
        <p style={{ color: "#856404", marginBottom: "0.5rem" }}>
          The self-hosted LLM service is not running. Make sure:
        </p>
        <ul style={{ color: "#856404", paddingLeft: "1.5rem" }}>
          <li>Ollama is running and accessible at http://localhost:11434</li>
          <li>The LLM service has started</li>
        </ul>
        <p style={{ color: "#856404", marginBottom: 0 }}>
          <strong>Start the service:</strong>
          <br />
          <code style={{ backgroundColor: "#fff8e1", padding: "0.25rem 0.5rem", borderRadius: "3px" }}>
            cd llm && python main.py
          </code>
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "2rem auto", fontFamily: "sans-serif" }}>
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "1rem",
          borderRadius: "8px",
          marginBottom: "1rem",
          border: "1px solid #e9ecef",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: "0.5rem" }}>💡 Creditmaxxing AI Assistant</h2>
        {health && (
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
            Model: <strong>{health.model}</strong>
          </p>
        )}
      </div>

      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: "8px",
          height: "450px",
          overflowY: "auto",
          padding: "1rem",
          marginBottom: "1rem",
          backgroundColor: "#fafafa",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", color: "#999" }}>
              <p style={{ fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                🤖 Ask me anything about Creditmaxxing!
              </p>
              <p style={{ fontSize: "0.9rem", marginBottom: "1rem" }}>
                Try asking:
              </p>
              <ul style={{ fontSize: "0.9rem", textAlign: "left", display: "inline-block", color: "#666" }}>
                <li>"What pages are in the app?"</li>
                <li>"How do rewards work?"</li>
                <li>"Walk me through adding a card"</li>
                <li>"What's the benefit tracking process?"</li>
              </ul>
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  marginBottom: "1rem",
                  padding: "0.75rem",
                  backgroundColor: msg.role === "user" ? "#d1ecf1" : "#e7e7ff",
                  borderLeft: `4px solid ${msg.role === "user" ? "#0c5460" : "#5a5aff"}`,
                  borderRadius: "4px",
                  textAlign: msg.role === "user" ? "right" : "left",
                }}
              >
                <strong style={{ color: msg.role === "user" ? "#0c5460" : "#4a4a9f" }}>
                  {msg.role === "user" ? "You" : "Assistant"}:
                </strong>
                <div style={{ margin: "0.5rem 0 0 0" }}>
                  {msg.role === "assistant" ? (
                    <ReactMarkdown
                      components={{
                        h1: ({ node, ...props }) => <h1 style={{ margin: "1rem 0 0.5rem 0", fontSize: "1.2rem" }} {...props} />,
                        h2: ({ node, ...props }) => <h2 style={{ margin: "1rem 0 0.5rem 0", fontSize: "1.1rem" }} {...props} />,
                        h3: ({ node, ...props }) => <h3 style={{ margin: "0.75rem 0 0.5rem 0", fontSize: "1rem" }} {...props} />,
                        p: ({ node, ...props }) => <p style={{ margin: "0.5rem 0", lineHeight: "1.6" }} {...props} />,
                        ul: ({ node, ...props }) => <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }} {...props} />,
                        ol: ({ node, ...props }) => <ol style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }} {...props} />,
                        li: ({ node, ...props }) => <li style={{ marginBottom: "0.25rem" }} {...props} />,
                        code: ({ inline, ...props }: any) =>
                          inline ? (
                            <code style={{ backgroundColor: "#f0f0f0", padding: "0.2rem 0.4rem", borderRadius: "3px", fontFamily: "monospace" }} {...props} />
                          ) : (
                            <code style={{ backgroundColor: "#f0f0f0", padding: "0.5rem", borderRadius: "3px", fontFamily: "monospace", display: "block", overflow: "auto" }} {...props} />
                          ),
                        a: ({ node, ...props }) => <a style={{ color: "#0066cc", textDecoration: "underline" }} target="_blank" rel="noopener noreferrer" {...props} />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <p style={{ margin: 0 }}>{msg.content}</p>
                  )}
                </div>
                {msg.knowledge_used && (
                  <small style={{ color: "#666", display: "block", marginTop: "0.25rem" }}>
                    📚 (using project charter knowledge base)
                  </small>
                )}
                <small style={{ color: "#999", display: "block", marginTop: "0.25rem" }}>
                  {msg.timestamp.toLocaleTimeString()}
                </small>
              </div>
            ))}
          </>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && !loading && handleSend()}
          placeholder="Ask about pages, rewards, benefits, transactions, etc..."
          disabled={loading}
          style={{
            flex: 1,
            padding: "0.75rem",
            border: "1px solid #ddd",
            borderRadius: "4px",
            fontSize: "1rem",
            fontFamily: "inherit",
            backgroundColor: loading ? "#f5f5f5" : "white",
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: "0.75rem 1.5rem",
            backgroundColor: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.6 : 1,
            fontWeight: "bold",
            transition: "all 0.2s",
          }}
        >
          {loading ? "⏳ Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}
