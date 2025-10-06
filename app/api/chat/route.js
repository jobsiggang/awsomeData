// app/api/chat/route.js
import { extractSheetSchoolField } from "@/utils/gemini.js";
import { getSheetDataCache, initSheetDataCache } from "@/utils/googleSheets.js";

// 시트 캐시가 준비될 때까지 대기
async function waitForCache(maxWait = 5000) {
  const start = Date.now();
  while (!getSheetDataCache()) {
    if (Date.now() - start > maxWait) break;
    await new Promise(res => setTimeout(res, 100));
  }
  return getSheetDataCache();
}

export async function POST(req) { 
  try {
    const body = await req.json();
    const userUtterance = body.utterance;
    if (!userUtterance) {
      return new Response(JSON.stringify({ bot: "메시지가 없습니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1️⃣ 캐시 확인 및 초기화
    let sheetDataCache = await waitForCache();
    if (!sheetDataCache) {
      await initSheetDataCache();
      sheetDataCache = getSheetDataCache();
    }
    if (!sheetDataCache) {
      return new Response(
        JSON.stringify({ bot: "시트 데이터가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // 2️⃣ 시트별 컬럼 추출
    const sheetKeys = {};
    for (const sheetName of Object.keys(sheetDataCache)) {
      const rows = sheetDataCache[sheetName];
      sheetKeys[sheetName] = rows && rows.length > 0
        ? Object.keys(rows[0]).filter(k => isNaN(Number(k)))
        : [];
    }

    // 3️⃣ Gemini 분석
    const analysis = await extractSheetSchoolField(userUtterance, sheetKeys);
    console.log("💡 Gemini 분석 결과:", analysis);

    // 요청항목이 없으면 다시 질문
    if (!analysis.요청항목 || analysis.요청항목.length === 0) {
      return new Response(
        JSON.stringify({ bot: "무슨 정보를 원하시는지 정확히 이해하지 못했습니다. 다시 질문해주세요." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const sheetName = analysis.시트명;
    if (!sheetName || !sheetDataCache[sheetName]) {
      return new Response(
        JSON.stringify({ bot: "해당 데이터가 없습니다." }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // 4️⃣ 핵심키 및 값
    const keyField = Object.keys(analysis).find(k => !["시트명", "요청항목", "추가항목"].includes(k));
    const keyValue = analysis[keyField];

    // 5️⃣ 시트 데이터 필터링
    const filtered = sheetDataCache[sheetName]
      .filter(row => keyValue ? row[keyField] === keyValue : true)
      .map(row => {
        const obj = {};
        analysis.요청항목.forEach(f => {
          if (row[f] !== undefined) obj[f] = row[f];
        });
        return obj;
      });

    // 6️⃣ 키-값 문장 생성
    let replyText = "";
    if (filtered.length > 0) {
      filtered.forEach(item => {
        const parts = [];
        for (const k in item) {
          parts.push(`${k}는 ${item[k]}입니다`);
        }
        replyText += parts.join(", ") + ".\n";
      });
      replyText = replyText.trim();
    } else {
      replyText = "데이터가 없습니다.";
    }

    return new Response(JSON.stringify({ bot: replyText }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("💥 Chat API 에러:", err);
    return new Response(
      JSON.stringify({ bot: "서버 처리 중 오류 발생, 다시 질문해 주세요." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
