// utils/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function extractUniversityAndIntent(utterance) {
  const prompt = `
  사용자가 발화한 문장에서 대학교 이름과 원하는 정보를 JSON으로 뽑아줘.
  가능한 키: "학교명", "요청정보"
  요청정보는 ["주소","전화번호","홈페이지","급식","일반정보"] 중에서 선택.
  발화: "${utterance}"
  반드시 JSON만 출력해.
  `;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    return JSON.parse(text);
  } catch {
    return { 학교명: null, 요청정보: null };
  }
}
