"use client";

import { useEffect, useState, useRef } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef();

  // 페이지 로드 시 초기 안내 메시지
  useEffect(() => {
    setMessages([
      {
        sender: "bot",
        text: "안녕하세요~ 🏫 학교 관련해서 물어보세요!"
      }
    ]);
  }, []);

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

      const data = await res.json();
      console.log("✅ API 응답:", data);

      setMessages(prev => [...prev, { sender: "bot", text: data.bot }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: "bot", text: "오류 발생" }]);
      console.error("❌ 전송 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="container">
      <div className="chat-header">
        <h2>SchoolBot 🌴</h2>
      </div>
      <div className="chat-feed">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="message bot">💬 부스럭 부스럭...</div>}
        <div ref={chatEndRef}></div>
      </div>
      <div className="chat-input">
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
        .container {
          max-width: 500px;
          margin: 40px auto;
          display: flex;
          flex-direction: column;
          height: 80vh;
          border: 1px solid #ddd;
          border-radius: 15px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          font-family: 'Helvetica Neue', sans-serif;
        }
        .chat-header {
          padding: 15px;
          background: linear-gradient(90deg, #ff758c, #ff7eb3);
          color: #fff;
          font-weight: bold;
          text-align: center;
          font-size: 18px;
        }
        .chat-feed {
          flex: 1;
          padding: 10px;
          overflow-y: auto;
          background: #f2f2f2;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .message {
          max-width: 70%;
          padding: 10px 15px;
          border-radius: 20px;
          word-break: break-word;
          font-size: 14px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .user {
          align-self: flex-end;
          background: #ffdab9;
          color: #d2691e;
        }
        .bot {
          align-self: flex-start;
          background: #b2f7ef;
          color: #008080;
        }
        .chat-input {
          display: flex;
          border-top: 1px solid #ddd;
        }
        input {
          flex: 1;
          padding: 10px 15px;
          border: none;
          outline: none;
          font-size: 14px;
        }
        button {
          padding: 0 20px;
          background: #ff758c;
          color: #fff;
          border: none;
          cursor: pointer;
          font-weight: bold;
        }
        button:hover {
          background: #ff7eb3;
        }
      `}</style>
    </div>
  );
}
