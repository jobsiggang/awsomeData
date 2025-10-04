"use client";

import React, { useState, KeyboardEvent, FormEvent } from "react";

export default function MyPage() {
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<{ user: string; bot: string }[]>([]);

  // 서버 호출 예시
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    // 사용자 메시지 저장
    setMessages((prev) => [...prev, { user: text, bot: "" }]);
    setInput("");

    try {
      const res = await fetch("/api/school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: { params: { utterance: text } } }),
      });

      const data = await res.json();
      const botResponse = data.template?.outputs[0]?.simpleText?.text || "응답이 없습니다.";

      // 마지막 메시지 업데이트
      setMessages((prev) =>
        prev.map((msg, i) => (i === prev.length - 1 ? { ...msg, bot: botResponse } : msg))
      );
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((msg, i) => (i === prev.length - 1 ? { ...msg, bot: "서버 오류 발생" } : msg))
      );
    }
  };

  // 엔터 키 이벤트 처리
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage(input);
    }
  };

  // 버튼 클릭 이벤트 처리
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>챗봇</h1>

      <div style={{ marginBottom: 20, maxHeight: 400, overflowY: "auto", border: "1px solid #ccc", padding: 10 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 10 }}>
            <div><strong>사용자:</strong> {msg.user}</div>
            <div><strong>챗봇:</strong> {msg.bot}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="질문을 입력하세요"
          style={{ width: "70%", padding: 8 }}
        />
        <button type="submit" style={{ padding: "8px 16px", marginLeft: 8 }}>
          보내기
        </button>
      </form>
    </div>
  );
}
