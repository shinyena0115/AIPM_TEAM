const express = require("express");
const router = express.Router();

const Vacation = global.Vacation;
const User = global.User;
const Team = global.Team;

// =============================
// 1) 같은 팀 직원 연차 조회
// =============================
router.get("/", async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser || !["manager", "Manager", "MANAGER"].includes(sessionUser.role)) {
      return res.json({ success: false, message: "매니저 권한이 필요합니다." });
    }

    const manager = await User.findByPk(sessionUser.user_id || sessionUser.id);
    if (!manager) {
      return res.json({ success: false, message: "사용자 정보를 찾을 수 없습니다." });
    }

    const vacations = await Vacation.findAll({
      include: [
        {
          model: User,
          as: "user",
          where: { team_id: manager.team_id },
          attributes: ["user_id", "name", "email", "team_id"],
          include: [{ model: Team, as: "Team", attributes: ["name"] }]
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, vacations });
  } catch (err) {
    console.error("❌ 연차 목록 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});


// =============================
// 2) 연차 승인/반려 처리
// =============================
router.post("/:vacationId/status", async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser || !["manager", "Manager", "MANAGER"].includes(sessionUser.role)) {
      return res.json({ success: false, message: "매니저 권한이 필요합니다." });
    }

    const { vacationId } = req.params;
    const { status, rejection_reason } = req.body;

    if (!["승인", "반려"].includes(status)) {
      return res.json({ success: false, message: "잘못된 상태값입니다." });
    }

    const vacation = await Vacation.findByPk(vacationId, {
      include: [{ model: User, as: "user", attributes: ["team_id"] }],
    });
    if (!vacation) {
      return res.json({ success: false, message: "연차 신청이 존재하지 않습니다." });
    }

    const manager = await User.findByPk(sessionUser.user_id || sessionUser.id);
    if (!manager) {
      return res.json({ success: false, message: "사용자 정보를 찾을 수 없습니다." });
    }

    if (vacation.user.team_id !== manager.team_id) {
      return res.json({ success: false, message: "같은 팀 직원만 승인할 수 있습니다." });
    }

    vacation.status = status;
    if (status === "반려") {
      vacation.rejection_reason = rejection_reason || "사유 없음";
    }
    await vacation.save();

    // ✅ 연차 승인 시 사용자 vacation_status 자동 업데이트
    if (status === "승인") {
      const today = new Date().toISOString().split('T')[0];
      const vacationStart = vacation.startDate;
      const vacationEnd = vacation.endDate;

      // 오늘이 연차 기간 내에 있으면 즉시 '연차중'으로 설정
      if (today >= vacationStart && today <= vacationEnd) {
        await User.update(
          {
            vacation_status: "연차중",
            current_vacation_start: vacationStart,
            current_vacation_end: vacationEnd,
          },
          { where: { user_id: vacation.user_id } }
        );
      } else if (today < vacationStart) {
        // 미래 연차인 경우 날짜 정보만 저장 (크론 작업이나 출근 체크에서 자동 전환)
        await User.update(
          {
            current_vacation_start: vacationStart,
            current_vacation_end: vacationEnd,
          },
          { where: { user_id: vacation.user_id } }
        );
      }
    }

    res.json({ success: true, message: `연차가 ${status} 처리되었습니다.` });
  } catch (err) {
    console.error("❌ 연차 상태 변경 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});


// =============================
// 3) AI 추천 자동 적용 (팀장 판단 항목 제외)
// =============================
router.post("/ai-apply", async (req, res) => {
  try {
    const { aiResults } = req.body;

    if (!aiResults || aiResults.length === 0) {
      return res.json({
        success: false,
        message: "AI 추천 결과가 없습니다."
      });
    }

    for (const item of aiResults) {
      const { name, vacationId, recommendation, reason } = item;

      // 🔥 1) 팀장 판단 필요 → 자동 적용 제외
      if (recommendation === "팀장 판단 필요") continue;

      // 🔥 2) 사유에 팀장 판단 필요 관련 문구 포함 시 제외
      const skipKeywords = ["팀장 판단"];
      const reasonText = (reason || "").toLowerCase();

      const shouldSkip = skipKeywords.some(keyword =>
        reasonText.includes(keyword.toLowerCase())
      );

      if (shouldSkip) continue;

      // 🔥 3) vacationId로 조회 시도
      let vacation = null;
      if (vacationId) {
        vacation = await Vacation.findByPk(vacationId);
      }

      // 🔥 4) 없으면 이름 기반 최신 대기 연차 조회
      if (!vacation) {
        vacation = await Vacation.findOne({
          include: [
            {
              model: User,
              as: "user",
              where: { name },
              attributes: []
            }
          ],
          where: { status: "대기" },
          order: [["createdAt", "DESC"]]
        });
      }

      if (!vacation) continue; // 못찾으면 스킵

      // 🔥 5) 추천 반영
      const updateData = { status: recommendation };

      if (recommendation === "반려") {
        updateData.rejection_reason = reason || "사유 없음";
      }

      await vacation.update(updateData);

      // ✅ 연차 승인 시 사용자 vacation_status 자동 업데이트
      if (recommendation === "승인") {
        const today = new Date().toISOString().split('T')[0];
        const vacationStart = vacation.startDate;
        const vacationEnd = vacation.endDate;

        // 오늘이 연차 기간 내에 있으면 즉시 '연차중'으로 설정
        if (today >= vacationStart && today <= vacationEnd) {
          await User.update(
            {
              vacation_status: "연차중",
              current_vacation_start: vacationStart,
              current_vacation_end: vacationEnd,
            },
            { where: { user_id: vacation.user_id } }
          );
        } else if (today < vacationStart) {
          // 미래 연차인 경우 날짜 정보만 저장
          await User.update(
            {
              current_vacation_start: vacationStart,
              current_vacation_end: vacationEnd,
            },
            { where: { user_id: vacation.user_id } }
          );
        }
      }
    }

    res.json({
      success: true,
      message: "AI 추천을 연차 승인/반려에 적용했습니다. (팀장 판단 항목 제외)"
    });
  } catch (error) {
    console.error("[AI 자동 적용 error]", error);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});







// =============================
// 라우터 내보내기
// =============================
module.exports = router;
