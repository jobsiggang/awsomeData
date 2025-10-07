"use client";
import { useState } from "react";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ utterance: input }),
    });

    const data = await res.json();
    const botMsg = { sender: "bot", text: data.bot };
    setMessages((m) => [...m, botMsg]);
  };

  // ⌨️ 엔터로 전송 가능
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 text-gray-900">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 drop-shadow-md">
        🤖 공공데이터 메탈 챗봇
      </h1>

      <div className="w-[420px] bg-white/60 backdrop-blur-lg rounded-2xl p-5 shadow-2xl border border-gray-300">
        {/* 채팅창 */}
        <div className="h-80 overflow-y-auto space-y-3 mb-4 p-2 rounded-xl bg-gray-50/70 border border-gray-200">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`p-2 rounded-xl max-w-[80%] whitespace-pre-line shadow-sm ${
                msg.sender === "user"
                  ? "ml-auto bg-blue-500 text-white"
                  : "mr-auto bg-gray-200 text-gray-800"
              }`}
            >
              {msg.text}
            </div>
          ))}
        </div>

        {/* 입력창 */}
        <div className="flex space-x-2">
          <textarea
            rows={1}
            className="flex-1 p-2 rounded-xl bg-gray-100 text-gray-800 border border-gray-300 outline-none resize-none focus:ring-2 focus:ring-blue-400 transition"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="예: 서울 날씨 알려줘"
          />
          <button
            onClick={sendMessage}
            className="px-4 py-2 rounded-xl font-semibold bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800 border border-gray-300 shadow-md hover:from-gray-100 hover:to-gray-300 active:scale-95 transition"
          >
            전송
          </button>
        </div>
      </div>

      <footer className="mt-4 text-xs text-gray-500">
        © 2025 AI & Public Data Chatbot
      </footer>
    </div>
  );
}
