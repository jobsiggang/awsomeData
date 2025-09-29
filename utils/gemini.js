// utils/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * 발화에서 학교명과 요청정보 추출
 * @param {string} utterance - 사용자 발화
 * @returns {Promise<{학교명: string|null, 요청정보: string|null}>}
 */
export async function extractUniversityAndIntent(utterance) {
  // 🔹 안정적인 JSON 출력 유도
  const prompt = `
사용자가 발화한 문장에서 대학교 이름과 요청정보를 JSON으로 추출해 주세요.
출력 가능한 키: "학교명", "요청정보"
요청정보는 ["주소","전화번호","홈페이지","급식","일반정보"] 중 하나로 선택.
예시 발화: "서울대학교 주소 알려줘" → {"학교명":"서울대학교","요청정보":"주소"}
반드시 JSON 형태만 출력, 추가 텍스트 없음.
발화: "${utterance}"
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // 🔹 JSON 파싱 안정화
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}") + 1;
    const jsonStr = text.slice(jsonStart, jsonEnd);

    return JSON.parse(jsonStr);
  } catch (err) {
    console.error("Gemini API 추출 실패:", err);
    return { 학교명: null, 요청정보: null };
  }
}
