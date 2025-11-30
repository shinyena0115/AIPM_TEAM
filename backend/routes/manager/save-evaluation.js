var express = require("express");
var router = express.Router();
const { PerformanceEvaluation } = global;   // 모델 있어야 함

router.post("/save-evaluation", async (req, res) => {
  try {
    const { user_id, periodStart, periodEnd, evaluation } = req.body;

const evaluator_id = req.session?.user?.id;
if (!evaluator_id) {
  return res.json({ success: false, error: "로그인이 필요합니다." });
}

const [record, created] = await PerformanceEvaluation.findOrCreate({
  where: {
    user_id,
    evaluator_id,
    period_start: periodStart,   // 수정
    period_end: periodEnd        // 수정
  },
  defaults: {
    period_start: periodStart,   // 추가
    period_end: periodEnd,       // 추가
    final_comment: evaluation.final_comment,
    strengths: evaluation.strengths,
    weaknesses: evaluation.weaknesses,
    recommended_actions: evaluation.recommended_actions,
    recommended_score: evaluation.recommended_score,
    recommended_grade: evaluation.recommended_grade,
    manual_score: evaluation.manual_score,   // manualScore → manual_score
    manual_grade: evaluation.manual_grade
  }
});

if (!created) {
  await record.update({
    final_comment: evaluation.final_comment,
    strengths: evaluation.strengths,
    weaknesses: evaluation.weaknesses,
    recommended_actions: evaluation.recommended_actions,
    recommended_score: evaluation.recommended_score,
    recommended_grade: evaluation.recommended_grade,
    manual_score: evaluation.manual_score,
    manual_grade: evaluation.manual_grade
  });
}

    return res.json({ success: true, message: "저장 완료" });
  } catch (err) {
    console.error("❌ [AI 평가 저장 오류]", err);
    return res.status(500).json({ success: false, error: "서버 오류" });
  }
});
module.exports = router;
