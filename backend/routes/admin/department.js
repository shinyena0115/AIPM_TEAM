var express = require("express");
var router = express.Router();

// ✅ 1. 부서 목록 조회
router.post("/list", async (req, res) => {
  try {
    const departmentList = await Department.findAll({
      include: [{ model: Team, as: "Teams" }],
      order: [["id", "ASC"]],
    });

    res.json({ success: true, departmentList });
  } catch (err) {
    console.error("❌ 부서 목록 조회 오류:", err);
    res.json({ success: false, message: "부서 목록 조회 실패" });
  }
});

// ✅ 2. 부서 생성
router.post("/create", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.json({ success: false, message: "부서명이 필요합니다." });

    const department = await Department.create({ name });
    res.json({ success: true, department });
  } catch (err) {
    console.error("❌ 부서 생성 오류:", err);
    res.json({ success: false, message: "부서 생성 실패" });
  }
});

// ✅ 3. 부서 삭제
router.post("/delete", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.json({ success: false, message: "ID가 필요합니다." });

    await Team.destroy({ where: { department_id: id } }); // 팀 먼저 삭제
    await Department.destroy({ where: { id } });           // 부서 삭제

    res.json({ success: true });
  } catch (err) {
    console.error("❌ 부서 삭제 오류:", err);
    res.json({ success: false, message: "부서 삭제 실패" });
  }
});

// ✅ 4. 팀 추가
router.post("/team/create", async (req, res) => {
  try {
    const { name, department_id } = req.body;
    if (!name || !department_id)
      return res.json({ success: false, message: "팀 이름과 부서 ID가 필요합니다." });

    const team = await Team.create({ name, department_id });
    res.json({ success: true, team });
  } catch (err) {
    console.error("❌ 팀 추가 오류:", err);
    res.json({ success: false, message: "팀 추가 실패" });
  }
});

// ✅ 5. 팀 삭제
router.post("/team/delete", async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.json({ success: false, message: "팀 ID가 필요합니다." });

    await Team.destroy({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error("❌ 팀 삭제 오류:", err);
    res.json({ success: false, message: "팀 삭제 실패" });
  }
});

module.exports = router;
