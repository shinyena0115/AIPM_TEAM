const express = require("express");
const router = express.Router();

const Vacation = global.Vacation;
const User = global.User;

// ✅ 같은 팀 직원 연차 목록 조회
router.get("/", async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (
      !sessionUser ||
      !["manager", "Manager", "MANAGER"].includes(sessionUser.role)
    ) {
      return res.json({ success: false, message: "매니저 권한이 필요합니다." });
    }

    // ✅ 매니저 정보 조회
    const manager = await User.findByPk(sessionUser.user_id || sessionUser.id);
    if (!manager) {
      return res.json({ success: false, message: "사용자 정보를 찾을 수 없습니다." });
    }

    // ✅ 같은 팀의 직원들의 연차만 조회
    const vacations = await Vacation.findAll({
      include: [
        {
          model: User,
          as: "user",
          where: { team_id: manager.team_id },
          attributes: ["user_id", "name", "email", "team_id"],
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

// ✅ 연차 승인 / 반려 처리
router.post("/:vacationId/status", async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (
      !sessionUser ||
      !["manager", "Manager", "MANAGER"].includes(sessionUser.role)
    ) {
      return res.json({ success: false, message: "매니저 권한이 필요합니다." });
    }

    const { vacationId } = req.params;
    const { status, rejection_reason } = req.body; // ✅ 반려 사유 추가
   

    if (!["승인", "반려"].includes(status)) {
      return res.json({ success: false, message: "잘못된 상태값입니다." });
    }

    // ✅ 연차 정보 + 직원 정보 조회
    const vacation = await Vacation.findByPk(vacationId, {
      include: [{ model: User, as: "user", attributes: ["team_id"] }],
    });
    if (!vacation) {
      return res.json({ success: false, message: "해당 연차 신청이 존재하지 않습니다." });
    }

    // ✅ 매니저 정보 확인
    const manager = await User.findByPk(sessionUser.user_id || sessionUser.id);
    if (!manager) {
      return res.json({ success: false, message: "사용자 정보를 찾을 수 없습니다." });
    }

    // ✅ 같은 팀인지 검증
    if (vacation.user.team_id !== manager.team_id) {
      return res.json({ success: false, message: "같은 팀 직원만 승인할 수 있습니다." });
    }

     vacation.status = status;
    if (status === "반려") {
      vacation.rejection_reason = rejection_reason || "사유 없음";
    }

    
    // ✅ 상태 업데이트
    vacation.status = status;
    await vacation.save();

    res.json({ success: true, message: `연차가 ${status} 처리되었습니다.` });
  } catch (err) {
    console.error("❌ 연차 상태 변경 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
