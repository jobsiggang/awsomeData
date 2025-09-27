// app/api/university/route.js

let cachedData = [];
let lastFetch = 0;
const CACHE_INTERVAL = 1000 * 60 * 5; // 5분 캐시

async function getSheetData() {
  const now = Date.now();
  if (!cachedData.length || now - lastFetch > CACHE_INTERVAL) {
    const sheetUrl = process.env.GOOGLE_SHEET_URL;
    if (!sheetUrl) throw new Error('GOOGLE_SHEET_URL is not 설정됨');

    const res = await fetch(sheetUrl);
    if (!res.ok) throw new Error('시트 데이터 가져오기 실패');
    cachedData = await res.json();
    lastFetch = now;
    console.log(`시트 데이터를 갱신했습니다. 총 ${cachedData.length}개 항목`);
  }
  return cachedData;
}

function normalize(str) {
  return (str || '').normalize('NFC').replace(/\s/g,'').replace(/[\r\n]/g,'').toLowerCase();
}

export async function POST(req) {
  try {
    // 요청 JSON 파싱
    const body = await req.json();

    // 카카오 오픈빌더 기준 사용자 발화 추출
    const userUtterance = body.action?.params?.utterance || '';
    if (!userUtterance) {
      return new Response(JSON.stringify({
        version: "2.0",
        template: { outputs: [{ simpleText: { text: "발화를 찾을 수 없습니다." } }] }
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    const inputNorm = normalize(userUtterance);

    // Google Sheet 데이터 가져오기 (캐싱 포함)
    const data = await getSheetData();

    // 학교 데이터 필터링
    const matchedSchools = data.filter(row => 
      (row['학교구분'] === '대학' || row['학교구분'] === '전문대학') &&
      row['학교명'] &&
      normalize(row['학교명']).includes(inputNorm)
    );

    // 응답 메시지 생성
    let message = '';
    if (matchedSchools.length > 0) {
      message = matchedSchools.map(school => 
        `${school['학교명']} (${school['본분교']})\n` +
        `주소: ${school['도로명주소'] || '정보 없음'}\n` +
        `대표번호: ${school['학교대표번호'] || '정보 없음'}\n` +
        `홈페이지: ${school['학교홈페이지'] || '정보 없음'}`
      ).join('\n\n');
    } else {
      message = `죄송합니다. "${userUtterance}" 관련 학교 정보를 찾을 수 없습니다. (예: "서울대학교 알려줘")`;
    }

    // 카카오 i 오픈빌더 응답 형식
    const kakaoResponse = {
      version: "2.0",
      template: { outputs: [{ simpleText: { text: message } }] }
    };

    return new Response(JSON.stringify(kakaoResponse), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({
      version: "2.0",
      template: { outputs: [{ simpleText: { text: "서버 오류가 발생했습니다." } }] }
    }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
  }
}

// GET 요청은 단순 확인용
export async function GET() {
  return new Response('OK');
}
