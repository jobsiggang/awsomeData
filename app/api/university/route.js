import fs from 'fs';
import path from 'path';

const FILE_PATH = path.resolve('./data/university.json');

function normalize(str) {
  return (str || '').normalize('NFC').replace(/\s/g,'').replace(/[\r\n]/g,'').toLowerCase();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const userUtterance = body.action?.params?.utterance || '';

    if (!userUtterance) {
      return new Response(JSON.stringify({
        version: "2.0",
        template: { outputs: [{ simpleText: { text: "발화를 찾을 수 없습니다." } }] }
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // JSON 파일 읽기
    const data = JSON.parse(fs.readFileSync(FILE_PATH, 'utf-8'));
    const inputNorm = normalize(userUtterance);

    const matchedSchools = data.filter(row => 
      (row['학교구분'] === '대학' || row['학교구분'] === '전문대학') &&
      row['학교명'] &&
      normalize(row['학교명']).includes(inputNorm)
    );

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

    return new Response(JSON.stringify({ version: "2.0", template: { outputs: [{ simpleText: { text: message } }] } }), {
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

// GET 확인용
export async function GET() {
  return new Response('OK');
}
