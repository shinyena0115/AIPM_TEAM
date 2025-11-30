var express = require("express");
var router = express.Router();
const { User, Task } = global;

/* =========================================================
   📋 팀별 업무 조회 (팀장용)
========================================================= */
router.get("/team-tasks", async (req, res) => {
  try {
    const sessionUser = req.session?.user;

    // ✅ 1️⃣ 로그인 확인
    if (!sessionUser) {
      return res.status(401).json({ success: false, error: "로그인이 필요합니다." });
    }

    // ✅ 2️⃣ 로그인된 유저 정보 조회
    const manager = await User.findByPk(sessionUser.user_id || sessionUser.id);
    if (!manager || !manager.team_id) {
      return res.status(400).json({ success: false, error: "팀 정보가 없습니다." });
    }

    const teamId = manager.team_id;

    // ✅ 3️⃣ 팀 내 모든 업무 조회 (담당자 이름 포함)
    const tasks = await Task.findAll({
      include: [
        {
          model: User,
          as: "User", // ⚙️ Task.belongsTo(User, { as: "User", foreignKey: "user_id" })
          where: { team_id: teamId },
          attributes: ["name"], // 담당자 이름만 표시
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

    // ✅ 4️⃣ 결과 반환
    return res.json({ success: true, tasks });

  } catch (error) {
    console.error("❌ 팀 업무 조회 실패:", error);
    return res.status(500).json({ success: false, error: "팀 업무 조회 실패: " + error.message });
  }
});



/* =========================================================
   ✏️ 업무 수정 (팀장 + 본인만 수정 가능)
========================================================= */
router.put("/tasks/update/:id", async (req, res) => {

  try {
    const sessionUser = req.session?.user;
    if (!sessionUser) {
      return res.status(401).json({ success: false, error: "로그인이 필요합니다." });
    }

    const task = await Task.findByPk(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: "업무를 찾을 수 없습니다." });
    }

    const loginUser = await User.findByPk(sessionUser.user_id || sessionUser.id);
    const isManager = loginUser.role?.toLowerCase() === "manager";
    // ⚠️ 팀원이면 본인 업무만 수정 가능
    if (!isManager && task.user_id !== loginUser.id) {
      return res.status(403).json({ success: false, error: "수정 권한이 없습니다." });
    }

    // 🔥 받은 데이터 정리
    const {
      title,
      description,
      deadline,
      importance,
      difficulty,
      completed
    } = req.body;

    // ❗ completed → DB에 맞게 0 또는 1로 변환
    const completedValue =
      completed === true || completed === "true" || completed === 1 ? 1 : 0;

    // 🚀 업데이트
    await task.update({
      title,
      description,
      deadline,
      importance,
      difficulty,
      completed: completedValue
    });

    return res.json({ success: true, message: "업무가 수정되었습니다." });

  } catch (error) {
    console.error("❌ 업무 수정 실패:", error);
    return res
      .status(500)
      .json({ success: false, error: "업무 수정 실패: " + error.message });
  }
});






module.exports = router;
