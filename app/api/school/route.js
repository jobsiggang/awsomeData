// app/api/school/route.js
import { extractSheetSchoolField, initSheetColumnsCache } from "@/utils/gemini.js";
import { googleSheetsFetch } from "@/utils/googleSheets.js";

// 서버 메모리 캐시
let sheetDataCache = {};

/**
 * 시트 데이터 캐시 초기화
 */
async function initSheetDataCache(sheetName) {
  if (sheetDataCache[sheetName]) return; // 이미 캐시 있음
  const data = await googleSheetsFetch(sheetName);
  sheetDataCache[sheetName] = data;
  console.log(`✅ ${sheetName} 데이터 캐시 완료 (${data.length}건)`);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const utterance = body.action?.params?.utterance || "";

    // 시트 컬럼 캐시 초기화
    await initSheetColumnsCache();

    // 발화에서 시트명, 학교명, 요청항목 추출
    const { 시트명, 학교명, 요청항목 } = await extractSheetSchoolField(utterance);
    console.log("사용자 발화:", utterance);
    console.log("추출:", { 시트명, 학교명, 요청항목 });

    if (!시트명 || !학교명 || 요청항목.length === 0) {
      return new Response(JSON.stringify({
        version: "2.0",
        template: {
          outputs: [{ simpleText: { text: "학교명 또는 요청 항목을 인식하지 못했습니다." } }]
        }
      }), { headers: { "Content-Type": "application/json" } });
    }

    // 시트 데이터 캐시 초기화
    await initSheetDataCache(시트명);
    const sheetData = sheetDataCache[시트명];

    // 학교 찾기
    const school = sheetData.find(s => s["학교명"] === 학교명);
    if (!school) {
      return new Response(JSON.stringify({
        version: "2.0",
        template: { outputs: [{ simpleText: { text: `${학교명} 정보를 찾을 수 없습니다.` } }] }
      }), { headers: { "Content-Type": "application/json" } });
    }

    // 요청항목 결과 생성
    const messages = 요청항목.map(field => {
      const value = school[field] || "정보 없음";
      if (field === "홈페이지" && value !== "정보 없음") {
        return `${field}: <a href="${value}" target="_blank">${value}</a>`;
      }
      return `${field}: ${value}`;
    });

    const message = `${학교명} 정보\n${messages.join("\n")}`;

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
