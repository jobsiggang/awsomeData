// tmptest.js
// Node.js에서 실행 가능

const SHEET_URL = "https://script.google.com/macros/s/AKfycbzCFN8WnBYmFMdsXsQT66LyntnszXe6HcMtb7_cFdoUH1liCyNJ8rw8nVRR9euMuNoqkQ/exec"; // 실제 WebApp URL
const SHEET_NAME = "대학교"; // 테스트할 시트명

async function testSheetData() {
  try {
    const res = await fetch(SHEET_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "getData",
        sheet: SHEET_NAME
      })
    });

    if (!res.ok) throw new Error(`HTTP 오류: ${res.status}`);

    const data = await res.json();
    console.log("✅ 시트 데이터 확인:", data);
  } catch (err) {
    console.error("❌ 시트 데이터 조회 실패:", err.message);
  }
}

testSheetData();
