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
      <h1 className="title">🌴 Real Time GPT 🌺</h1>
      <div className="chat-box">
        안녕하세요~ 🏝️ 학교 정보만 알려드릴 수 있어요.<br/>
        공공데이터가 복구되면 다른 정보도 곧 보여드릴게요! 🌊<br/>
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.sender === "user" ? "user" : "bot"}`}
          >
            {msg.text}
          </div>
        ))}
        {loading && <div className="message bot">💬 ...잠깐만요, 부스럭 부스럭...</div>}
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
        <button onClick={sendMessage}>🏖️ 보내기</button>
      </div>

      <style jsx>{`
        .chat-container {
          max-width: 600px;
          margin: 20px auto;
          padding: 25px;
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(145deg, #a2f6f9, #ffe3b3);
          border-radius: 25px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.15);
        }
        .title {
          text-align: center;
          margin-bottom: 15px;
          font-size: 26px;
          color: #ff6f61;
          text-shadow: 1px 1px #fff;
        }
        .chat-box {
          border: 2px solid #ffb347;
          padding: 15px;
          min-height: 400px;
          max-height: 70vh;
          overflow-y: auto;
          background: linear-gradient(to bottom, #d4fc79, #96e6a1);
          border-radius: 20px;
          box-shadow: inset 0 6px 12px rgba(0,0,0,0.05);
        }
        .message {
          padding: 10px 15px;
          margin: 8px 0;
          border-radius: 20px;
          max-width: 80%;
          word-break: break-word;
          line-height: 1.4;
          font-size: 14px;
        }
        .user {
          background: #ffdab9;
          color: #d2691e;
          margin-left: auto;
          text-align: right;
          border: 1px solid #ffa500;
        }
        .bot {
          background: #b2f7ef;
          color: #008080;
          margin-right: auto;
          border: 1px solid #20b2aa;
        }
        .input-container {
          display: flex;
          margin-top: 10px;
          gap: 10px;
        }
        input {
          flex: 1;
          padding: 10px 15px;
          border: 2px solid #20b2aa;
          background: #e0fff7;
          color: #008080;
          outline: none;
          font-family: 'Poppins', sans-serif;
          font-size: 14px;
          border-radius: 20px;
        }
        input::placeholder {
          color: #20b2aa;
          opacity: 0.7;
        }
        button {
          padding: 10px 20px;
          border: 2px solid #ff6f61;
          background: #ffe3b3;
          color: #ff6f61;
          font-family: 'Poppins', sans-serif;
          cursor: pointer;
          border-radius: 20px;
          transition: 0.2s;
        }
        button:hover {
          background: #ff6f61;
          color: #fff;
        }
      `}</style>
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap"
        rel="stylesheet"
      />
    </div>
  );
}
