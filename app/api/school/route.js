// app/api/school/route.js
import { extractSheetSchoolField } from "@/utils/gemini.js";
import { googleSheetsFetch, googleSheetsFetchColumns } from "@/utils/googleSheets.js";

let cachedSheetStructure = null; // 시트명 + 컬럼 캐시

async function fetchSheetStructure() {
  if (!cachedSheetStructure) {
    const sheetNames = ["대학교", "중고등학교"]; // 필요 시 구글 시트에서 동적 조회 가능
    cachedSheetStructure = {};
    for (const name of sheetNames) {
      const columns = await googleSheetsFetchColumns(name); // 시트 컬럼만 가져오기
      cachedSheetStructure[name] = columns;
    }
    console.log("Cached Sheet Structure:", cachedSheetStructure);
  }
  return cachedSheetStructure;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const utterance = body.action?.params?.utterance || "";

    // 캐시된 시트 구조 가져오기
    const sheetStructure = await fetchSheetStructure();

    // Gemini API로 시트명, 학교명, 요청항목 추출
    const { 시트명, 학교명, 요청항목 } = await extractSheetSchoolField(utterance, sheetStructure);

    console.log("사용자 발화:", utterance);
    console.log("추출:", { 시트명, 학교명, 요청항목 });

    if (!시트명 || !학교명 || !요청항목 || 요청항목.length === 0) {
      return new Response(JSON.stringify({
        version: "2.0",
        template: { outputs: [{ simpleText: { text: "학교명 또는 요청 항목을 인식하지 못했습니다." } }] }
      }), { headers: { "Content-Type": "application/json" } });
    }

    // 요청 시트 데이터 가져오기
    const sheetData = await googleSheetsFetch(시트명);
    if (!Array.isArray(sheetData)) throw new Error("시트 데이터 형식 오류");

    const school = sheetData.find(s => s["학교명"] === 학교명);
    if (!school) {
      return new Response(JSON.stringify({
        version: "2.0",
        template: { outputs: [{ simpleText: { text: `${학교명} 정보를 찾을 수 없습니다.` } }] }
      }), { headers: { "Content-Type": "application/json" } });
    }

    // 요청항목에 맞춰 응답 생성
    const messageLines = 요청항목.map(key => {
      if (key === "홈페이지" && school[key]) {
        return `${key}: <a href="${school[key]}" target="_blank">${school[key]}</a>`;
      }
      return `${key}: ${school[key] || "정보 없음"}`;
    });

    const message = messageLines.join("\n");

    return new Response(JSON.stringify({
      version: "2.0",
      template: { outputs: [{ simpleText: { text: message } }] }
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    console.error("School API 오류:", err);
    return new Response(JSON.stringify({
      version: "2.0",
      template: { outputs: [{ simpleText: { text: "서버 오류가 발생했습니다." } }] }
    }), { headers: { "Content-Type": "application/json" }, status: 500 });
  }
}
