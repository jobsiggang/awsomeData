// utils/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * 사용자 발화에서 시트명, 학교명, 항목명(배열) 추출
 * @param {string} utterance - 사용자 발화
 * @param {string[]} fieldOptions - 시트 컬럼명 배열 (예: ["주소","전화번호","홈페이지"])
 * @returns {Promise<{시트명: string|null, 학교명: string|null, 항목명: string[]}>}
 */
export async function extractSheetSchoolField(utterance, fieldOptions = []) {
  const prompt = `
사용자가 발화한 문장에서 구글 스프레드시트 시트명, 학교명, 요청 항목명을 JSON으로 추출해 주세요.
출력 가능한 키: "시트명", "학교명", "항목명"
- 시트명 후보: ["대학교","초중고등학교"]
- 항목명 후보: ${JSON.stringify(fieldOptions)}
- 요청 항목명은 사용자가 "정보를 알려줘"처럼 일반적으로 물으면 가능한 항목 모두를 배열로 반환
예시:
"서울고등학교 주소 알려줘" → {"시트명":"초중고등학교","학교명":"서울고등학교","항목명":["주소"]}
"연세대학교 정보 알려줘" → {"시트명":"대학교","학교명":"연세대학교","항목명":["주소","전화번호","홈페이지","급식","일반정보"]}
반드시 JSON 형태만 출력, 추가 텍스트 없음.
발화: "${utterance}"
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // JSON 추출
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}") + 1;
    const jsonStr = text.slice(jsonStart, jsonEnd);

    const parsed = JSON.parse(jsonStr);
    // 항목명이 배열이 아닌 경우 배열로 변환
    if (!Array.isArray(parsed.항목명)) parsed.항목명 = parsed.항목명 ? [parsed.항목명] : [];
    return parsed;
  } catch (err) {
    console.error("Gemini API 추출 실패:", err);
    return { 시트명: null, 학교명: null, 항목명: [] };
  }
}
