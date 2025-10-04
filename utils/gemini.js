// utils/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import { googleSheetsFetchColumns } from "./googleSheets.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// 서버 메모리 캐시
let sheetColumnsCache = null;

/**
 * 시트 컬럼 캐시 초기화
 */
export async function initSheetColumnsCache() {
  if (sheetColumnsCache) return; // 이미 캐시 존재
  sheetColumnsCache = {};

  // 시트명 목록 (예: ["대학교", "중고등학교"])
  const sheetNames = ["대학교", "중고등학교"];
  for (const sheetName of sheetNames) {
    const columns = await googleSheetsFetchColumns(sheetName);
    sheetColumnsCache[sheetName] = columns; // 시트별 컬럼 저장
  }

  console.log("✅ 시트 컬럼 캐시 완료:", sheetColumnsCache);
}

/**
 * 발화에서 시트명, 학교명, 요청항목 추출
 * @param {string} utterance - 사용자 발화
 * @returns {Promise<{시트명: string|null, 학교명: string|null, 요청항목: string[]}>}
 */
export async function extractSheetSchoolField(utterance) {
  if (!sheetColumnsCache) await initSheetColumnsCache();

  // 캐시된 시트명과 요청항목 예시
  const sheetList = Object.keys(sheetColumnsCache);
  const allFields = Array.from(new Set(Object.values(sheetColumnsCache).flat()));

  const prompt = `
사용자가 발화한 문장에서 시트명, 학교명, 요청항목을 JSON으로 추출해주세요.
출력 가능한 키: "시트명", "학교명", "요청항목"
- 시트명은 다음 중 하나: ${sheetList.join(", ")}
- 요청항목은 다음 중 하나 이상: ${allFields.join(", ")}
- 요청항목이 여러 개일 경우 배열로 반환
예시 발화: "서울대학교 주소와 전화번호 알려줘" → 
{"시트명":"대학교","학교명":"서울대학교","요청항목":["주소","전화번호"]}
반드시 JSON 형태만 출력, 추가 텍스트 없음.
발화: "${utterance}"
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}") + 1;
    const jsonStr = text.slice(jsonStart, jsonEnd);

    const parsed = JSON.parse(jsonStr);

    // 요청항목 항상 배열로
    if (!parsed.요청항목) parsed.요청항목 = [];
    else if (!Array.isArray(parsed.요청항목)) parsed.요청항목 = [parsed.요청항목];

    return parsed;
  } catch (err) {
    console.error("Gemini API 추출 실패:", err);
    return { 시트명: null, 학교명: null, 요청항목: [] };
  }
}
