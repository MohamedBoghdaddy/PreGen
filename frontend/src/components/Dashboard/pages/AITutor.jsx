import React, { useState } from "react";
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

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMsg = { sender: "user", text: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:4000/api/ai/tutor", {
        prompt: input,
      });
      const botReply = response.data.reply;
      setMessages((prev) => [...prev, { sender: "bot", text: botReply }]);
    } catch (err) {
      console.error(err);
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
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default AITutor;

