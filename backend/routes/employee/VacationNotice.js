const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');

// ✅ 세션 인증 미들웨어
function requireLogin(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: '로그인이 필요합니다' });
  }
  next();
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ===== 팀원 목록 조회 =====
router.get('/team-members', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id || req.session.user.user_id;
    const currentUser = await User.findByPk(userId);

    if (!currentUser) {
      return res.status(404).json({ error: '사용자를 찾을 수 없습니다' });
    }

    // 같은 팀 또는 같은 부서의 사용자 조회
    const teamMembers = await User.findAll({
      where: {
        [Op.or]: [
          { team_id: currentUser.team_id },
          { department_id: currentUser.department_id }
        ],
        status: 'active', // 활성 사용
      },
      attributes: ['user_id', 'name', 'email', 'vacation_status', 'current_vacation_start', 'current_vacation_end'],
      order: [['name', 'ASC']],
    });

    res.json(teamMembers);
  } catch (error) {
    console.error('❌ 팀원 목록 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// ===== 업무 전달 메모 작성 =====
router.post('/messages', requireLogin, async (req, res) => {
  try {
    const authorId = req.session.user.id || req.session.user.user_id;
    const { leaverId, leaveDate, text } = req.body || {};

    if (!leaverId) {
      return res.status(400).json({ error: '연차자를 선택하세요' });
    }
    if (!leaveDate || !DATE_RE.test(leaveDate)) {
      return res.status(400).json({ error: 'leaveDate must be YYYY-MM-DD' });
    }
    if (!text || !text.trim()) {
      return res.status(400).json({ error: '메모 내용을 입력하세요' });
    }

    const message = await ReplacementEntry.create({
      leaver_id: Number(leaverId),
      leave_date: leaveDate,
      author_id: authorId,
      text: String(text),
    });

    res.json({ ok: true, id: message.id });
  } catch (error) {
    console.error('❌ 메모 작성 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// ===== 내가 받은 업무 전달 조회 (연차자 본인) =====
router.get('/received', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id || req.session.user.user_id;
    const { leaveDate } = req.query || {};

    const where = { leaver_id: userId };
    if (leaveDate && DATE_RE.test(leaveDate)) {
      where.leave_date = leaveDate;
    }

    const messages = await ReplacementEntry.findAll({
      where,
      order: [['leave_date', 'DESC'], ['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'Author',
          attributes: ['user_id', 'name', 'email'],
        },
      ],
    });

    res.json(messages);
  } catch (error) {
    console.error('❌ 받은 메모 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// ===== 내가 작성한 업무 전달 조회 =====
router.get('/sent', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id || req.session.user.user_id;
    const { leaveDate } = req.query || {};

    const where = { author_id: userId };
    if (leaveDate && DATE_RE.test(leaveDate)) {
      where.leave_date = leaveDate;
    }

    const messages = await ReplacementEntry.findAll({
      where,
      order: [['leave_date', 'DESC'], ['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'Leaver',
          attributes: ['user_id', 'name', 'email'],
        },
      ],
    });

    res.json(messages);
  } catch (error) {
    console.error('❌ 작성한 메모 조회 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// ===== 메모 수정 (작성자만) =====
router.put('/messages/:id', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id || req.session.user.user_id;
    const id = Number(req.params.id);
    const { text, leaveDate } = req.body || {};

    const message = await ReplacementEntry.findByPk(id);
    if (!message) {
      return res.status(404).json({ error: '메모를 찾을 수 없습니다' });
    }
    if (message.author_id !== userId) {
      return res.status(403).json({ error: '작성자만 수정할 수 있습니다' });
    }

    if (leaveDate && !DATE_RE.test(leaveDate)) {
      return res.status(400).json({ error: 'leaveDate must be YYYY-MM-DD' });
    }

    if (typeof text !== 'undefined') message.text = String(text);
    if (leaveDate) message.leave_date = leaveDate;

    await message.save();
    res.json({ ok: true });
  } catch (error) {
    console.error('❌ 메모 수정 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

// ===== 메모 삭제 (작성자만) =====
router.delete('/messages/:id', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user.id || req.session.user.user_id;
    const id = Number(req.params.id);

    const message = await ReplacementEntry.findByPk(id);
    if (!message) {
      return res.status(404).json({ error: '메모를 찾을 수 없습니다' });
    }
    if (message.author_id !== userId) {
      return res.status(403).json({ error: '작성자만 삭제할 수 있습니다' });
    }

    await message.destroy();
    res.json({ ok: true });
  } catch (error) {
    console.error('❌ 메모 삭제 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다' });
  }
});

module.exports = router;
