var express = require("express");
var router = express.Router();
var OpenAI = require("openai");
var openaiClient = new OpenAI();
const { Op } = require("sequelize");
const { User, Team, Task, Vacation, Attendance, PeerReview } = global;

// -------------------------------------------------------------
// 권한: 관리자/매니저 또는 본인만 수행 가능
// -------------------------------------------------------------
function canRequestEvaluator(sessionUser, targetUserId) {
  if (!sessionUser) return false;
  if (["Admin", "Manager"].includes(sessionUser.role)) return true;
  return sessionUser.id === Number(targetUserId);
}

// -------------------------------------------------------------
// 퍼센타일 계산 (정확한 Percent Rank 공식으로 수정)
// -------------------------------------------------------------
function percentile(arr, val) {
  if (!arr || arr.length === 0) return 50;

  const sorted = arr.slice().sort((a, b) => a - b);

  // val 이하의 값 개수
  const count = sorted.filter(x => x <= val).length;

  return Math.round((count / sorted.length) * 100);
}


// ==========================================================
// 🔥 0) /evaluate → /analyze-performance 자동 매핑
// ==========================================================
router.post("/evaluate", (req, res, next) => {
  req.url = "/analyze-performance";
  next();
});

// ==========================================================
// ⭐ 매니저 전용 팀원 조회 API (프론트 요구 경로)
//    → GET /api/manager/team-members
// ==========================================================
router.get("/manager/team-members", async (req, res) => {
  try {
    const sessionUser = req.session?.user;

    if (!sessionUser) {
      return res.status(401).json({
        success: false,
        error: "로그인 필요",
      });
    }

    // 현재 로그인한 매니저 정보
    const manager = await User.findOne({
      where: { user_id: sessionUser.user_id },
      include: [{ model: Team, as: "Team" }],
    });

    if (!manager || !manager.Team) {
      return res.json({
        success: false,
        error: "팀 정보 없음",
      });
    }

    // 매니저와 동일한 팀 소속 팀원 조회
    const members = await User.findAll({
      where: {
        team_id: manager.team_id,
        role: { [Op.ne]: "manager" }, // 매니저 본인은 제외
      },
      attributes: ["user_id", "name", "position", "email"],
    });

    return res.json({
      success: true,
      team: manager.Team.name,
      members,
    });
  } catch (err) {
    console.error("❌ /manager/team-members 오류:", err);
    res.status(500).json({
      success: false,
      error: "서버 오류",
    });
  }
});


