var express = require('express');
var router = express.Router();
var OpenAI = require('openai');
var openaiClient = new OpenAI();

const { User, Vacation, Team } = global;

router.post("/ai-vacation-priority", async (req, res) => {
  try {
    console.log("🧭 [AI 판단 요청] 실행됨");

    const pendingVacations = await Vacation.findAll({
      where: { status: "대기" },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["name"],
          include: [
            {
              model: Team,
              as: "Team",
              attributes: ["name"],
            },
          ],
        },
      ],
    });

    if (!pendingVacations.length) {
      return res.status(200).json({ message: "대기 중인 연차가 없습니다.", results: [] });
    }

    // ✅ 팀별 그룹화
    const teamGroups = {};
    pendingVacations.forEach((vac) => {
      const teamName = vac.user?.Team?.name || "미지정팀";
      if (!teamGroups[teamName]) teamGroups[teamName] = [];

      teamGroups[teamName].push({
        name: vac.user?.name,
        reason: vac.reason || "사유 없음",
        startDate: vac.startDate,
        endDate: vac.endDate,
      });
    });

    // ✅ AI 프롬프트
    const prompt = `
당신은 회사의 HR AI입니다.
아래는 팀별로 직원들이 입력한 연차 신청 목록입니다.
각 직원의 "사유"를 **자연스럽게 해석**하여 긴급도를 평가하고, 같은 기간에 겹치는 사람들끼리 우선순위를 판단하세요.

### 🔹 긴급도 기준
- **긴급(5점)**: 병원, 수술, 질병, 입원, 장례, 출산, 응급 상황, 가족의 건강 문제 등 즉시 대응이 필요한 사유
- **보통(3점)**: 가족 돌봄, 면접, 행정 처리, 병문안 등 일정상 필요한 사유
- **비긴급(1점)**: 여행, 개인 휴가, 여가, 레저, 콘서트 등 개인적인 목적

### 🔹 예외 규칙
- 만약 "비행기표", "항공권", "숙소 예약", "티켓 예매" 등의 표현이 있으면, 
  단순한 여행이라도 일정 변경이 어려운 것으로 간주하여 **팀장 판단 필요**로 표시합니다.
- 두 명 이상이 모두 긴급(5점)일 경우에도 **팀장 판단 필요**로 표시합니다.
- 사유가 불명확하거나 판단이 애매한 경우에도 **팀장 판단 필요**로 표시합니다.

### 🔹 출력 형식 (반드시 JSON)
[
  {
    "team": "회계팀",
    "priority": [
      { "name": "홍길동", "urgencyLevel": 5, "recommendation": "승인", "reason": "수술 일정으로 긴급 승인 필요" },
      { "name": "김철수", "urgencyLevel": 1, "recommendation": "팀장 판단 필요", "reason": "여행이지만 이미 항공권 예약 완료" }
    ],
    "comment": "김철수 일정 변경 어려움으로 팀장 판단 필요"
  }
]

팀별 연차 데이터:
${JSON.stringify(teamGroups, null, 2)}
`;

    // ✅ OpenAI 호출
    const aiResponse = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "너는 공정하고 합리적으로 연차를 평가하는 HR AI야. 자연어로 된 사유를 정확히 분석해 긴급도와 변경 가능성을 함께 고려해야 해." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    let content = aiResponse.choices[0]?.message?.content || "{}";
    console.log("🧠 AI 응답 원문:", content);

    // JSON 형태만 추출
    if (!content.trim().startsWith("{") && !content.trim().startsWith("[")) {
      const start = content.indexOf("{");
      const end = content.lastIndexOf("}");
      if (start >= 0 && end >= 0) content = content.slice(start, end + 1);
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      console.error("⚠️ AI 응답 파싱 실패:", err);
      return res.status(200).json({ results: [], message: "AI 응답 파싱 실패" });
    }

    // ✅ 형식 정리
    let formattedResults = [];
    if (parsed.team) {
      formattedResults.push(parsed);
    } else if (Array.isArray(parsed)) {
      formattedResults = parsed;
    }

    // ✅ 팀장 판단 필요 자동 표시
    formattedResults = formattedResults.map((team) => {
      const urgentCount = (team.priority || []).filter((p) => p.urgencyLevel >= 5).length;
      const needManagerReview = (team.priority || []).some(
        (p) => /비행기표|항공권|숙소|예매|티켓/.test(p.reason || "")
      );

      if (urgentCount > 1 || needManagerReview) {
        team.comment = "⚠️ 일정 변경이 어렵거나 다수 긴급 사유 발생 → 팀장 판단 필요";
      }
      return team;
    });

    console.log("✅ AI 최종 결과:", formattedResults);
    res.status(200).json({ results: formattedResults });
  } catch (err) {
    console.error("❌ AI 판단 오류:", err);
    res.status(500).json({ message: "AI 판단 중 오류 발생" });
  }
});

module.exports = router;
