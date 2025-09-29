// app/api/university/route.js
import { extractUniversityAndIntent } from "@/utils/gemini.js";
import fs from "fs";
import path from "path";

const FILE_PATH = path.resolve("./data/university.json");
const universities = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));

// 문자열 정규화
function normalize(str) {
  return (str || "").normalize("NFC").replace(/\s/g, "").replace(/[\r\n]/g, "").toLowerCase();
}

export async function POST(req) {
  try {
    const body = await req.json();
    const utterance = body.action?.params?.utterance || "";

    if (!utterance) {
      return new Response(
        JSON.stringify({
          version: "2.0",
          template: { outputs: [{ simpleText: { text: "발화를 찾을 수 없습니다." } }] },
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 1️⃣ Gemini로 학교명 + 요청정보 추출
    const { 학교명, 요청정보 } = await extractUniversityAndIntent(utterance);
    console.log("추출된 학교명, 요청정보:", 학교명, 요청정보);
    if (!학교명) {
      return new Response(
        JSON.stringify({
          version: "2.0",
          template: { outputs: [{ simpleText: { text: "학교명을 찾을 수 없습니다." } }] },
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 2️⃣ 학교 검색
    const school = universities.find(u => normalize(u["학교명"]) === normalize(학교명));

    let message;
    if (school) {
      switch (요청정보) {
        case "주소":
          message = `${학교명} 주소: ${school["도로명주소"] || "정보 없음"}`;
          break;
        case "전화번호":
          message = `${학교명} 대표번호: ${school["학교대표번호"] || "정보 없음"}`;
          break;
        case "홈페이지":
          message = `${학교명} 홈페이지: ${school["학교홈페이지"] || "정보 없음"}`;
          break;
        case "급식":
          message = `${학교명} 급식 정보: ${school["급식정보"] || "정보 없음"}`;
          break;
        default:
          message = `${학교명} (${school["본분교"]})\n주소: ${school["도로명주소"] || "정보 없음"}\n전화: ${school["학교대표번호"] || "정보 없음"}\n홈페이지: ${school["학교홈페이지"] || "정보 없음"}`;
      }
    } else {
      message = `${학교명} 정보를 찾을 수 없습니다.`;
    }

    // 3️⃣ 카카오 챗봇 응답 형식
    return new Response(
      JSON.stringify({
        version: "2.0",
        template: { outputs: [{ simpleText: { text: message } }] },
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("스킬 서버 오류:", err);
    return new Response(
      JSON.stringify({
        version: "2.0",
        template: { outputs: [{ simpleText: { text: "서버 오류가 발생했습니다." } }] },
      }),
      { headers: { "Content-Type": "application/json" }, status: 500 }
    );
  }
}

// GET 요청은 단순 확인용
export async function GET() {
  return new Response("OK");
}
