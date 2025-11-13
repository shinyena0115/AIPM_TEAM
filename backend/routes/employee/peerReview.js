const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { PeerReview, User } = global;

// ✅ 평가 작성
router.post("/", async (req, res) => {
  try {
    const reviewer_id = req.session?.user?.id; // ✅ 로그인 유저 ID
    const { reviewee_id, teamwork, communication, responsibility, comment } = req.body;

    if (!reviewer_id || !reviewee_id) {
      return res.status(400).json({ success: false, message: "평가 대상 또는 로그인 정보가 누락되었습니다." });
    }

    const review = await PeerReview.create({
      reviewer_id,
      reviewee_id,
      teamwork,
      communication,
      responsibility,
      comment,
    });

    res.json({ success: true, review });
  } catch (error) {
    console.error("❌ Peer Review 작성 오류:", error);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});


router.get("/team", async (req, res) => {
  try {
    const userId = req.session?.user?.id; // ✅ 세션에서 가져오기
    if (!userId) return res.status(401).json({ message: "로그인 필요" });

    const currentUser = await User.findByPk(userId);
    if (!currentUser || !currentUser.team_id) {
      return res.status(404).json({ message: "팀 정보가 없습니다." });
    }

    const teammates = await User.findAll({
      where: {
        team_id: currentUser.team_id,
        user_id: { [Op.ne]: userId },
        role: { [Op.ne]: "manager" },        // ✅ 매니저 제외
      },
      attributes: ["user_id", "name", "email", "role"],
    });

    res.json({ data: teammates });
  } catch (error) {
    console.error("❌ 팀원 조회 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 특정 사용자가 받은 평가 조회
router.get("/received/:user_id", async (req, res) => {
  try {
    const user_id = req.params.user_id;
    const reviews = await PeerReview.findAll({
      where: { reviewee_id: user_id },
      include: [{ model: User, as: "Reviewer", attributes: ["name"] }],
    });
    res.json({ reviews });
  } catch (error) {
    console.error("❌ 평가 조회 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

module.exports = router;
