require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const morgan = require('morgan');

const { requireAuth } = require('./middleware/auth');
const { seedIfEmpty } = require('./seed');
const { runMigrations, applyDefaultCovers } = require('./migrate');
const storage = require('./storage');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, max: 600 }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }));

// Chế độ lưu trữ cục bộ (dev/demo): phục vụ ảnh minh hoạ qua route riêng, yêu
// cầu đăng nhập. Khi chạy chế độ R2 (production), ảnh được phục vụ trực tiếp
// từ CDN qua URL công khai lưu sẵn trong DB - route này không còn cần thiết,
// giúp giảm tải hoàn toàn khỏi server Node.
if (storage.mode === 'local') {
  const uploadRoot = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');
  // Ảnh bìa khoá học phải công khai (trang danh sách khoá học không cần đăng nhập).
  app.use('/uploads/covers', express.static(path.join(uploadRoot, 'covers'), {
    setHeaders: (res) => res.set('Cache-Control', 'public, max-age=86400')
  }));
  app.use('/uploads/media', requireAuth, express.static(path.join(uploadRoot, 'media'), {
    setHeaders: (res) => res.set('Cache-Control', 'no-store')
  }));
}
console.log(`Chế độ lưu trữ file: ${storage.mode === 'r2' ? 'Cloudflare R2' : 'ổ đĩa cục bộ (local)'}`);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/levels', require('./routes/levels'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/topics', require('./routes/topics'));
app.use('/api/words', require('./routes/words'));
app.use('/api/grammar', require('./routes/grammar'));
app.use('/api/sentences', require('./routes/sentences'));
app.use('/api/characters', require('./routes/characters'));
app.use('/api/hanzi-data', require('./routes/hanziData'));
app.use('/api/dialogues', require('./routes/dialogues'));
app.use('/api/speaking', require('./routes/speaking'));
app.use('/api/fill', require('./routes/fillExercises'));
app.use('/api/exam-papers', require('./routes/examPapers'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/flashcards', require('./routes/flashcards'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/images', require('./routes/images'));
app.use('/api/slides', require('./routes/slides'));
app.use('/api/songs', require('./routes/songs'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/instructors', require('./routes/instructors'));
app.use('/api/users', require('./routes/users'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((req, res) => res.status(404).json({ error: 'Không tìm thấy endpoint' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File quá lớn, vượt giới hạn cho phép. Vui lòng nén nhỏ lại rồi thử lại.' });
    }
    return res.status(400).json({ error: 'Tải file lên thất bại: ' + err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Lỗi hệ thống' });
});

seedIfEmpty();
runMigrations();
applyDefaultCovers().catch((e) => console.error('[migrate] nạp ảnh bìa lỗi:', e));
app.listen(PORT, () => console.log(`Backend học tiếng Trung chạy tại http://localhost:${PORT}`));