// ==========================================================
// 🔥 AI 인사평가 통합 라우터
//    → /api/ai/performance/analyze-performance
// ==========================================================
router.post("/analyze-performance", async (req, res) => {
  try {
    const sessionUser = req.session.user;
    const targetUserId = req.body.target_user_id;

    if (!sessionUser)
      return res.status(401).json({ success: false, error: "로그인이 필요합니다." });

    if (!targetUserId)
      return res.json({ success: false, error: "target_user_id 필요" });

    if (!canRequestEvaluator(sessionUser, targetUserId)) {
      return res.status(403).json({ success: false, error: "권한 없음" });
    }
   // -------------------------------------------------------------
   // 📌 여기 추가!!! (기간 파라미터 필수)
   // -------------------------------------------------------------
    
    const start = req.body.start || req.body.periodStart;
    const end = req.body.end || req.body.periodEnd;
    if (!start || !end) {
      return res.json({
      success: false,
      error: "start, end(기간)이 필요합니다.",
    });
    }

    const periodStart = new Date(start);
    const periodEnd = new Date(end);

    // -------------------------------------------------------------
    // 1) 사용자 + 팀 정보
    // -------------------------------------------------------------
    const user = await User.findOne({
      where: { user_id: targetUserId },
      include: [{ model: Team, as: "Team" }],
    });

    if (!user) return res.json({ success: false, error: "사용자 찾을 수 없음" });

    const teamId = user.team_id;
    const teamMembers = teamId
      ? await User.findAll({ where: { team_id: teamId } })
      : [];

    // -------------------------------------------------------------
    // 2) 데이터 로딩
    // -------------------------------------------------------------
    const tasks = await Task.findAll({
  where: {
    user_id: targetUserId,
    deadline: {
      [Op.between]: [periodStart, periodEnd]
    }
  }
});
    const vacations = await Vacation.findAll({
  where: {
    user_id: targetUserId,
    [Op.or]: [
      {
        startDate: { [Op.between]: [periodStart, periodEnd] }
      },
      {
        endDate: { [Op.between]: [periodStart, periodEnd] }
      },
      {
        startDate: { [Op.lte]: periodStart },
        endDate: { [Op.gte]: periodEnd }
      }
    ]
  }
});

    const attendances = await Attendance.findAll({
  where: {
    user_id: targetUserId,
    date: {
      [Op.between]: [periodStart, periodEnd]
    }
  }
});
    const peerReviews = await PeerReview.findAll({
  where: {
    reviewee_id: targetUserId,
    createdAt: {
      [Op.between]: [periodStart, periodEnd]
    }
  }
});

// -------------------------------------------------------------
// 🔥 2-1) Attendance 상세 분석 (출퇴근 자동 판정 활용) — 최종 안정 버전
// -------------------------------------------------------------
let normalCount = 0;
let lateCountUser = 0;
let earlyLeaveCount = 0;
let overtimeCount = 0;

attendances.forEach(a => {
  if (!a || !a.status) return;

  // 상태 문자열을 정확히 분리
  const states = a.status
    .split(",")        // "정상, 야근" → ["정상", "야근"]
    .map(s => s.trim()) // 공백 제거
    .filter(Boolean);   // 빈 문자열 제거

  for (const s of states) {
    switch (s) {
      case "정상":
        normalCount++;
        break;
      case "지각":
        lateCountUser++;
        break;
      case "조퇴":
        earlyLeaveCount++;
        break;
      case "야근":
        overtimeCount++;
        break;
      default:
        // 그 외 문자열은 무시 (오염 데이터 대비)
        break;
    }
  }
});

// 결과 내보내기
const attendanceDetails = {
  normal: normalCount,
  late: lateCountUser,
  earlyLeave: earlyLeaveCount,
  overtime: overtimeCount
};

   // -------------------------------------------------------------
// 휴가일수 → 승인된 휴가만 계산
// -------------------------------------------------------------
let vacationDays = 0;

vacations.forEach(v => {
  // 여기 또한 status는 "승인"
  if (v.status !== "승인") return;

  const s = new Date(v.startDate);
  const e = new Date(v.endDate);

  vacationDays += Math.round((e - s) / (1000 * 3600 * 24)) + 1;
});

    // -------------------------------------------------------------
    // 3) 팀 전체 정량 기준 수집 (퍼센타일용)
    // -------------------------------------------------------------
    let teamTaskRates = [];
    let teamDeadlineRates = [];
    let teamAttendanceCounts = [];

    for (const tm of teamMembers) {
      const tmTasksAll = await Task.findAll({
  where: {
    user_id: tm.user_id,
    deadline: {
      [Op.between]: [periodStart, periodEnd]
    }
  }
});

      const total = tmTasksAll.length;
      const completed = tmTasksAll.filter(t => t.completed).length;
      teamTaskRates.push(total === 0 ? 0 : Math.round((completed / total) * 100));

      let done = 0;
      let onTime = 0;
      tmTasksAll.forEach(t => {
        if (t.completed && t.completedAt) {
          done++;
          if (new Date(t.completedAt) <= new Date(t.deadline)) onTime++;
        }
      });
      teamDeadlineRates.push(done === 0 ? 0 : Math.round((onTime / done) * 100));

      const att = await Attendance.count({ where: { user_id: tm.user_id } });
      teamAttendanceCounts.push(att);
    }

    // -------------------------------------------------------------
    // 4) 대상자 정량 지표 계산
    // -------------------------------------------------------------
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const taskCompletionRate =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    let done = 0,
      onTime = 0,
      lateDaysSum = 0,
      lateCount = 0;

    tasks.forEach(t => {
      if (t.completed && t.completedAt) {
        done++;
        if (new Date(t.completedAt) <= new Date(t.deadline)) onTime++;

        const diff =
          (new Date(t.completedAt) - new Date(t.deadline)) /
          (1000 * 3600 * 24);
        if (diff > 0) {
          lateDaysSum += diff;
          lateCount++;
        }
      }
    });

    const onTimeRate = done === 0 ? 0 : Math.round((onTime / done) * 100);
    
    const attendanceCount = attendances.length;

    let checkInList = [];
    attendances.forEach(a => {
      if (a.check_in) {
        const [h, m] = a.check_in.split(":");
        checkInList.push(Number(h) * 60 + Number(m));
      }
    });

    const avgCheckInMin = checkInList.length
      ? Math.round(checkInList.reduce((s, v) => s + v, 0) / checkInList.length)
      : null;

    const avgCheckIn =
      avgCheckInMin === null
        ? null
        : `${String(Math.floor(avgCheckInMin / 60)).padStart(2, "0")}:${String(
            avgCheckInMin % 60
          ).padStart(2, "0")}`;

   

    // 동료평가 평균
    const peerCount = peerReviews.length;
    let teamworkAvg = 0,
      communicationAvg = 0,
      responsibilityAvg = 0;

    if (peerCount > 0) {
      teamworkAvg =
        peerReviews.reduce((s, r) => s + r.teamwork, 0) / peerCount;
      communicationAvg =
        peerReviews.reduce((s, r) => s + r.communication, 0) / peerCount;
      responsibilityAvg =
        peerReviews.reduce((s, r) => s + r.responsibility, 0) / peerCount;
    }

    const peerAvg = peerCount
      ? (teamworkAvg + communicationAvg + responsibilityAvg) / 3
      : 0;

    // -------------------------------------------------------------
    // 5) 퍼센타일 계산
    // -------------------------------------------------------------
    const taskPercentile = percentile(teamTaskRates, taskCompletionRate);
    const deadlinePercentile = percentile(teamDeadlineRates, onTimeRate);
    const attendancePercentile = percentile(
      teamAttendanceCounts,
      attendanceCount
    );

    // -------------------------------------------------------------
    // 6) 고정 공식으로 점수 계산
    // -------------------------------------------------------------
    const taskScore = taskCompletionRate * 0.3;
    const deadlineScore = onTimeRate * 0.25;
    const attendanceScore = attendancePercentile * 0.15;

    let vacationScore = 5;
    if (vacationDays > 15) vacationScore -= (vacationDays - 15) * 0.2;
    if (vacationScore < 0) vacationScore = 0;

    const peerNorm = peerCount ? ((peerAvg - 1) / 4) * 100 : 0;
    const peerScore = peerNorm * 0.25;

    let finalScore =
      taskScore + deadlineScore + attendanceScore + vacationScore + peerScore;

    if (finalScore > 100) finalScore = 100;
    if (finalScore < 0) finalScore = 0;

    // 등급
    let recommendedGrade = "C";
    if (finalScore >= 90) recommendedGrade = "A";
    else if (finalScore >= 75) recommendedGrade = "B";
    else if (finalScore >= 60) recommendedGrade = "C";
    else recommendedGrade = "D";

  // -------------------------------------------------------------
// 7) AI 프롬프트 (팀장 스타일 + HR 검토용 평가 코멘트)
// -------------------------------------------------------------
const prompt = `
당신은 실제 팀장이며 동시에 HR 인사평가 전문가입니다.

⚠ 절대 점수/등급을 재계산하지 마세요.
서버에서 계산된 recommended_score와 recommended_grade를 그대로 사용하세요.

목표:
팀장이 팀원에게 주는 자연스러운 평가 코멘트를 생성하되,
상위 관리자(HR/본부장)도 검토 가능한 객관적인 문체로 작성하세요.
강점과 약점은 반드시 '정량지표' 또는 '동료평가' 기반으로 구체적 이유를 포함하세요.

=== 사전 계산된 평가 결과 ===
recommended_score: ${finalScore}
recommended_grade: ${recommendedGrade}

=== 정량 지표 ===
총 업무: ${totalTasks}
완료 업무: ${completedTasks}
업무 완료율: ${taskCompletionRate}%
마감 준수율: ${onTimeRate}%
출근 횟수: ${attendanceCount}
평균 체크인: ${avgCheckIn || "N/A"}
휴가일수: ${vacationDays}

=== 동료평가 평균(1~5) ===
협업: ${teamworkAvg.toFixed(1)}
커뮤니케이션: ${communicationAvg.toFixed(1)}
책임감: ${responsibilityAvg.toFixed(1)}
평균: ${peerAvg.toFixed(1)}
평가 개수: ${peerCount}

=== 팀 내 퍼센타일 ===
업무완료율: ${taskPercentile}%
마감준수율: ${deadlinePercentile}%
출근수: ${attendancePercentile}%

작성 규칙:
- 모든 코멘트는 "팀장이 팀원에게 피드백하는 톤"으로 작성하세요.
- 공격적 표현, 감정적 표현, 확정적 비난은 절대 금지.
- 강점은 3~5개, 약점은 2~3개 작성하세요.
- recommended_actions는 구체적 행동 가이드를 3개 생성하세요.
- evidence는 "정량 기반 분석을 한 문장"으로 작성하세요.
- final_comment는 3~4문장 길이의 해당 팀원의 총평으로 작성하세요.
- JSON 이외의 문장은 절대 출력하지 마세요.

JSON 형식으로 다음을 생성하세요:
{
  "overall_score": number,
  "performance_grade": string,
  "strengths": [],
  "weaknesses": [],
  "recommended_actions": [],
  "evidence": "",
  "final_comment": ""
}
`;

// 🔽🔥 프롬프트 로그 출력
console.log("\n==============================");
console.log("📤 [AI 요청 프롬프트]");
console.log(prompt);
console.log("==============================\n");

const aiResp = await openaiClient.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    { role: "system", content: "당신은 HR 인사평가 전문가입니다." },
    { role: "user", content: prompt },
  ],
});
let aiText = aiResp.choices[0].message.content;

