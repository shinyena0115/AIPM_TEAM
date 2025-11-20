const express = require("express");
 //const bcrypt = require("bcrypt");
const router = express.Router();

const { User, Department, Team } = global;

// ======================================
// ✅ 부서 + 팀 목록 불러오기
// (회원가입 페이지 드롭다운용)
// ======================================
router.get("/options", async (req, res) => {
  try {
    const departments = await Department.findAll({
      include: [
        {
          model: Team,
          as: "Teams",
          attributes: ["id", "name"],
        },
      ],
      attributes: ["id", "name"],
      order: [["id", "ASC"]],
    });

    res.json({ success: true, departments });
  } catch (error) {
    console.error("❌ 부서/팀 조회 오류:", error);
    res.status(500).json({ success: false, message: "부서 데이터를 불러오지 못했습니다." });
  }
});

// ======================================
// ✅ 회원가입 요청 처리
// ======================================
router.post("/", async (req, res) => {
  try {
    const { name, email, password, department_id, team_id } = req.body;

    // 필드 유효성 검사
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "필수 정보를 모두 입력해주세요." });
    }

    // 이메일 중복 확인
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "이미 등록된 이메일입니다." });
    }

    // 비밀번호 해싱
     //const hashedPassword = await bcrypt.hash(password, 10);

    // 신규 사용자 생성 (기본 status: active)
    const newUser = await User.create({
      name,
      email,
      password,
      department_id: department_id || null,
      team_id: team_id || null,
      role: "Employee",
      status: "active",
    });

    res.json({ success: true, message: "회원가입 신청 완료", userId: newUser.user_id });
  } catch (error) {
    console.error("❌ 회원가입 오류:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
});

module.exports = router;
