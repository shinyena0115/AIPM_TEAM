var express = require("express");
var router = express.Router();

// ✅ app.js에서 global로 등록된 모델 사용 가능
const { User, Department, Team } = global;

// ✅ 전체 사원 목록 조회 (부서/팀 포함)
router.get("/", async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["user_id", "name", "email", "role", "status"],
      include: [
        { model: Department, as: "Department", attributes: ["name"] },
        { model: Team, as: "Team", attributes: ["name"] },
      ],
      order: [["user_id", "ASC"]],
    });

    // ✅ JSON 변환 시 Department.name, Team.name을 간단히 표시
    const formatted = users.map((u) => ({
      user_id: u.user_id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      department: u.Department ? u.Department.name : "-",
      team: u.Team ? u.Team.name : "-",
    }));

    res.json(formatted);
  } catch (error) {
    console.error("사원 목록 조회 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});

// ✅ 권한 변경
router.put("/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    const { id } = req.params;

    if (!["Employee", "Manager", "Admin"].includes(role)) {
      return res.status(400).json({ message: "잘못된 권한 값" });
    }

    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: "사용자 없음" });

    user.role = role;
    await user.save();

    res.json({ message: "권한이 변경되었습니다.", user });
  } catch (error) {
    console.error("권한 변경 오류:", error);
    res.status(500).json({ message: "서버 오류" });
  }
});



module.exports = router;
