const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

const COLLECTIONS = [
  'users', 'levels', 'lessons', 'topics', 'words', 'grammarPoints',
  'sentences', 'images', 'slides', 'slideProgress', 'songs', 'videos',
  'progress', 'flashcardStatus', 'activityLogs', 'instructors'
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

function all(collection) {
  return ensureLoaded()[collection];
}

function find(collection, id) {
  return ensureLoaded()[collection].find((x) => x.id === id) || null;
}

function findWhere(collection, predicate) {
  return ensureLoaded()[collection].filter(predicate);
}

function insert(collection, obj) {
  const db = ensureLoaded();
  const item = { id: newId(), createdAt: new Date().toISOString(), ...obj };
  db[collection].push(item);
  persist();
  return item;
}

function update(collection, id, patch) {
  const db = ensureLoaded();
  const idx = db[collection].findIndex((x) => x.id === id);
  if (idx === -1) return null;
  db[collection][idx] = { ...db[collection][idx], ...patch, updatedAt: new Date().toISOString() };
  persist();
  return db[collection][idx];
}

function remove(collection, id) {
  const db = ensureLoaded();
  const idx = db[collection].findIndex((x) => x.id === id);
  if (idx === -1) return false;
  db[collection].splice(idx, 1);
  persist();
  return true;
}

function logActivity(userId, type, meta) {
  return insert('activityLogs', { userId, type, meta: meta || {} });
}

function getOrCreateProgress(userId, lessonId) {
  let doc = findWhere('progress', (p) => p.userId === userId && p.lessonId === lessonId)[0];
  if (!doc) doc = insert('progress', { userId, lessonId, modules: {}, wrongItems: [] });
  return doc;
}

function recordResult(userId, lessonId, moduleName, itemId, itemType, correct) {
  const prog = getOrCreateProgress(userId, lessonId);
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

function upsertFlashcard(userId, wordId, status) {
  const existing = findWhere('flashcardStatus', (f) => f.userId === userId && f.wordId === wordId)[0];
  if (existing) return update('flashcardStatus', existing.id, { status });
  return insert('flashcardStatus', { userId, wordId, status });
}

function upsertSlideProgress(userId, slideId, page, percent) {
  const existing = findWhere('slideProgress', (d) => d.userId === userId && d.slideId === slideId)[0];
  const patch = { lastPage: page, percent };
  if (existing) return update('slideProgress', existing.id, patch);
  return insert('slideProgress', { userId, slideId, ...patch });
}

module.exports = {
  all, find, findWhere, insert, update, remove,
  logActivity, getOrCreateProgress, recordResult,
  upsertFlashcard, upsertSlideProgress
};
