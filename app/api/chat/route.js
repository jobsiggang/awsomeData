// app/api/chat/route.js
import { extractSheetSchoolField, generateHumanLikeReply } from "@/utils/gemini.js";
import { getSheetDataCache, initSheetDataCache } from "@/utils/googleSheets.js";

// OpenWeather API 호출 함수
async function getWeather(lat, lon) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
 //const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&lang=kr&appid=${apiKey}`;
// const url = `https://api.openweathermap.org/data/3.0/onecall?lat=33.44&lon=-94.04&appid="d34be590ec72ddf16d8eb9438dbc445a"`;
//   try {
//     const res = await fetch(url);
//     if (!res.ok) throw new Error(`OpenWeather API 오류: ${res.status}`);
//     const data = await res.json();
//     console.log("🌤️ OpenWeather 데이터:", data) ;
//     return {
//       현재: {
//         온도: 45,//data.current?.temp,
//         습도: 70,//data.current?.humidity,
//         날씨: "더워"//data.current?.weather?.[0]?.description,
//       },
//     };
//   } catch (err) {
//     console.error("🌧️ OpenWeather API 호출 실패:", err);
//     return null;
//   }
    return "🌤️ 현재 날씨: 온도 45도, 습도 70%, 맑음";}


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
      return new Response("메시지가 없습니다.", { status: 400 });
    }

    // 1️⃣ 캐시 확인 및 초기화
    let sheetDataCache = await waitForCache();
    if (!sheetDataCache) {
      console.log("⚙️ 캐시 없음 → 새로 초기화 중...");
      await initSheetDataCache();
      sheetDataCache = getSheetDataCache();
    }
    if (!sheetDataCache) {
      return new Response("시트 데이터가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.", { status: 503 });
    }

    // 2️⃣ 시트별 컬럼 추출
    const sheetKeys = {};
    for (const sheetName of Object.keys(sheetDataCache)) {
      const rows = sheetDataCache[sheetName];
      sheetKeys[sheetName] = rows && rows.length > 0
        ? Object.keys(rows[0]).filter(k => isNaN(Number(k)))
        : [];
    }

    // 3️⃣ 시트별 핵심 필드 정의
    const keyFieldMap = {
      "대학교": "학교명",
      "초중고등학교": "학교명",
      "병원정보": "지역명",
    };

    // 4️⃣ Gemini로 발화 분석
    const analysis = await extractSheetSchoolField(userUtterance, sheetKeys, keyFieldMap);
    console.log("🧠 Gemini 분석 결과:", analysis);

    const sheetName = analysis.시트명;
    if (!sheetName || !sheetDataCache[sheetName]) {
      const reply = await generateHumanLikeReply(userUtterance, []);
      return new Response(reply, { status: 200 });
    }

    // 5️⃣ 핵심키 및 값
    const keyField = Object.keys(analysis).find(k => k !== "시트명" && k !== "요청항목" && k !== "추가항목");
    const keyValue = analysis[keyField];

    // 6️⃣ 시트에서 필터링
    const filtered = sheetDataCache[sheetName]
      .filter(row => keyValue ? row[keyField] === keyValue : true)
      .map(row => {
        const obj = {};
        analysis.요청항목.forEach(f => {
          if (row[f] !== undefined) obj[f] = row[f];
        });
        return obj;
      });

    // 7️⃣ 날씨 요청 여부 확인 및 API 호출
    let weather = null;
    if (analysis.추가항목?.includes("날씨") && filtered.length > 0) {
      const first = filtered[0];
      const lat = first["위도"] || first["lat"];
      const lon = first["경도"] || first["lon"];
      if (lat && lon) {
        weather = await getWeather(lat, lon);
      }
    }

    // 8️⃣ Gemini로 자연스러운 응답 생성
    const reply = await generateHumanLikeReply(userUtterance, filtered, { weather });

    return new Response(reply, { status: 200 });

  } catch (err) {
    console.error("💥 Chat API 에러:", err);
    return new Response("서버 처리 중 오류 발생, 다시 질문해 주세요.", { status: 500 });
  }
}
