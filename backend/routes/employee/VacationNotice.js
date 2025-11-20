const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// data 파일 위치 (없으면 자동 생성)
const DATA_DIR = path.join(__dirname, '../../data');
const DATA_PATH = path.join(DATA_DIR, 'vacationNotice.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_PATH)) {
    const init = { nextDayTodos: [], replacementEntries: [], seq: 1 };
    fs.writeFileSync(DATA_PATH, JSON.stringify(init, null, 2));
    return init;
  }
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  try {
    return JSON.parse(raw);
  } catch {
    const init = { nextDayTodos: [], replacementEntries: [], seq: 1 };
    fs.writeFileSync(DATA_PATH, JSON.stringify(init, null, 2));
    return init;
  }
}

function saveData(data) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

// 메모리 캐시
let { nextDayTodos, replacementEntries, seq } = ensureDataFile();

// 사용자 식별 (X-User-Id 헤더)
function getUserId(req) {
  const v = (req.headers['x-user-id'] ?? '').toString().trim();
  return v.length ? v : null;
}

function requireUid(req, res) {
  const uid = getUserId(req);
  if (!uid) {
    res.status(400).json({ error: 'X-User-Id header required' });
    return null;
  }
  return uid;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// ===== 기능 1: 개인 복귀 업무 =====

// 생성/업서트
router.post('/next-day-todos', (req, res) => {
  const uid = requireUid(req, res);
  if (!uid) return;
  const { forDate, content } = req.body || {};

  if (!forDate || !DATE_RE.test(forDate)) {
    return res
      .status(400)
      .json({ error: 'forDate must be YYYY-MM-DD' });
  }
  if (!content || !String(content).trim()) {
    return res.status(400).json({ error: 'content required' });
  }

  const idx = nextDayTodos.findIndex(
    (t) => t.ownerId === uid && t.forDate === forDate,
  );
  const now = new Date().toISOString();

  if (idx >= 0) {
    nextDayTodos[idx].content = String(content);
    nextDayTodos[idx].updatedAt = now;
  } else {
    nextDayTodos.push({
      ownerId: uid,
      forDate,
      content: String(content),
      updatedAt: now,
    });
  }

  saveData({ nextDayTodos, replacementEntries, seq });
  res.json({ ok: true });
});

// 조회(본인 것만)
router.get('/next-day-todos', (req, res) => {
  const uid = requireUid(req, res);
  if (!uid) return;

  const { forDate } = req.query || {};
  let rows = nextDayTodos.filter((t) => t.ownerId === uid);
  if (forDate) {
    rows = rows.filter((t) => t.forDate === forDate);
  }
  rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  res.json(rows);
});

// 삭제(특정 날짜)
router.delete('/next-day-todos', (req, res) => {
  const uid = requireUid(req, res);
  if (!uid) return;

  const { forDate } = req.query || {};
  if (!forDate || !DATE_RE.test(forDate)) {
    return res
      .status(400)
      .json({ error: 'forDate must be YYYY-MM-DD' });
  }

  const before = nextDayTodos.length;
  nextDayTodos = nextDayTodos.filter(
    (t) => !(t.ownerId === uid && t.forDate === forDate),
  );
  saveData({ nextDayTodos, replacementEntries, seq });
  res.json({ ok: true, removed: before - nextDayTodos.length });
});

// ===== 기능 2: 업무 대체자 게시판 =====

// 작성(팀원 누구나: 작성자=현재 사용자)
router.post('/replacement', (req, res) => {
  const authorId = requireUid(req, res);
  if (!authorId) return;

  const { leaverId, leaveDate, text } = req.body || {};
  const leaver = (leaverId ?? '').toString().trim();

  if (!leaver) {
    return res
      .status(400)
      .json({ error: 'leaverId required (string)' });
  }
  if (!leaveDate || !DATE_RE.test(leaveDate)) {
    return res
      .status(400)
      .json({ error: 'leaveDate must be YYYY-MM-DD' });
  }

  const row = {
    id: seq++,
    leaverId: leaver,
    leaveDate,
    authorId,
    text: String(text || ''),
    createdAt: new Date().toISOString(),
  };
  replacementEntries.push(row);
  saveData({ nextDayTodos, replacementEntries, seq });
  res.json({ ok: true, id: row.id });
});

// 열람(연차자 본인)
router.get('/replacement', (req, res) => {
  const uid = requireUid(req, res);
  if (!uid) return;

  const { leaveDate } = req.query || {};
  let rows = replacementEntries.filter((e) => e.leaverId === uid);

  if (leaveDate) {
    if (!DATE_RE.test(leaveDate)) {
      return res
        .status(400)
        .json({ error: 'leaveDate must be YYYY-MM-DD' });
    }
    rows = rows.filter((e) => e.leaveDate === leaveDate);
  }

  rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json(rows);
});

// 수정(작성자 본인만)
router.put('/replacement/:id', (req, res) => {
  const uid = requireUid(req, res);
  if (!uid) return;

  const id = Number(req.params.id);
  const { text, leaveDate } = req.body || {};

  const row = replacementEntries.find((e) => e.id === id);
  if (!row) return res.status(404).json({ error: 'not found' });
  if (row.authorId !== uid) {
    return res
      .status(403)
      .json({ error: 'only author can edit' });
  }

  if (leaveDate && !DATE_RE.test(leaveDate)) {
    return res
      .status(400)
      .json({ error: 'leaveDate must be YYYY-MM-DD' });
  }
  if (typeof text !== 'undefined') row.text = String(text);
  if (leaveDate) row.leaveDate = leaveDate;

  saveData({ nextDayTodos, replacementEntries, seq });
  res.json({ ok: true });
});

// 삭제(작성자 본인만)
router.delete('/replacement/:id', (req, res) => {
  const uid = requireUid(req, res);
  if (!uid) return;

  const id = Number(req.params.id);
  const idx = replacementEntries.findIndex((e) => e.id === id);

  if (idx < 0) return res.status(404).json({ error: 'not found' });
  if (replacementEntries[idx].authorId !== uid) {
    return res
      .status(403)
      .json({ error: 'only author can delete' });
  }

  replacementEntries.splice(idx, 1);
  saveData({ nextDayTodos, replacementEntries, seq });
  res.json({ ok: true });
});

// 전체 초기화 (데모 리셋)
router.delete('/all', (_req, res) => {
  nextDayTodos = [];
  replacementEntries = [];
  seq = 1;
  saveData({ nextDayTodos, replacementEntries, seq });
  res.json({ ok: true });
});

module.exports = router;
