import api from '../api/client';

// Token mở khoá bài kiểm tra theo từng khoá học (sau khi học sinh nhập đúng mã code), lưu ở trình duyệt.
const KEY = 'hsk360.testUnlock';

const readAll = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
};

export const getTestUnlock = (levelId) => readAll()[levelId] || '';

export function forgetTestUnlock(levelId) {
  const all = readAll();
  delete all[levelId];
  localStorage.setItem(KEY, JSON.stringify(all));
}

/** Gửi mã lên server; đúng thì lưu token cho khoá đó. levelId = khoá đang mở (báo lỗi nếu mã của khoá khác). */
export async function unlockTests(code, levelId) {
  const { data } = await api.post('/course-tests/unlock', { code, levelId });
  localStorage.setItem(KEY, JSON.stringify({ ...readAll(), [data.levelId]: data.unlockToken }));
  return data;
}

export const testUnlockHeaders = (levelId) => {
  const token = getTestUnlock(levelId);
  return token ? { 'X-Test-Unlock': token } : {};
};
