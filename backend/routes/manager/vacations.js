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

    res.json({ success: true, message: `연차가 ${status} 처리되었습니다.` });
  } catch (err) {
    console.error("❌ 연차 상태 변경 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});


// =============================
// 3) AI 추천 자동 적용
// =============================
router.post("/ai-apply", async (req, res) => {
  try {
    const { aiResults, rawAI } = req.body;  
    // Vue에서 AI 원문도 같이 보내도록 구성하면 완벽해짐
    // rawAI.priority 안에 진짜 reason이 존재

    if (!aiResults || aiResults.length === 0) {
      return res.json({
        success: false,
        message: "AI 추천 결과가 없습니다."
      });
    }

    for (const item of aiResults) {
      const vacationId = item.vacationId;
      const recommendation = item.recommendation;
      let reason = item.reason || null;

      // 🔥 reason이 비어있다면 AI 원본에서 찾아 자동 매핑
      if (!reason && rawAI?.priority) {
        const found = rawAI.priority.find(p => p.name === item.name);
        if (found && found.reason) {
          reason = found.reason;  // ⬅ AI 원문 reason 복구 성공
        }
      }

      const updateData = { status: recommendation };

      if (recommendation === "반려") {
        updateData.rejection_reason = reason || "사유 없음";
      }

      await Vacation.update(updateData, {
        where: { vacation_id: vacationId }
      });
    }

    res.json({
      success: true,
      message: "AI 추천을 연차 승인/반려에 적용했습니다."
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
