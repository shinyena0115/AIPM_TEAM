var express = require("express");
var router = express.Router();

const { Attendance, User } = global;
const { Op } = require("sequelize");

// ✅ 한국 시간 기준 현재 시각을 HH:MM:SS 포맷으로 반환
function getKSTTime() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 60 * 60 * 1000); // +9시간 (한국)
  return kst.toTimeString().split(" ")[0]; // ✅ "HH:MM:SS"
}

// ✅ 오늘 날짜 (YYYY-MM-DD)
function getKSTDate() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const kst = new Date(utc + 9 * 60 * 60 * 1000);
  return kst.toISOString().split("T")[0];
}

// ✅ 출근 기록
router.post("/checkin", async (req, res) => {
  try {
    const { user_id } = req.body;
    const today = getKSTDate();

    // 이미 출근했는지 확인
    const existing = await Attendance.findOne({ where: { user_id, date: today } });
    if (existing) {
      return res.status(400).json({ message: "이미 출근 기록이 있습니다." });
    }

    // ✅ 출근 시간 "HH:MM:SS" 형식으로 저장
    const newAttendance = await Attendance.create({
      user_id,
      date: today,
      check_in: getKSTTime(),
    });

    res.status(200).json({ message: "출근 기록 완료", attendance: newAttendance });
  } catch (err) {
    console.error("❌ 출근 오류:", err);
    res.status(500).json({ message: "출근 중 오류 발생", error: err.message });
  }
});

// ✅ 퇴근 기록
router.post("/checkout", async (req, res) => {
  try {
    const { user_id } = req.body;
    const today = getKSTDate();

    const attendance = await Attendance.findOne({ where: { user_id, date: today } });

    if (!attendance) {
      return res.status(404).json({ message: "출근 기록이 없습니다." });
    }

    if (attendance.check_out) {
      return res.status(400).json({ message: "이미 퇴근 처리되었습니다." });
    }

    // ✅ 퇴근 시간 "HH:MM:SS" 형식으로 저장
    attendance.check_out = getKSTTime();
    await attendance.save();

    res.status(200).json({ message: "퇴근 기록 완료", attendance });
  } catch (err) {
    console.error("❌ 퇴근 오류:", err);
    res.status(500).json({ message: "퇴근 중 오류 발생", error: err.message });
  }
});

module.exports = router;
