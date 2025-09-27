// app/api/university/route.js
import fs from 'fs';
import path from 'path';

// 배포 환경에서도 안전하게 경로 지정
const FILE_PATH = path.join(process.cwd(), 'data', 'university.json');

// 문자열 정규화 함수
function normalize(str) {
  return (str || '').normalize('NFC').replace(/\s/g, '').replace(/[\r\n]/g, '').toLowerCase();
}

// GET 요청: 서버 확인용
export async function GET() {
  return new Response('OK');
}

// POST 요청: 카카오 스킬용
export async function POST(req) {
  try {
    const body = await req.json();
    // 카카오 action.params.utterance 사용
    const userUtterance = body.action?.params?.utterance || '';

    if (!userUtterance) {
      return new Response(JSON.stringify({
        version: "2.0",
        template: {
          outputs: [{ simpleText: { text: "발화를 찾을 수 없습니다." } }]
        }
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // JSON 파일 읽기
    let data = [];
    try {
      const jsonText = fs.readFileSync(FILE_PATH, 'utf-8');
      data = JSON.parse(jsonText);
    } catch (err) {
      console.error('JSON 파일 읽기 실패:', err);
      return new Response(JSON.stringify({
        version: "2.0",
        template: { outputs: [{ simpleText: { text: "학교 데이터 파일을 불러올 수 없습니다." } }] }
      }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
    }

    const inputNorm = normalize(userUtterance);

    // 학교 검색
    const matchedSchools = data.filter(row =>
      (row['학교구분'] === '대학' || row['학교구분'] === '전문대학') &&
      row['학교명'] &&
      normalize(row['학교명']).includes(inputNorm)
    );

    // 메시지 생성
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

    // 카카오 스킬 응답
    const kakaoResponse = {
      version: "2.0",
      template: { outputs: [{ simpleText: { text: message } }] }
    };

    return new Response(JSON.stringify(kakaoResponse), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('POST 처리 중 오류:', err);
    return new Response(JSON.stringify({
      version: "2.0",
      template: { outputs: [{ simpleText: { text: "서버 오류가 발생했습니다." } }] }
    }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
  }
}
