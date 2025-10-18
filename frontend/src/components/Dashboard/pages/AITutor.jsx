import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../styles/AITutor.css";

const AITutor = () => {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "👋 Hello! I’m your AI Tutor. What would you like to learn today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  // Start a new tutor session when the component mounts
  useEffect(() => {
    const startSession = async () => {
      try {
        const newSessionId = `session_${Date.now()}`; // simple unique ID
        setSessionId(newSessionId);
        await axios.post(
          `http://localhost:8000/api/tutor/session/${newSessionId}`,
          {
            context: { subject: "general", level: "student" },
          }
        );
      } catch (error) {
        console.error("❌ Failed to start AI Tutor session:", error);
      }
    };

    startSession();
  }, []);

  // Handle message sending
  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      // Call Gemini Tutor Chat API
      const response = await axios.post(
        "http://localhost:8000/api/tutor/chat",
        {
          session_id: sessionId,
          message: input,
          subject: "mathematics", // You can make this dynamic later
          tone: "supportive",
          language: "English",
        }
      );

      // The backend Gemini service should return { reply: "...", ... }
      const botReply =
        response.data.reply || "🤖 Sorry, I didn’t quite catch that.";
      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (err) {
      console.error("Chat API error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "⚠️ I had trouble processing that. Try again!" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-tutor-container">
      <h1>AI Tutor 💬</h1>
      <div className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-message ${msg.sender}`}>
            <p>{msg.text}</p>
          </div>
        ))}
        {loading && <p className="typing">AI Tutor is thinking...</p>}
      </div>

      <div className="chat-input">
        <input
          type="text"
          placeholder="Ask a question or type 'Explain integration step by step'"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} disabled={loading}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default AITutor;
