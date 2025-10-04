// utils/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * 발화에서 시트명, 학교명, 요청항목 추출
 * @param {string} utterance - 사용자 발화
 * @returns {Promise<{시트명: string|null, 학교명: string|null, 요청항목: string[]|null}>}
 */
export async function extractSheetSchoolField(utterance) {
  const prompt = `
사용자가 발화한 문장에서 시트명, 학교명, 요청항목을 JSON으로 추출해 주세요.
출력 키: "시트명", "학교명", "요청항목"
요청항목은 배열로 출력. 예: ["주소","전화번호","홈페이지"]
시트명은 ["대학교","초중고"] 중 하나로 선택
반드시 JSON 형태만 출력
발화: "${utterance}"
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}") + 1;
    const jsonStr = text.slice(jsonStart, jsonEnd);

    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Gemini API 추출 실패:", err);
    return { 시트명: null, 학교명: null, 요청항목: null };
  }
}
