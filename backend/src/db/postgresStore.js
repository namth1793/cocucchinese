const crypto = require('crypto');
const { Pool } = require('pg');

/**
 * Engine lưu trữ PostgreSQL - tự động bật khi khai báo DATABASE_URL trong
 * backend/.env (xem README mục "Cơ sở dữ liệu"). Thay thế bản JSON file
 * (`jsonStore.js`) vốn phải ghi lại TOÀN BỘ file xuống đĩa ở mỗi lần thay đổi -
 * không chịu được nhiều học viên hoạt động đồng thời và không dùng được khi
 * chạy nhiều server song song (mỗi server một bản cache riêng).
 *
 * Mỗi collection là 1 bảng, dữ liệu lưu dạng JSONB (`data`) - GIỮ NGUYÊN mô
 * hình "document linh hoạt" hiện tại (mỗi bản ghi có thể có field khác nhau,
 * không cần khai báo cột cứng cho từng loại nội dung) thay vì thiết kế lại
 * thành các bảng quan hệ - đó là bước tối ưu riêng, có thể làm sau khi đã lên
 * Postgres ổn định. Route/middleware không cần đổi gì vì chữ ký hàm giữ nguyên
 * như jsonStore.js (chỉ khác là trả về Promise thật thay vì Promise đã resolve
 * sẵn).
 *
 * `id` lưu dạng TEXT (không dùng kiểu UUID của Postgres) để 1 id không đúng
 * định dạng UUID (vd. client tự gõ URL sai) chỉ đơn giản không khớp bản ghi
 * nào, thay vì làm câu lệnh SQL lỗi.
 */
const COLLECTIONS = [
  'users', 'levels', 'lessons', 'topics', 'words', 'grammarPoints',
  'sentences', 'characters', 'dialogues', 'speakingScenarios', 'fillExercises',
  'images', 'slides', 'slideProgress', 'songs', 'videos', 'examPapers',
  'progress', 'flashcardStatus', 'activityLogs', 'instructors',
  'enrollments', 'orders', 'migrations'
];
const COLLECTION_SET = new Set(COLLECTIONS);

function useSsl(connectionString) {
  if (process.env.DATABASE_SSL === 'false') return false;
  if (process.env.DATABASE_SSL === 'true') return true;
  // Kết nối tới máy cục bộ / trong cùng mạng nội bộ (vd. Railway internal host)
  // thường không cần SSL; kết nối ra ngoài Internet tới Postgres managed hầu
  // hết yêu cầu SSL nhưng dùng chứng chỉ tự ký nên phải tắt kiểm tra CA.
  return !/(localhost|127\.0\.0\.1|\.railway\.internal)/i.test(connectionString);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl(process.env.DATABASE_URL || '') ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10)
});

pool.on('error', (err) => {
  // Lỗi trên 1 kết nối rảnh trong pool (vd. bị managed DB ngắt do idle) - log
  // lại thay vì để crash cả tiến trình Node.
  console.error('[db] Lỗi kết nối PostgreSQL nhàn rỗi:', err.message);
});

/** Tên bảng phải nằm trong danh sách collection đã biết - chặn khả năng ghép chuỗi SQL từ input không kiểm soát. */
function table(collection) {
  if (!COLLECTION_SET.has(collection)) throw new Error(`Collection không hợp lệ: ${collection}`);
  return `"${collection}"`;
}

let schemaReady = null;
async function ensureSchema() {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    for (const c of COLLECTIONS) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS ${table(c)} (
          seq BIGSERIAL,
          id TEXT PRIMARY KEY,
          data JSONB NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ
        )
      `);
      await pool.query(`CREATE INDEX IF NOT EXISTS ${c}_seq_idx ON ${table(c)} (seq)`);
    }
  })();
  return schemaReady;
}

function newId() {
  return crypto.randomUUID();
}

async function all(collection) {
  const { rows } = await pool.query(`SELECT data FROM ${table(collection)} ORDER BY seq ASC`);
  return rows.map((r) => r.data);
}

async function find(collection, id) {
  if (!id) return null;
  const { rows } = await pool.query(`SELECT data FROM ${table(collection)} WHERE id = $1`, [String(id)]);
  return rows[0] ? rows[0].data : null;
}

/**
 * Predicate lọc vẫn chạy phía Node (giống hệt cách jsonStore.js/bản cache RAM
 * cũ hoạt động) thay vì dịch sang mệnh đề WHERE - giữ đúng hành vi hiện tại
 * cho mọi predicate tuỳ ý đang có trong code (routes, utils/access.js...) mà
 * không phải viết lại từng chỗ gọi. Ở quy mô hiện tại (nghìn bản ghi/collection)
 * việc tải cả bảng rồi lọc vẫn nhanh; nếu sau này 1 collection lớn hẳn lên có
 * thể tối ưu riêng bằng WHERE data->>'field' = $1 cho đúng chỗ đó.
 */
async function findWhere(collection, predicate) {
  const { rows } = await pool.query(`SELECT data FROM ${table(collection)} ORDER BY seq ASC`);
  return rows.map((r) => r.data).filter(predicate);
}

async function insert(collection, obj) {
  // Thứ tự spread giữ như bản JSON cũ: nếu obj lỡ có sẵn field id/createdAt thì
  // giá trị trong obj thắng (obj đứng sau) - dù thực tế các route hiện tại
  // không truyền 2 field này.
  const item = { id: newId(), createdAt: new Date().toISOString(), ...obj };
  await pool.query(
    `INSERT INTO ${table(collection)} (id, data, created_at) VALUES ($1, $2::jsonb, $3)`,
    [item.id, JSON.stringify(item), item.createdAt]
  );
  return item;
}

async function update(collection, id, patch) {
  const updatedAt = new Date().toISOString();
  // Toán tử jsonb `||` gộp nông (shallow merge, field bên phải thắng) - đúng
  // hệt hành vi `{ ...current, ...patch }` của bản JSON cũ.
  const { rows } = await pool.query(
    `UPDATE ${table(collection)} SET data = data || $2::jsonb, updated_at = $3
     WHERE id = $1 RETURNING data`,
    [String(id), JSON.stringify({ ...patch, updatedAt }), updatedAt]
  );
  return rows[0] ? rows[0].data : null;
}

async function remove(collection, id) {
  const { rowCount } = await pool.query(`DELETE FROM ${table(collection)} WHERE id = $1`, [String(id)]);
  return rowCount > 0;
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
  mode: 'postgres', COLLECTIONS, ensureSchema, pool,
  all, find, findWhere, insert, update, remove,
  logActivity, getOrCreateProgress, recordResult,
  upsertFlashcard, upsertSlideProgress
};
