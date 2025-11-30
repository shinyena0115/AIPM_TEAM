const express = require("express");
const router = express.Router();

const User = global.User;
const Task = global.Task;
const Vacation = global.Vacation;

/* =========================================================
   📅 팀 일정(업무 + 연차) 조회 API (승인된 연차만)
========================================================= */
router.get("/team-events", async (req, res) => {
  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    // ✅ 로그인한 매니저의 팀 ID 확인
    const manager = await User.findByPk(sessionUser.user_id || sessionUser.id);
    if (!manager || !manager.team_id) {
      return res.status(400).json({ message: "팀 정보가 없습니다." });
    }

    const teamId = manager.team_id;

    /* ------------------------------
       1️⃣ 팀원 업무(Task) 조회
    ------------------------------ */
    const tasks = await Task.findAll({
      include: [
        {
          model: User,
          as: "User",
          where: { team_id: teamId },
          attributes: ["name"],
        },
      ],
        attributes: ["title", "deadline", "completed", "importance"],
    });

    /* ------------------------------
       2️⃣ 승인된 연차(Vacation) 조회
    ------------------------------ */
    const vacations = await Vacation.findAll({
      where: { status: "승인" }, // ✅ 승인된 연차만
      include: [
        {
          model: User,
          as: "user",
          where: { team_id: teamId },
          attributes: ["name"],
        },
      ],
      attributes: ["startDate", "endDate", "reason", "status"],
    });




    /* ------------------------------
       3️⃣ 캘린더용 변환
    ------------------------------ */
     const events = [
      ...tasks.map((t) => ({
        type: "task",
        username: t.User.name,
        title: t.title,
        start: t.deadline,
        end: t.deadline,
        completed: t.completed,
        importance: t.importance,
      })),
      ...vacations.map((v) => ({
        type: "vacation",
        username: v.user.name,
        reason: v.reason,
        start: v.startDate,
        end: v.endDate,
      })),
    ];


    res.json(events);
  } catch (err) {
    console.error("❌ 캘린더 데이터 조회 실패:", err);
    res.status(500).json({ message: "서버 오류", error: err.message });
  }
});

module.exports = router;
