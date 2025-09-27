// app/api/university/route.js
import universityData from '../../../data/university.json'; // JSON 데이터 파일 경로

// 문자열 정규화 함수
const normalize = str => (str || '').normalize('NFC').replace(/\s/g,'').replace(/[\r\n]/g,'').toLowerCase();

export async function GET() {
  return new Response('OK');
}

export async function POST(req) {
  try {
    const body = await req.json();
    const userUtterance = body.action?.params?.utterance || '';
    const inputNorm = normalize(userUtterance);

    console.log('사용자 입력:', userUtterance);
    console.log('정규화 입력:', inputNorm);

    // 사용자 입력과 매칭되는 학교 찾기
    const matchedSchools = universityData.filter(row => 
      (row['학교구분'] === '대학' || row['학교구분'] === '전문대학') &&
      row['학교명'] &&
      normalize(row['학교명']).includes(inputNorm)
    );

    console.log('매칭된 학교 수:', matchedSchools.length);
    if (matchedSchools.length > 0) {
      const message = matchedSchools.map(school => 
        `${school['학교명']} (${school['본분교']})\n주소: ${school['도로명주소'] || '정보 없음'}\n대표번호: ${school['학교대표번호'] || '정보 없음'}\n홈페이지: ${school['학교홈페이지'] || '정보 없음'}`
      ).join('\n\n');

      return new Response(JSON.stringify({
        version: "2.0",
        template: { outputs: [{ simpleText: { text: message } }] }
      }), { headers: { 'Content-Type': 'application/json' } });

    } else {
      return new Response(JSON.stringify({
        version: "2.0",
        template: { outputs: [{ simpleText: { text: `죄송합니다. "${userUtterance}" 관련 학교 정보를 찾을 수 없습니다. (예: "서울대학교 알려줘")` } }] }
      }), { headers: { 'Content-Type': 'application/json' } });
    }

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({
      version: "2.0",
      template: { outputs: [{ simpleText: { text: "서버 오류가 발생했습니다." } }] }
    }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
  }
}
