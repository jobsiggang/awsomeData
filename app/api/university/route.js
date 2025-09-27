// app/api/university/route.js
export async function GET() {
  return new Response('OK');
}

export async function POST(req) {
  try {
    const body = await req.json();
    const userUtterance = body.userRequest?.utterance || '';
    const sheetUrl = process.env.GOOGLE_SHEET_URL;
    if (!sheetUrl) throw new Error('GOOGLE_SHEET_URL is not set');

    const res = await fetch(sheetUrl);
    if (!res.ok) throw new Error('Failed to fetch sheet data');
    const data = await res.json();

    // 데이터 로그 확인
    console.log('데이터 전체 개수:', data.length);
    console.log('데이터 첫 5개 행:', data.slice(0,5));

    // 문자열 정규화 함수 (공백 제거, 줄바꿈 제거, 소문자 변환)
    const normalize = str => (str || '').normalize('NFC').replace(/\s/g,'').replace(/[\r\n]/g,'').toLowerCase();
    const inputNorm = normalize(userUtterance);

    console.log('사용자 입력:', userUtterance);
    console.log('정규화 입력:', inputNorm);

    // 사용자 입력과 매칭되는 학교 모두 찾기
    const matchedSchools = data.filter(row => 
      (row['학교구분'] === '대학' || row['학교구분'] === '전문대학') &&
      row['학교명'] &&
      normalize(row['학교명']).includes(inputNorm)
    );

    console.log('매칭된 학교 수:', matchedSchools.length);
    console.log('매칭된 학교 예시:', matchedSchools.slice(0,3));

    let message = '';
    if (matchedSchools.length > 0) {
      message = matchedSchools.map(school => 
        `${school['학교명']} (${school['본분교']})\n주소: ${school['도로명주소'] || '정보 없음'}\n대표번호: ${school['학교대표번호'] || '정보 없음'}\n홈페이지: ${school['학교홈페이지'] || '정보 없음'}`
      ).join('\n\n'); // 여러 학교는 줄바꿈으로 구분
    } else {
      message = '죄송합니다. 해당 학교 정보를 찾을 수 없습니다. (예: "서울대학교 알려줘")';
    }

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
