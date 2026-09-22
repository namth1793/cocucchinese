const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Engine lưu trữ dạng file JSON - dùng khi KHÔNG khai báo DATABASE_URL (mặc định,
 * phù hợp máy dev chưa cài PostgreSQL). Toàn bộ hàm bên dưới trả về Promise dù xử
 * lý bên trong vẫn đồng bộ, để có cùng chữ ký gọi (`await db.xxx(...)`) như
 * `postgresStore.js` - route/middleware không cần biết đang chạy engine nào.
 *
 * Xem README mục "Cơ sở dữ liệu" - engine này chỉ phù hợp demo/dự án nhỏ vì mỗi
 * lần ghi phải lưu lại toàn bộ file xuống đĩa.
 */
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

const COLLECTIONS = [
  'users', 'levels', 'lessons', 'topics', 'words', 'grammarPoints',
  'sentences', 'characters', 'dialogues', 'speakingScenarios', 'fillExercises',
  'images', 'slides', 'slideProgress', 'songs', 'videos', 'examPapers',
  'progress', 'flashcardStatus', 'activityLogs', 'instructors',
  'enrollments', 'orders', 'migrations'
];

function emptyDb() {
  const db = {};
  COLLECTIONS.forEach((c) => { db[c] = []; });
  return db;
}

let cache = null;

function ensureLoaded() {
  if (cache) return cache;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    cache = emptyDb();
    persist();
  } else {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    cache = raw ? JSON.parse(raw) : emptyDb();
    COLLECTIONS.forEach((c) => { if (!cache[c]) cache[c] = []; });
  }
  return cache;
}

function persist() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

function newId() {
  return crypto.randomUUID();
}

async function ensureSchema() { /* không cần - file JSON không có schema */ }

async function all(collection) {
  return ensureLoaded()[collection];
}

async function find(collection, id) {
  return ensureLoaded()[collection].find((x) => x.id === id) || null;
}

async function findWhere(collection, predicate) {
  return ensureLoaded()[collection].filter(predicate);
}

async function insert(collection, obj) {
  const db = ensureLoaded();
  const item = { id: newId(), createdAt: new Date().toISOString(), ...obj };
  db[collection].push(item);
  persist();
  return item;
}

async function update(collection, id, patch) {
  const db = ensureLoaded();
  const idx = db[collection].findIndex((x) => x.id === id);
  if (idx === -1) return null;
  db[collection][idx] = { ...db[collection][idx], ...patch, updatedAt: new Date().toISOString() };
  persist();
  return db[collection][idx];
}

async function remove(collection, id) {
  const db = ensureLoaded();
  const idx = db[collection].findIndex((x) => x.id === id);
  if (idx === -1) return false;
  db[collection].splice(idx, 1);
  persist();
  return true;
}

async function logActivity(userId, type, meta) {
  return insert('activityLogs', { userId, type, meta: meta || {} });
}

async function getOrCreateProgress(userId, lessonId) {
  let doc = (await findWhere('progress', (p) => p.userId === userId && p.lessonId === lessonId))[0];
  if (!doc) doc = await insert('progress', { userId, lessonId, modules: {}, wrongItems: [] });
  return doc;
}

async function recordResult(userId, lessonId, moduleName, itemId, itemType, correct) {
  const prog = await getOrCreateProgress(userId, lessonId);
  const modules = { ...prog.modules };
  const current = modules[moduleName] || { attempts: 0, correct: 0 };
  current.attempts += 1;
  if (correct) current.correct += 1;
  modules[moduleName] = current;

  let wrongItems = prog.wrongItems || [];
  if (correct) {
    wrongItems = wrongItems.filter((w) => w.itemId !== itemId);
  } else if (itemId) {
    if (!wrongItems.find((w) => w.itemId === itemId)) {
      wrongItems = [...wrongItems, { itemId, itemType, lessonId, addedAt: new Date().toISOString() }];
    }
  }
  return update('progress', prog.id, { modules, wrongItems });
}

async function upsertFlashcard(userId, wordId, status) {
  const existing = (await findWhere('flashcardStatus', (f) => f.userId === userId && f.wordId === wordId))[0];
  if (existing) return update('flashcardStatus', existing.id, { status });
  return insert('flashcardStatus', { userId, wordId, status });
}

async function upsertSlideProgress(userId, slideId, page, percent) {
  const existing = (await findWhere('slideProgress', (d) => d.userId === userId && d.slideId === slideId))[0];
  const patch = { lastPage: page, percent };
  if (existing) return update('slideProgress', existing.id, patch);
  return insert('slideProgress', { userId, slideId, ...patch });
}

module.exports = {
  mode: 'json', COLLECTIONS, ensureSchema,
  all, find, findWhere, insert, update, remove,
  logActivity, getOrCreateProgress, recordResult,
  upsertFlashcard, upsertSlideProgress
};
