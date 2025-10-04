// utils/googleSheets.js

const SHEET_WEBAPP_URL = process.env.GOOGLE_SHEET_WEBAPP_URL;

/**
 * 시트 데이터 전체 가져오기
 * @param {string} sheetName - 시트명
 * @returns {Promise<Array<Object>>} - [{ "학교명": "...", "도로명주소": "...", ... }, ...]
 */
export async function googleSheetsFetch(sheetName) {
  if (!SHEET_WEBAPP_URL) throw new Error("GOOGLE_SHEET_WEBAPP_URL 환경변수 미설정");

  const res = await fetch(`${SHEET_WEBAPP_URL}?sheet=${encodeURIComponent(sheetName)}`);
  if (!res.ok) throw new Error("구글 시트 조회 실패");

  const data = await res.json();
  if (!Array.isArray(data)) throw new Error("시트 데이터 형식 오류");

  return data;
}

/**
 * 시트 컬럼명만 가져오기 (캐시용)
 * @param {string} sheetName - 시트명
 * @returns {Promise<Array<string>>} - ["학교명", "도로명주소", ...]
 */
export async function googleSheetsFetchColumns(sheetName) {
  const data = await googleSheetsFetch(sheetName);
  if (!data || data.length === 0) return [];
  return Object.keys(data[0]); // 첫 행의 키를 컬럼명으로 사용
}
