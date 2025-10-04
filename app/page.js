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
      <h1 className="title">🌸 실시간 데이터 GPT 🌸</h1>
      <div className="chat-box">
        안녕~ 아직은 학교 정보만 알려줄 수 있어요.<br/>
        공공데이터가 복구되면 다른 정보도 곧 보여줄게요!<br/>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.sender === "user" ? "user" : "bot"}`}
          >
            {msg.text}
          </div>
        ))}
        {loading && <div className="message bot">💬 ...생각 중...</div>}
        <div ref={chatEndRef}></div>
      </div>
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="메시지를 입력해보세요..."
        />
        <button onClick={sendMessage}>💖 전송</button>
      </div>

      <style jsx>{`
        .chat-container {
          max-width: 600px;
          margin: 20px auto;
          padding: 25px;
          font-family: 'Comic Neue', cursive;
          background: #ffe6f0;
          border: 4px solid #ffb6c1;
          border-radius: 25px;
          box-shadow: 0 8px 15px rgba(0,0,0,0.1);
        }
        .title {
          text-align: center;
          margin-bottom: 15px;
          font-size: 24px;
          color: #ff69b4;
          text-shadow: 1px 1px #fff;
        }
        .chat-box {
          border: 2px solid #ffb6c1;
          padding: 15px;
          min-height: 400px;
          max-height: 70vh;
          overflow-y: auto;
          background: #fff0f5;
          border-radius: 15px;
          box-shadow: inset 0 4px 8px rgba(0,0,0,0.05);
        }
        .message {
          padding: 10px 15px;
          margin: 8px 0;
          border-radius: 15px;
          max-width: 80%;
          word-break: break-word;
          line-height: 1.4;
          font-size: 14px;
        }
        .user {
          background: #ffccf2;
          color: #c71585;
          margin-left: auto;
          text-align: right;
          border: 1px solid #ff99cc;
        }
        .bot {
          background: #ffe6f0;
          color: #ff1493;
          margin-right: auto;
          border: 1px solid #ff99cc;
        }
        .input-container {
          display: flex;
          margin-top: 10px;
          gap: 10px;
        }
        input {
          flex: 1;
          padding: 10px 15px;
          border: 2px solid #ffb6c1;
          background: #fff0f5;
          color: #c71585;
          outline: none;
          font-family: 'Comic Neue', cursive;
          font-size: 14px;
          border-radius: 15px;
        }
        input::placeholder {
          color: #ff69b4;
          opacity: 0.7;
        }
        button {
          padding: 10px 20px;
          border: 2px solid #ff69b4;
          background: #fff0f5;
          color: #ff69b4;
          font-family: 'Comic Neue', cursive;
          cursor: pointer;
          border-radius: 15px;
          transition: 0.2s;
        }
        button:hover {
          background: #ff69b4;
          color: #fff0f5;
        }
      `}</style>
      <link
        href="https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap"
        rel="stylesheet"
      />
    </div>
  );
}
