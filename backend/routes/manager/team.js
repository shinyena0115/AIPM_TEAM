const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { User, Team } = global;

// GET /api/manager/team-members
router.get("/team-members", async (req, res) => {
  try {
    const sessionUser = req.session?.user;

    console.log("🔥 세션 유저:", sessionUser);

    if (!sessionUser) {
      return res.status(401).json({ success: false, error: "로그인 필요" });
    }

    // 🎯 핵심 해결
    const userId = sessionUser.user_id || sessionUser.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "세션에 user_id가 없습니다.",
      });
    }

    const manager = await User.findOne({
      where: { user_id: userId },
      include: [{ model: Team, as: "Team" }],
    });

    if (!manager || !manager.Team) {
      return res.json({ success: false, error: "팀 정보 없음" });
    }

    const members = await User.findAll({
      where: {
        team_id: manager.team_id,
        role: { [Op.ne]: "Manager" },
      },
      attributes: ["user_id", "name", "email", "role"],
    });

    res.json({
      success: true,
      team: manager.Team.name,
      members,
    });

  } catch (err) {
    console.error("❌ team-members 오류:", err);
    res.status(500).json({ success: false, error: "서버 오류" });
  }
});

module.exports = router;
