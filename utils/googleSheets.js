const SHEET_URL = process.env.GOOGLE_SHEET_WEBAPP_URL;
const SHEET_NAMES = process.env.SHEET_NAMES
  ? JSON.parse(process.env.SHEET_NAMES)
  : ["대학교", "초중고등학교"];

// 시트별 데이터 캐시 (글로벌)
global.sheetDataCache = global.sheetDataCache || null;

/**
 * 구글 시트 데이터 가져오기 (Apps Script doPost 구조 반영)
 */
async function googleSheetsFetch(sheetName) {
  const res = await fetch(SHEET_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getData", sheet: sheetName }),
  });

  if (!res.ok) throw new Error(`구글 시트 조회 실패: ${sheetName}`);

  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("시트 데이터 형식 오류");

  console.log(`✅ ${sheetName} 시트 데이터 조회 성공 (행 수: ${data.length})`);
  console.log("컬럼명:", Object.keys(data[0] || {}).join(", "));
  console.log("첫 5개 데이터:", data.slice(0, 5));

  return data; // [{컬럼1:값, 컬럼2:값}, ...]
}

/**
 * 시트 데이터 캐시 초기화
 */
export async function initSheetDataCache() {
  if (!global.sheetDataCache) global.sheetDataCache = {};

  try {
    for (const sheetName of SHEET_NAMES) {
      const data = await googleSheetsFetch(sheetName);

      // 숫자형 인덱스 컬럼 제거
      const cleanedData = data.map(row => {
        const obj = {};
        Object.keys(row).forEach(key => {
          if (isNaN(Number(key))) obj[key] = row[key];
        });
        return obj;
      });

      global.sheetDataCache[sheetName] = cleanedData;

      console.log(`✅ ${sheetName} 시트 캐시 완료 (행 수: ${cleanedData.length})`);
      console.log("컬럼명:", Object.keys(cleanedData[0] || {}).join(", "));
      console.log("첫 5개 데이터:", cleanedData.slice(0, 5));
    }

    console.log("✅ 전체 시트 데이터 캐시 초기화 완료:", Object.keys(global.sheetDataCache));
  } catch (err) {
    console.error("시트 데이터 초기화 실패:", err);
  }

  return global.sheetDataCache;
}

/**
 * 캐시 가져오기
 */
export function getSheetDataCache() {
  console.log(
    "현재 시트 데이터 캐시 상태:",
    global.sheetDataCache ? Object.keys(global.sheetDataCache) : null
  );
  return global.sheetDataCache;
}

/**
 * 10분마다 캐시 갱신
 */
export function startAutoRefresh(intervalMinutes = 10) {
  // 서버 시작 시 한 번 초기화
  initSheetDataCache();

  setInterval(() => {
    console.log("🔄 시트 데이터 갱신 시작...");
    initSheetDataCache();
  }, intervalMinutes * 60 * 1000);
}