// 코드블록 제거
aiText = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

console.log("\n==============================");
console.log("📥 [AI 응답 원본]");
console.log(aiText);
console.log("==============================\n");

let evaluation;
try {
  evaluation = JSON.parse(aiText);

  console.log("\n==============================");
  console.log("📊 [AI JSON 파싱 결과]");
  console.log(evaluation);
  console.log("==============================\n");

} catch (err) {
  console.log("⚠️ JSON 파싱 실패 → raw 저장");
  evaluation = { raw: aiText };
}



   

    // -------------------------------------------------------------
    // 8) 응답
    // -------------------------------------------------------------
    return res.json({
      success: true,
      target_user: {
        user_id: user.user_id,
        name: user.name,
        team: user.Team?.name || null,
      },
      raw_metrics: {
        totalTasks,
        completedTasks,
        taskCompletionRate,
        onTimeRate,
        attendanceCount,
        avgCheckIn,
        vacationDays,
        teamworkAvg,
        communicationAvg,
        responsibilityAvg,
        peerAvg,
      },
       // 🔥 여기 추가!!!!
      attendanceDetails: {
      normal: normalCount,
      late: lateCountUser,
      earlyLeave: earlyLeaveCount,
      overtime: overtimeCount
      },

      percentiles: {
        taskPercentile,
        deadlinePercentile,
        attendancePercentile,
      },
      recommended_score: finalScore,
      recommended_grade: recommendedGrade,
      evaluation,
    });
  } catch (error) {
    console.error("AI 성과분석 오류:", error);
    return res.json({ success: false, error: error.message });
  }
});

module.exports = router;


