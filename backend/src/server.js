require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const morgan = require('morgan');

const { requireAuth } = require('./middleware/auth');
const { seedIfEmpty } = require('./seed');
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
  app.use('/uploads/media', requireAuth, express.static(path.join(__dirname, '..', 'uploads', 'media'), {
    setHeaders: (res) => res.set('Cache-Control', 'no-store')
  }));
}
console.log(`Chế độ lưu trữ file: ${storage.mode === 'r2' ? 'Cloudflare R2' : 'ổ đĩa cục bộ (local)'}`);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/levels', require('./routes/levels'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/topics', require('./routes/topics'));
app.use('/api/words', require('./routes/words'));
app.use('/api/grammar', require('./routes/grammar'));
app.use('/api/sentences', require('./routes/sentences'));
app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/flashcards', require('./routes/flashcards'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/images', require('./routes/images'));
app.use('/api/slides', require('./routes/slides'));
app.use('/api/songs', require('./routes/songs'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/users', require('./routes/users'));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use((req, res) => res.status(404).json({ error: 'Không tìm thấy endpoint' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Lỗi hệ thống' });
});

seedIfEmpty();
app.listen(PORT, () => console.log(`Backend học tiếng Trung chạy tại http://localhost:${PORT}`));
