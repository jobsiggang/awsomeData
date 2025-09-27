import fs from 'fs';
import path from 'path';

const FILE_PATH = path.resolve('./data/university.json');
const SHEET_URL = process.env.GOOGLE_SHEET_URL;

export async function GET() {
  try {
    if (!SHEET_URL) throw new Error('GOOGLE_SHEET_URL 환경변수 없음');

    const res = await fetch(SHEET_URL); // ✅ node-fetch 필요 없음
    if (!res.ok) throw new Error('Google Sheet 데이터 가져오기 실패');

    const data = await res.json();
    fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');

    return new Response(JSON.stringify({ message: 'university.json 갱신 완료', count: data.length }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: '갱신 실패', error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500
    });
  }
}
