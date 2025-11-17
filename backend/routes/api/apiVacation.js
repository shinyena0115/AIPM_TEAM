var express = require("express");
var router = express.Router();
var OpenAI = require("openai");
var openaiClient = new OpenAI();
const { Op } = require("sequelize");
const { User, Vacation, Team, Task } = global;

router.post("/ai-vacation-priority", async (req, res) => {
  try {
    console.log("🧭 [AI 판단 요청] 실행됨");

    // ✅ 1️⃣ 대기 상태 연차 불러오기
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
      return res
        .status(200)
        .json({ message: "대기 중인 연차가 없습니다.", results: [] });
    }

    // ✅ 2️⃣ 팀별로 묶기 + 연차 기간 내 미완료 업무 조회
    const teamGroups = {};

    for (const vac of pendingVacations) {
      const teamName = vac.user?.Team?.name || "미지정팀";
      const userId = vac.user?.user_id;

      const incompleteTasks = await Task.findAll({
  where: {
    user_id: userId,
    completed: 0,
    // 🔥 업무 deadline 이 연차 종료일 이전이면 미완료 업무로 간주
    deadline: {
      [Op.lte]: vac.endDate
    }
  },
  attributes: ["title", "deadline", "importance", "difficulty"],
});


      if (!teamGroups[teamName]) teamGroups[teamName] = [];

      teamGroups[teamName].push({
        name: vac.user?.name,
        reason: vac.reason || "사유 없음",
        startDate: vac.startDate,
        endDate: vac.endDate,
        incompleteTasks: incompleteTasks.map((t) => ({
          title: t.title,
          deadline: t.deadline,
          importance: t.importance,
          difficulty: t.difficulty,
        })),
      });
    }

    // ✅ 3️⃣ 날짜 겹치는 사람만 필터링
    const overlappingTeams = {};
    for (const [teamName, vacations] of Object.entries(teamGroups)) {
      const overlapping = vacations.filter((v1, i) =>
        vacations.some(
          (v2, j) =>
            i !== j &&
            !(
              new Date(v1.endDate) < new Date(v2.startDate) ||
              new Date(v1.startDate) > new Date(v2.endDate)
            )
        )
      );
      if (overlapping.length >= 2) overlappingTeams[teamName] = overlapping;
    }

    // ✅ 4️⃣ 겹치는 팀 없을 경우
    if (Object.keys(overlappingTeams).length === 0) {
      console.log("⚠️ 겹치는 연차 없음 → AI 판단 생략");
      return res
        .status(200)
        .json({ success: true, results: [], message: "겹치는 연차 없음" });
    }

    // ✅ 5️⃣ AI 프롬프트
    const prompt = `
당신은 회사의 HR AI입니다.
아래는 팀별 연차 신청 정보 및 미완료 업무(Task) 목록입니다.
사유와 미완료 업무를 고려해 각 직원의 연차 승인 여부를 판단하세요.

출력 형식(JSON):
[
  {
    "team": "회계",
    "priority": [
      { "name": "김철수", "urgencyLevel": 1, "recommendation": "반려", "reason": "업무 미완료 상태로 연차 신청함" },
      { "name": "gg", "urgencyLevel": 1, "recommendation": "승인", "reason": "개인적인 휴식 목적" }
    ],
    "comment": "김철수는 업무 미완료로 반려"
  }
]

팀별 연차 및 미완료 업무 데이터:
${JSON.stringify(overlappingTeams, null, 2)}
`;

    // ✅ 6️⃣ OpenAI 호출
    const aiResponse = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "너는 공정하고 합리적으로 연차를 평가하는 HR AI야." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    let content = aiResponse.choices[0]?.message?.content || "{}";
    console.log("🧠 AI 응답 원문:", content);

    // ✅ 7️⃣ JSON 파싱
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      console.error("⚠️ AI 응답 파싱 실패:", err);
      return res
        .status(200)
        .json({ results: [], message: "AI 응답 파싱 실패" });
    }

    // ✅ 8️⃣ 결과 정리
    let formattedResults = Array.isArray(parsed) ? parsed : [parsed];

    formattedResults = formattedResults.map((team) => {
      const priorityList = Array.isArray(team.priority) ? team.priority : [];

      // ⚙️ 팀장 판단 조건
      const urgentCount = priorityList.filter((p) => p.urgencyLevel >= 5).length;
      const needManagerReview = priorityList.some(
        (p) =>
          /비행기표|항공권|숙소|예매|티켓|업무 미완료/.test(p.reason || "")
      );

      if (urgentCount > 1 || needManagerReview) {
        team.comment =
          "⚠️ 일정 변경이 어렵거나 다수 긴급 사유 발생 → 팀장 판단 필요";
      }

      // 🎨 보기 좋은 텍스트 형태로 변환
      let formattedText = `━━━━━━━━━━━━━━━━━━━\n`;
      for (const person of priorityList) {
        formattedText += `👤 ${person.name}\n`;
        formattedText += `   🟩 상태: ${person.recommendation}\n`;
        formattedText += `   🏷️ 키워드: ${
          /업무 미완료/.test(person.reason)
            ? "미완료 업무"
            : person.recommendation === "승인"
            ? "승인 가능"
            : "기타"
        }\n`;
        formattedText += `   💬 이유: ${person.reason}\n\n`;
      }
      if (team.comment) formattedText += `📝 코멘트: ${team.comment}\n`;
      formattedText += `━━━━━━━━━━━━━━━━━━━`;

      team.formattedText = formattedText.trim();
      return team;
    });

    // ✅ 9️⃣ 응답
    res.status(200).json({
      success: true,
      results: formattedResults,
    });
  } catch (err) {
    console.error("❌ AI 판단 오류:", err);
    res.status(500).json({ message: "AI 판단 중 오류 발생" });
  }
});

module.exports = router;