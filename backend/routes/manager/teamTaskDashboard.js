const express = require("express");
const router = express.Router();

const { User, Task } = global;

/* =========================================================
   📋 팀별 업무 조회 (팀장용)
========================================================= */
router.get("/team-tasks", async (req, res) => {
  try {
    const sessionUser = req.session?.user;

    // ✅ 로그인 확인
    if (!sessionUser) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    // ✅ 매니저 정보 조회
    const manager = await User.findByPk(sessionUser.user_id || sessionUser.id);
    if (!manager || !manager.team_id) {
      return res.status(400).json({ message: "팀 정보가 없습니다." });
    }

    const teamId = manager.team_id;

    // ✅ 팀의 모든 업무 조회 + 담당자 이름 표시
    const tasks = await Task.findAll({
      include: [
        {
          model: User,
          as: "User", // Task.belongsTo(User, { as: "User", foreignKey: "user_id" })
          where: { team_id: teamId },
          attributes: ["name"], // ✅ 담당자 이름만
        },
      ],
      attributes: [
        "id",
        "title",
        "description",
        "deadline",
        "importance",
        "difficulty",
        "completed",
        "taskType",
        "createdAt",
      ],
      order: [["deadline", "ASC"]],
    });

    

    return res.json(tasks);
  } catch (err) {
    console.error("❌ 팀 업무 조회 실패:", err);
    return res.status(500).json({ message: "서버 오류", error: err.message });
  }
});

module.exports = router;
