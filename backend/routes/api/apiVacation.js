var express = require("express");
var router = express.Router();
var OpenAI = require("openai");
var openaiClient = new OpenAI();
const { Op } = require("sequelize");
const { User, Vacation, Team, Task } = global;

router.post("/ai-vacation-priority", async (req, res) => {
  try {
    console.log("🧭 [AI 하이브리드 판단 요청] 실행됨");

    // 1) 대기 연차 조회
    const pendingVacations = await Vacation.findAll({
      where: { status: "대기" },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["user_id", "name"],
          include: [{ model: Team, as: "Team", attributes: ["name"] }],
        },
      ],
    });

    if (!pendingVacations.length) {
      return res.status(200).json({ message: "대기 연차 없음", results: [] });
    }

    // 2) 팀별 그룹 + 규칙 기반
    const teamGroups = {};

    for (const vac of pendingVacations) {
      const teamName = vac.user?.Team?.name || "미지정팀";
      const userId = vac.user?.user_id;

      const startDate = new Date(vac.startDate);
      const endDate = new Date(vac.endDate);

      const incompleteTasks = await Task.findAll({
        where: {
          user_id: userId,
          [Op.or]: [
            { completed: false },
            { completed: 0 },
            { completed: "0" },
            { completed: null },
          ],
          deadline: {
            [Op.between]: [
              new Date(startDate.setHours(0, 0, 0, 0)),
              new Date(endDate.setHours(23, 59, 59, 999)),
            ],
          },
        },
        attributes: ["title", "deadline", "importance", "difficulty"],
      });

      let ruleBased = "승인 가능";

      if (incompleteTasks.length > 0) {
        ruleBased = "업무 미완료 - 반려 필요";
      }

      const importantTask = incompleteTasks.find(
        (task) => task.importance === "높음"
      );
      if (importantTask) {
        ruleBased = "중요 업무 - 팀장 판단 필요";
      }
      // ⭐ 업무 미완료 예외 처리 (긴급 의료 사유 → 팀장 판단 필요)
if (ruleBased === "업무 미완료 - 반려 필요") {
  const emergencyKeywords = ["병원", "진료", "응급", "수술", "고열", "의료"];
  const reasonText = (vac.reason || "").toLowerCase();

  const isEmergency = emergencyKeywords.some(k =>
    reasonText.includes(k.toLowerCase())
  );

  if (isEmergency) {
    ruleBased = "중요 업무 - 팀장 판단 필요";
  }
}

      if (!teamGroups[teamName]) teamGroups[teamName] = [];

      teamGroups[teamName].push({
        name: vac.user?.name,
        reason: vac.reason || "사유 없음",
        ruleBased,
        startDate: vac.startDate,     // ⭐ 추가 유지
        endDate: vac.endDate,         // ⭐ 추가 유지
        incompleteTasks: incompleteTasks.map((t) => ({
          title: t.title,
          deadline: t.deadline,
          importance: t.importance,
          difficulty: t.difficulty,
        })),
      });
    }

    const teamsForAI = Object.entries(teamGroups).map(([team, members]) => ({
      team,
      members,
    }));

    // 3) AI 프롬프트 - 날짜 반드시 포함하도록 요구
    const prompt = `
당신은 회사의 HR AI 어시스턴트입니다.
입력된 데이터는 다음 두 가지 정보를 포함합니다:

1) ruleBased: 규칙 기반 판단 결과
2) reason: 자연어 사유

💡 당신의 역할:
- 규칙 기반(ruleBased)을 1차 기준으로 삼되,
- reason(자연어)을 분석하여 긴급도·일정 변경 가능성 등을 정교하게 판단하세요.
- 최종 recommendation, urgencyLevel, reason을 JSON으로 출력하세요.

---

### 🔹 규칙 기반 우선 처리 방식
- ruleBased = "업무 미완료 - 반려 필요" → 무조건 반려
- ruleBased = "중요 업무 - 팀장 판단 필요" → 팀장 판단 필요 가능성 높음

---

### 🔹 자연어 해석 규칙 (AI 전용)
사유(reason)를 아래 3단계로 분류:

**긴급(5점)**
- 병원, 진료, 질병, 고열, 수술
- 장례식, 응급 상황
- 가족 긴급 병원

**보통(3점)**
- 행정 업무, 병문안, 면접, 가족 돌봄

**비긴급(1점)**
- 여행, 개인 휴가, 여가, 놀거리
- 단, "항공권/숙소/티켓/예약/비행기" 등 포함 시 일정 변경 불가 → 가중치 상승 (3점 처리)



---

### 출력(JSON)
{
  "teams": [
    {
      "team": "백엔드팀",
      "priority": [
        {
          "name": "홍길동",
          "startDate": "2025-12-03",
          "endDate": "2025-12-04",
          "urgencyLevel": 5,
          "recommendation": "승인 | 반려 | 팀장 판단 필요",
          "reason": "자연어 + 규칙 기반 종합 설명"
        }
      ]
    }
  ]
}

입력:
${JSON.stringify(teamsForAI, null, 2)}
`;

    // 4) AI 호출
    const aiResponse = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "너는 고급 HR 판단 AI다." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "vacation_priority",
          schema: {
            type: "object",
            properties: {
              teams: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    team: { type: "string" },
                    priority: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                          startDate: { type: "string" },   // ⭐ 스키마에 추가
                          endDate: { type: "string" },     // ⭐ 스키마에 추가
                          urgencyLevel: { type: "number" },
                          recommendation: { type: "string" },
                          reason: { type: "string" },
                        },
                        required: [
                          "name",
                          "startDate",
                          "endDate",
                          "urgencyLevel",
                          "recommendation",
                          "reason",
                        ],
                      },
                    },
                  },
                  required: ["team", "priority"],
                },
              },
            },
            required: ["teams"],
          },
        },
      },
    });

    const raw = aiResponse.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw);

    const teams = parsed.teams || [];

    // 5) 프론트 표시용 가공
    const finalResults = teams.map((team) => {
      let text = `━━━━━━━━━━━━━━━━━━━\n`;
      for (const p of team.priority) {
        text += `👤 ${p.name}\n`;
        text += `📅 ${p.startDate} ~ ${p.endDate}\n`;   // ⭐ 날짜 출력
        text += `➡ ${p.recommendation}\n`;
        text += `📝 ${p.reason}\n\n`;
      }
      text += `━━━━━━━━━━━━━━━━━━━`;
      return { ...team, formattedText: text.trim() };
    });

    res.status(200).json({
      success: true,
      results: finalResults,
    });

  } catch (err) {
    console.error("❌ AI 판단 오류:", err);
    res.status(500).json({ message: "AI 판단 오류" });
  }
});

module.exports = router;
