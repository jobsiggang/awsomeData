import fs from 'fs';
import fetch from 'node-fetch';
import path from 'path';

// Google Apps Script JSON URL
const SHEET_URL = process.env.GOOGLE_SHEET_URL;
const sheetNames =process.env.SHEET_NAMES;
// university.json 저장 경로
const FILE_PATH = path.resolve('./data/university.json');

// 데이터 가져와서 저장
async function updateUniversityJson() {
  if (!SHEET_URL) {
    console.error('GOOGLE_SHEET_URL 환경변수가 설정되지 않았습니다.');
    return;
  }

  try {
    const res = await fetch(SHEET_URL);
    if (!res.ok) throw new Error('Google Sheet 데이터 가져오기 실패');

    const data = await res.json();

    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`[${new Date().toISOString()}] university.json 갱신 완료 (${data.length}개 항목)`);
  } catch (err) {
    console.error('university.json 갱신 실패:', err);
  }
}

// 초기 실행
updateUniversityJson();

// 5분마다 갱신
setInterval(updateUniversityJson, 1000 * 60 * 5);
