// app/api/gemini/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
/**
 * 사용자의 문장에서 기상정보 or 학교정보 분류 및 핵심 키워드 추출
 * @param {string} utterance - 사용자의 질문 문장
 * @returns {Promise<{type: string, keyword: string | null}>}
 */
export async function GetfromGemini(prompt) {
  try {

    const response = await model.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = response.response.text().trim();
    console.log("🔹 Gemini 응답:", text);

    // 응답이 JSON 형태가 아닐 경우 대비
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("잘못된 JSON 응답");
    }

    const jsonText = text.slice(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonText);
  } catch (err) {
    console.error("❌ Gemini 분석 오류:", err);
    return { type: "unknown", keyword: null };
  }
}
