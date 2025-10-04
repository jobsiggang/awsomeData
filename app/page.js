"use client";

import { useEffect, useState, useRef } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utterance: userMsg }),
      });

      const text = await res.text();
      setMessages(prev => [...prev, { sender: "bot", text }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: "bot", text: "오류 발생" }]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="chat-container">
      <h1 className="title">🕹️ Retro Data GPT</h1>
      <div className="chat-box">
        안녕~ 아직은 학교 정보만 알 수 있어.<br/> 공공데이터 복구되면 다른 데이터도 추가할게!<br/>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.sender === "user" ? "user" : "bot"}`}
          >
            {msg.text}
          </div>
        ))}
        {loading && <div className="message bot">💬 ...부스럭부스럭...</div>}
        <div ref={chatEndRef}></div>
      </div>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="타자를 쳐보세요..."
        />
        <button onClick={sendMessage}>▶️ SEND</button>
      </div>

      <style jsx>{`
        .chat-container {
          max-width: 600px;
          margin: 20px auto;
          padding: 20px;
          font-family: 'Press Start 2P', monospace;
          background: #0a0a0a;
          color: #00ffcc;
          border: 4px solid #00ffcc;
          border-radius: 10px;
        }
        .title {
          text-align: center;
          margin-bottom: 15px;
          font-weight: bold;
          color: #ff00ff;
          text-shadow: 2px 2px #000;
        }
        .chat-box {
          border: 2px solid #00ffcc;
          padding: 15px;
          min-height: 400px;
          max-height: 70vh;
          overflow-y: auto;
          background: #111;
          box-shadow: inset 0 0 10px #00ffcc;
        }
        .message {
          padding: 8px 12px;
          margin: 6px 0;
          border-radius: 4px;
          max-width: 80%;
          word-break: break-word;
          line-height: 1.4;
          font-size: 12px;
        }
        .user {
          background: #ff00ff;
          color: #000;
          margin-left: auto;
          text-align: right;
          border: 2px solid #ff00ff;
        }
        .bot {
          background: #00ffcc;
          color: #000;
          margin-right: auto;
          border: 2px solid #00ffcc;
        }
        .input-container {
          display: flex;
          margin-top: 10px;
          gap: 10px;
        }
        input {
          flex: 1;
          padding: 10px;
          border: 2px solid #00ffcc;
          background: #111;
          color: #00ffcc;
          outline: none;
          font-family: 'Press Start 2P', monospace;
          font-size: 12px;
        }
        input::placeholder {
          color: #00ffcc;
          opacity: 0.7;
        }
        button {
          padding: 10px 20px;
          border: 2px solid #ff00ff;
          background: #111;
          color: #ff00ff;
          font-family: 'Press Start 2P', monospace;
          cursor: pointer;
          transition: 0.2s;
        }
        button:hover {
          background: #ff00ff;
          color: #111;
        }
      `}</style>
      <link
        href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap"
        rel="stylesheet"
      />
    </div>
  );
}
