// front/src/views/Employee/vacationAuth.js
const KEY = 'auth'; // { userId: string, token?: string }

export function getAuth() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function setUserId(userId) {
  const cur = getAuth();
  const next = { ...cur, userId: String(userId || '').trim() };
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function setToken(token) {
  const cur = getAuth();
  const next = { ...cur, token: String(token || '').trim() };
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearAuth() {
  localStorage.removeItem(KEY);
}

// 지금 요청 헤더 만들기:
// - 토큰 있으면 Authorization: Bearer xxx (미래 로그인과 자연 연계)
// - 토큰 없으면 X-User-Id: userId (현재 MVP 시뮬)
export function getAuthHeaders() {
  const { token, userId } = getAuth();
  if (token) return { Authorization: `Bearer ${token}` };
  if (userId) return { 'X-User-Id': userId };
  return {};
}
