import { NextResponse } from "next/server";
import { GetfromGemini } from "../gemini/gemini";

export async function POST(request) {
  try {
    const { utterance } = await request.json();

    // 🧠 1️⃣ Gemini에게 문장 분석 요청
    const classifyPrompt = `
    다음 문장을 분석해서 '기상정보(weather)'인지 '학교정보(school)'인지 분류하고,
    핵심 지역명(예: 서울, 부산) 또는 학교명(예: 서울고등학교)을 추출하세요.

    출력 형식은 JSON으로만 반환:
    {
      "domain": "weather" | "school" | "unknown",
      "keyword": "..."
    }

    문장: "${utterance}"
    `;
    const rawKeyword = await GetfromGemini(classifyPrompt);
    const keyword = typeof rawKeyword === "string" ? JSON.parse(rawKeyword) : rawKeyword;

    if (!keyword?.domain || !keyword?.keyword) {
      return NextResponse.json({
        bot: "핵심 정보를 찾을 수 없습니다. 다시 입력해주세요.",
      });
    }

    console.log("🔹 분석된 키워드:", keyword);
    const domain = keyword.domain;
    let apiRes, data, prompt, bot_answer;

    // 🌦️ 2️⃣ domain이 weather인 경우
    if (domain === "weather") {
      apiRes = await fetch(`${process.env.KMA_API_URL}`);
      data = await apiRes.json();

      // 기상청 응답 JSON 경로
      const wfSv1 = data.response?.body?.items?.item?.[0]?.wfSv1 || "기상정보를 불러올 수 없습니다.";
      console.log("🌤 wfSv1:", wfSv1);

      // Gemini에 지역별 기상 요약 요청
      prompt = `
      다음 문장에서 '${keyword.keyword}' 지역의 날씨를 요약해서 자연스럽게 설명하세요.
      만약 해당 지역 정보가 없으면 전체 날씨 요약을 제공하세요.

      출력 형식은 JSON으로만 반환:
      {
        "answer": "..."
      }

      문장: "${wfSv1}"
      `;
      const rawAnswer = await GetfromGemini(prompt);
      bot_answer = typeof rawAnswer === "string" ? JSON.parse(rawAnswer) : rawAnswer;

      return NextResponse.json({ bot: bot_answer.answer || "날씨 정보를 요약할 수 없습니다." });
    }

    // 🏫 3️⃣ domain이 school인 경우
    else if (domain === "school") {
      const schoolUrl = `${process.env.APP_URL}/api/school?name=${encodeURIComponent(keyword.keyword)}`;
      apiRes = await fetch(schoolUrl);
      data = await apiRes.json();

      prompt = `
      다음 JSON 데이터에서 '${keyword.keyword}' 학교의 주요 정보를 요약해 주세요.
      (예: 학교명, 위치, 설립유형 등 간단히 설명)

      출력 형식은 JSON으로만 반환:
      {
        "answer": "..."
      }

      문장: "${JSON.stringify(data)}"
      `;
      const rawAnswer = await GetfromGemini(prompt);
      bot_answer = typeof rawAnswer === "string" ? JSON.parse(rawAnswer) : rawAnswer;

      return NextResponse.json({ bot: bot_answer.answer || "학교 정보를 요약할 수 없습니다." });
    }

    // 🚫 4️⃣ 기타 도메인
    else {
      return NextResponse.json({
        bot: `지원되지 않는 도메인입니다: ${domain}`,
      });
    }
  } catch (err) {
    console.error("❌ Chat API 오류:", err);
    return NextResponse.json(
      { bot: "서버 오류가 발생했습니다.", error: err.message },
      { status: 500 }
    );
  }
}

// GET 요청 거부
export async function GET() {
  return NextResponse.json(
    { message: "POST 메서드를 사용하세요." },
    { status: 405 }
  );
}
