var express = require('express');
var router = express.Router();
const Task = global.Task;

// CORS 설정
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

/* =========================================================
   1. 자신의 모든 업무 조회 (로그인한 사용자만)
========================================================= */
router.get('/', async (req, res) => {
  try {
    const userId = req.session?.user?.id; // 세션에서 로그인한 사용자 ID 확인
    if (!userId) {
      return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });
    }

    // 자신이 등록한 업무만 조회
    const tasks = await Task.findAll({
      where: { user_id: userId },
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, tasks });
  } catch (error) {
    console.error('❌ 업무 조회 오류:', error);
    res.status(500).json({ success: false, error: '업무 조회 실패' });
  }
});


/* =========================================================
   2. 업무 생성
========================================================= */
router.post('/', async (req, res) => {
  try {
    const userId = req.session?.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: '로그인이 필요합니다.' });

    const { title, deadline, estimated_time, difficulty, taskType, importance } = req.body;

    if (!title || !deadline || !estimated_time || !difficulty || !taskType || !importance) {
      return res.status(400).json({ success: false, error: '필수 데이터 누락' });
    }

    const newTask = await Task.create({
      user_id: userId,
      title,
      deadline,
      estimated_time,
      difficulty,
      taskType,
      importance,
      completed: false
    });

    console.log('✅ 업무 생성 완료:', newTask.dataValues);
    res.json({ success: true, task: newTask });

  } catch (error) {
    console.error('❌ 업무 생성 오류:', error);
    res.status(500).json({ success: false, error: '업무 생성 실패: ' + error.message });
  }
});

/* =========================================================
   3. 업무 완료 처리
========================================================= */
router.patch('/:id/complete', async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.json({ success: false, error: '업무를 찾을 수 없습니다' });

    task.completed = true;
    task.completedAt = new Date();
    await task.save();

    res.json({ success: true, task });
  } catch (error) {
    console.error('❌ 완료 처리 오류:', error);
    res.json({ success: false, error: '완료 처리 실패' });
  }
});

/* =========================================================
   4. 업무 우선순위 변경 (AI 결과 반영)
========================================================= */
router.patch('/:id/priority', async (req, res) => {
  try {
    const { importance } = req.body;
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.json({ success: false, error: '업무를 찾을 수 없습니다' });

    task.importance = importance;
    await task.save();

    res.json({ success: true, task });
  } catch (error) {
    console.error('❌ 우선순위 변경 오류:', error);
    res.json({ success: false, error: '우선순위 변경 실패' });
  }
});

/* =========================================================
   5. 업무 삭제
========================================================= */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Task.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.json({ success: false, error: '삭제할 업무를 찾을 수 없습니다' });
    res.json({ success: true });
  } catch (error) {
    console.error('❌ 업무 삭제 오류:', error);
    res.json({ success: false, error: '삭제 실패' });
  }
});

module.exports = router;
