// app/api/university/route.js
export async function POST(req) {
  try {
    // 1. 요청 JSON 파싱
    const body = await req.json();

    // 2. 사용자의 발화 추출
    // 카카오 오픈빌더 기준: action.params.utterance
    const userUtterance = body.action?.params?.utterance || '';
    if (!userUtterance) {
      return new Response(JSON.stringify({
        version: "2.0",
        template: { outputs: [{ simpleText: { text: "발화를 찾을 수 없습니다." } }] }
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 3. Google Sheet URL 환경변수
    const sheetUrl = process.env.GOOGLE_SHEET_URL;
    if (!sheetUrl) throw new Error('GOOGLE_SHEET_URL is not 설정됨');

    // 4. Google Sheet 데이터 가져오기
    const res = await fetch(sheetUrl);
    if (!res.ok) throw new Error('시트 데이터 가져오기 실패');
    const data = await res.json();

    // 5. 문자열 정규화 (공백 제거, 줄바꿈 제거, 소문자 변환)
    const normalize = str => (str || '').normalize('NFC').replace(/\s/g,'').replace(/[\r\n]/g,'').toLowerCase();
    const inputNorm = normalize(userUtterance);

    // 6. 학교 데이터 필터링
    const matchedSchools = data.filter(row => 
      (row['학교구분'] === '대학' || row['학교구분'] === '전문대학') &&
      row['학교명'] &&
      normalize(row['학교명']).includes(inputNorm)
    );

    // 7. 응답 메시지 생성
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

    // 8. 카카오 i 오픈빌더 응답 형식
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
