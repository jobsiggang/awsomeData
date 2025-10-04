import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * 시트 발화 분석
 * sheetKeys: { 시트명: [컬럼1, 컬럼2, ...] } (캐시에서 컬럼명만 전달)
 */
export async function extractSheetSchoolField(utterance, sheetKeys) {
  const sheetList = Object.keys(sheetKeys);
  const keyFieldMap = {
    "대학교": "학교명",
    "초중고등학교": "학교명",
    "병원정보": "지역명",
  };

  const prompt = `
사용자가 발화한 문장에서 시트명, 핵심값, 요청항목을 JSON으로 추출해주세요.
- 시트명: ${sheetList.join(", ")}
- 요청항목: ${sheetList.map(s => `${s}: [${sheetKeys[s].join(", ")}]`).join("; ")}
- 핵심키값: 시트별 keyFieldMap 참조
- 추가항목: 항목명없는 날씨가 있고 항목명에 위도 경도가 있으면 요청 항목에 주소, 위도, 경도도 반드시 포함, 추가항목에 날씨 추가
-없으면 추가항목은 빈배열
출력 예시: {"시트명": "대학교", "학교명": "울산대학교", "요청항목": ["주소","전화"], "추가항목": ["날씨"]}
반드시 JSON만 출력
발화: "${utterance}"
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // JSON 위치 안전 체크
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}") + 1;
    if (jsonStart === -1 || jsonEnd === 0) {
      console.warn("Gemini 응답에 JSON이 없음:", text);
      return { 시트명: null, 핵심값: null, 요청항목: [], 추가항목: [] };
    }

    let parsed = {};
    try {
      parsed = JSON.parse(text.slice(jsonStart, jsonEnd));
    } catch (err) {
      console.warn("JSON 파싱 실패:", err, "원문:", text);
      return { 시트명: null, 핵심값: null, 요청항목: [], 추가항목: [] };
    }

    // 요청항목 / 추가항목 안전 처리
    if (!parsed.요청항목) parsed.요청항목 = [];
    else if (!Array.isArray(parsed.요청항목)) parsed.요청항목 = [parsed.요청항목];

    if (!parsed.추가항목) parsed.추가항목 = [];
    else if (!Array.isArray(parsed.추가항목)) parsed.추가항목 = [parsed.추가항목];

    return parsed;
  } catch (err) {
    console.error("Gemini 분석 실패:", err);
    return { 시트명: null, 핵심값: null, 요청항목: [], 추가항목: [] };
  }
}

/**
 * Gemini를 활용해 검색 결과를 자연스러운 대화형 응답으로 변환
 * filteredData: [{컬럼1:값, 컬럼2:값}, ...]
 */
export async function generateHumanLikeReply(userUtterance, filteredData) {
  const prompt = filteredData?.length
    ? `사용자가 "${userUtterance}"라고 물었습니다. 자연스럽게 설명해 주세요, 세문장이하로 간단히 사실만 말해요\n${JSON.stringify(filteredData)}`
    : `사용자가 "${userUtterance}"라고 물었습니다. 데이터가 없습니다. 비슷한 정보를 제안하거나 질문을 유도해주세요. 세문장이하로 간단히 사실만 말해요`;

  try {
    const result = await model.generateContent(prompt);
    return result?.response?.text() || "죄송합니다. 답변 생성 실패, 다시 질문해 주세요.";
  } catch (err) {
    console.error("Gemini 자연어 응답 실패:", err);
    return "죄송합니다. 답변 생성 실패, 다시 질문해 주세요.";
  }
}
