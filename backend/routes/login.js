const express = require("express");
const router = express.Router();

const User = global.User;

// ✅ 로그인 요청
router.post("/login", async function (req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        success: false,
        message: "이메일과 비밀번호를 입력해주세요.",
      });
    }

    // ✅ 이메일과 비밀번호 확인
    const user = await User.findOne({
      where: { email, password },
      attributes: ["user_id", "name", "email", "role", "status"],
    });

    if (!user) {
      return res.json({
        success: false,
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
      });
    }



    // ✅ 세션 저장
    req.session.user = {
      id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    
    // ✅ 역할별 리다이렉트 경로 설정
    let redirectPath = "/employee/home"; // 기본값: 사원
    if (user.role === "admin" || user.role === "Admin") {
      redirectPath = "/admin/home";
    } else if (user.role === "manager" || user.role === "Manager") {
      redirectPath = "/manager/home";
    }

    // ✅ 로그인 성공 응답
    res.json({
      success: true,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      redirect: redirectPath,
    });
  } catch (err) {
    console.error("❌ 로그인 오류:", err);
    res.status(500).json({ success: false, message: "서버 오류" });
  }
});

// ✅ 로그인된 사용자 정보 조회
router.get("/info", async function (req, res) {
  try {
    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res.json({ isLogin: false, user: null });
    }

    const user = await User.findOne({
      where: { email: sessionUser.email },
      attributes: ["user_id", "name", "email", "role", "status"],
    });

    if (!user) {
      return res.json({ isLogin: false, user: null });
    }

    res.json({ isLogin: true, user });
  } catch (err) {
    console.error("❌ 사용자 정보 조회 오류:", err);
    res.status(500).json({ isLogin: false, user: null });
  }
});

// ✅ 로그아웃
router.post("/logout", function (req, res) {
  req.session.destroy();
  res.json({ success: true });
});

module.exports = router;
