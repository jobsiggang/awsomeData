// app/api/university/route.js
import { extractUniversityAndIntent } from "@/utils/gemini.js";
import fs from "fs";
import path from "path";

const FILE_PATH = path.resolve("./data/university.json");
const universities = JSON.parse(fs.readFileSync(FILE_PATH, "utf-8"));

export async function POST(req) {
  try {
    const body = await req.json();
    const utterance = body.action?.params?.utterance || "";

    // Gemini API로 학교명 + 요청정보 추출
    const { 학교명, 요청정보 } = await extractUniversityAndIntent(utterance);

    // 🔹 로그 출력
    console.log("사용자 발화:", utterance);
    console.log("추출된 학교명:", 학교명);
    console.log("추출된 요청정보:", 요청정보);

    if (!학교명) {
      return new Response(JSON.stringify({
        version: "2.0",
        template: { outputs: [{ simpleText: { text: "학교명을 찾을 수 없습니다." } }] }
      }), { headers: { "Content-Type": "application/json" } });
    }

    const school = universities.find(u => u["학교명"] === 학교명);

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
        default:
          message = `${학교명} (${school["본분교"]})\n주소: ${school["도로명주소"]}\n전화: ${school["학교대표번호"]}`;
      }
    } else {
      message = `${학교명} 정보를 찾을 수 없습니다.`;
    }

    return new Response(JSON.stringify({
      version: "2.0",
      template: { outputs: [{ simpleText: { text: message } }] }
    }), { headers: { "Content-Type": "application/json" } });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({
      version: "2.0",
      template: { outputs: [{ simpleText: { text: "서버 오류가 발생했습니다." } }] }
    }), { headers: { "Content-Type": "application/json" }, status: 500 });
  }
}
