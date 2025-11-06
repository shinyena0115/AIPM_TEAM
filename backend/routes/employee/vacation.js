const express = require("express");
const router = express.Router();

const Vacation = global.Vacation; // model.js에 정의 필요
const User = global.User;

// ✅ 본인 연차 내역 조회
router.get("/me", async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser) return res.json({ success: false, message: "로그인이 필요합니다." });

    const vacations = await Vacation.findAll({
      where: { user_id: sessionUser.id },
      order: [["createdAt", "DESC"]],
    });

    res.json({ success: true, vacations });
  } catch (err) {
    console.error("❌ 연차 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ✅ 연차 신청
router.post("/", async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser) return res.json({ success: false, message: "로그인이 필요합니다." });

    const { startDate, endDate, reason } = req.body;

    await Vacation.create({
      user_id: sessionUser.id,
      startDate,
      endDate,
      reason,
      status: "대기", // 기본값
    });

    res.json({ success: true, message: "연차 신청 완료" });
  } catch (err) {
    console.error("❌ 연차 신청 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ✅ 연차 현황 요약 (이재혁)
router.get("/status", async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser) return res.json({ success: false, message: "로그인이 필요합니다." });

    // 승인된 연차만 조회
    const vacations = await Vacation.findAll({
      where: {
        user_id: sessionUser.id,
        status: "승인"
      }
    });

    // 사용한 연차 일수 계산
    let usedDays = 0;
    vacations.forEach(v => {
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
      usedDays += days;
    });

    const totalDays = 15; // 기본 연차 15일
    const remainingDays = totalDays - usedDays;

    res.json({
      success: true,
      status: {
        totalDays,
        usedDays,
        remainingDays
      }
    });
  } catch (err) {
    console.error("❌ 연차 현황 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ✅ 연차 사용 내역 상세 (이재혁)
router.get("/history", async (req, res) => {
  try {
    const sessionUser = req.session.user;
    if (!sessionUser) return res.json({ success: false, message: "로그인이 필요합니다." });

    const vacations = await Vacation.findAll({
      where: { user_id: sessionUser.id },
      order: [["startDate", "DESC"]]
    });

    // 각 연차에 일수 추가
    const history = vacations.map(v => {
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

      return {
        vacation_id: v.vacation_id,
        startDate: v.startDate,
        endDate: v.endDate,
        days: days,
        reason: v.reason,
        status: v.status,
        rejection_reason: v.rejection_reason,
        createdAt: v.createdAt
      };
    });

    res.json({ success: true, history });
  } catch (err) {
    console.error("❌ 연차 내역 조회 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

module.exports = router;
