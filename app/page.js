"use client";

import { useEffect, useState, useRef } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef();

  // 메시지 자동 스크롤
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
      <h1 className="title">🧠 실시간 데이터 안내 GPT </h1>
      <div className="chat-box">
        안녕~ 아직은 학교 정보만 알 수 있어.<br/> 공공데이터 포탈이 복구되면 다른 데이터도 곧 추가할게!<br/>
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
          placeholder="메시지를 입력하세요..."
        />
        <button onClick={sendMessage}>전송</button>
      </div>

      <style jsx>{`
        .chat-container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Inter', sans-serif;
        }
        .title {
          text-align: center;
          margin-bottom: 15px;
          font-weight: 600;
        }
        .chat-box {
          border: 1px solid #ccc;
          border-radius: 10px;
          padding: 15px;
          min-height: 400px;
          max-height: 70vh;
          overflow-y: auto;
          background: #f7f7f8;
        }
        .message {
          padding: 10px 15px;
          margin: 8px 0;
          border-radius: 20px;
          max-width: 80%;
          word-break: break-word;
          line-height: 1.4;
        }
        .user {
          background: #10a37f;
          color: #fff;
          margin-left: auto;
          text-align: right;
        }
        .bot {
          background: #e5e5ea;
          color: #000;
          margin-right: auto;
        }
        .input-container {
          display: flex;
          margin-top: 10px;
        }
        input {
          flex: 1;
          padding: 10px 15px;
          border-radius: 20px;
          border: 1px solid #ccc;
          outline: none;
          font-size: 14px;
        }
        button {
          margin-left: 10px;
          padding: 10px 20px;
          border-radius: 20px;
          border: none;
          background-color: #10a37f;
          color: white;
          cursor: pointer;
          font-weight: 500;
        }
        button:hover {
          background-color: #0e8e6b;
        }
      `}</style>
    </div>
  );
}
