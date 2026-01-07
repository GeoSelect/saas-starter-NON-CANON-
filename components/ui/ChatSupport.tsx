
"use client";
import React, { useState } from "react";

export function ChatSupport() {
  const [messages, setMessages] = useState([
    { from: "support", text: "Hi! How can we help you today?" }
  ]);
  const [input, setInput] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((msgs) => [...msgs, { from: "user", text: input }]);
    setInput("");
    // Simulate support reply
    setTimeout(() => {
      setMessages((msgs) => [
        ...msgs,
        { from: "support", text: "Thanks for your question! A support agent will reply soon." }
      ]);
    }, 1200);
  };

  return (
    <div style={{ border: "1px solid #ccc", borderRadius: 8, padding: 16, background: "#fafbfc" }}>
      <div style={{ minHeight: 80, maxHeight: 200, overflowY: "auto", marginBottom: 12 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            textAlign: msg.from === "user" ? "right" : "left",
            margin: "6px 0"
          }}>
            <span style={{
              display: "inline-block",
              background: msg.from === "user" ? "#dbeafe" : "#e5e7eb",
              color: "#222",
              borderRadius: 16,
              padding: "6px 14px",
              maxWidth: 320
            }}>{msg.text}</span>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a support question..."
          style={{ flex: 1, padding: 8, borderRadius: 6, border: "1px solid #bbb" }}
        />
        <button type="submit" style={{ padding: "8px 18px", borderRadius: 6, background: "#2563eb", color: "#fff", border: 0 }}>
          Send
        </button>
      </form>
    </div>
  );
}
