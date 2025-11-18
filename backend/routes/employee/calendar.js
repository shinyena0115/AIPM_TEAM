const express = require("express");
const router = express.Router();

const User = global.User;
const Task = global.Task;
const Vacation = global.Vacation;

/* =========================================================
   📅 개인 일정(업무 + 연차) 조회 API (자신의 것만)
========================================================= */
router.get("/my-events", async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    // ✅ 로그인한 사용자의 ID
    const userId = sessionUser.user_id || sessionUser.id;

    /* ------------------------------
       1️⃣ 내 업무(Task) 조회
    ------------------------------ */
    const tasks = await Task.findAll({
      where: { user_id: userId },
      attributes: ["title", "deadline", "importance", "completed"],
    });

    /* ------------------------------
       2️⃣ 내 연차(Vacation) 조회 (승인된 것만)
    ------------------------------ */
    const vacations = await Vacation.findAll({
      where: {
        user_id: userId,
        status: "승인"  // ✅ 승인된 연차만 표시
      },
      attributes: ["startDate", "endDate", "reason", "status"],
    });

    /* ------------------------------
       3️⃣ 캘린더용 변환
    ------------------------------ */
    const events = [
      ...tasks.map((t) => ({
        title: t.title,
        start: t.deadline,
        end: t.deadline,
        type: "task",
        importance: t.importance,
        completed: t.completed,
      })),
      ...vacations.map((v) => ({
        title: `휴가 (${v.reason})`,
        start: v.startDate,
        end: v.endDate,
        type: "vacation",
        status: v.status,
      })),
    ];

    res.json(events);
  } catch (err) {
    console.error("❌ 개인 캘린더 데이터 조회 실패:", err);
    res.status(500).json({ message: "서버 오류", error: err.message });
  }
});

module.exports = router;
