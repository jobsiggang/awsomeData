import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * 시트 발화 분석
 * sheetKeys: { 시트명: [컬럼1, 컬럼2, ...] } (캐시에서 컬럼명만 전달)
 * 요청항목은 반드시 시트 컬럼명 중 하나로 선택되도록 지시
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
- 요청항목: ${sheetList.map(
    s => `${s}: [${sheetKeys[s].join(", ")}]`
  ).join("; ")}
- 핵심키값: 시트별 keyFieldMap 참조
- 요청항목은 반드시 실제 시트 컬럼명 중 하나로 선택하세요.
- 학교명을 정확히 말하지 않아도 유사한 이름으로 인식 가능 (예: 울산대 → 울산대학교, 언양고 → 언양고등학교)
출력 예시: {"시트명": "대학교", "학교명": "울산대학교", "요청항목": ["주소","전화"]}
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
      return { 시트명: null, 핵심값: null, 요청항목: []};
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
