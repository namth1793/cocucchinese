const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db');
const storage = require('./storage');

const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeSvg(relPath, { bg, text, sub }) {
  const full = path.join(UPLOAD_ROOT, relPath);
  ensureDir(path.dirname(full));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">
  <rect width="100%" height="100%" fill="${bg}"/>
  <text x="50%" y="46%" font-size="72" text-anchor="middle" fill="#ffffff" font-family="sans-serif">${text}</text>
  <text x="50%" y="64%" font-size="26" text-anchor="middle" fill="#ffffffdd" font-family="sans-serif">${sub || ''}</text>
  </svg>`;
  fs.writeFileSync(full, svg, 'utf-8');
}

function seedIfEmpty() {
  if (db.all('users').length > 0) return;
  console.log('Đang khởi tạo dữ liệu mẫu...');

  db.insert('users', { name: 'Quản trị viên', email: 'admin@hsk360.vn', passwordHash: bcrypt.hashSync('admin123', 10), role: 'admin', status: 'active', activeSessions: [] });
  db.insert('users', { name: 'Cô Lan', email: 'teacher@hsk360.vn', passwordHash: bcrypt.hashSync('teacher123', 10), role: 'teacher', status: 'active', activeSessions: [] });
  db.insert('users', { name: 'Học sinh Demo', email: 'student@hsk360.vn', passwordHash: bcrypt.hashSync('student123', 10), role: 'student', status: 'active', activeSessions: [] });

  const hsk1 = db.insert('levels', { code: 'HSK1', name: 'HSK 1', type: 'HSK', order: 1 });
  db.insert('levels', { code: 'HSK2', name: 'HSK 2', type: 'HSK', order: 2 });
  db.insert('levels', { code: 'HSK3', name: 'HSK 3', type: 'HSK', order: 3 });
  db.insert('levels', { code: 'YCT1', name: 'YCT 1', type: 'YCT', order: 1 });

  const lesson1 = db.insert('lessons', { levelId: hsk1.id, order: 1, title: 'Bài 1: 你好 - Xin chào', description: 'Chào hỏi cơ bản', published: true });
  db.insert('lessons', { levelId: hsk1.id, order: 2, title: 'Bài 2: 谢谢 - Cảm ơn', description: 'Cảm ơn và xin lỗi', published: true });

  const topic1 = db.insert('topics', { lessonId: lesson1.id, name: 'Chào hỏi' });

  const wordData = [
    ['你好', 'nǐ hǎo', 'Xin chào'],
    ['谢谢', 'xièxiè', 'Cảm ơn'],
    ['再见', 'zàijiàn', 'Tạm biệt'],
    ['老师', 'lǎoshī', 'Giáo viên'],
    ['学生', 'xuéshēng', 'Học sinh'],
    ['我', 'wǒ', 'Tôi'],
    ['是', 'shì', 'Là'],
    ['苹果', 'píngguǒ', 'Quả táo']
  ];

  wordData.forEach(([hanzi, pinyin, vi]) => {
    db.insert('words', {
      lessonId: lesson1.id, topicId: topic1.id, hanzi, pinyin, meaningVi: vi,
      type: 'Danh từ/Đại từ',
      example: { hanzi: `${hanzi}！`, pinyin: `${pinyin}!`, vi },
      imageUrl: null,
      audioUrl: null, strokeOrderUrl: null
    });
  });

  db.insert('grammarPoints', {
    lessonId: lesson1.id,
    structure: 'A + 是 + B',
    usageVi: 'Dùng để giới thiệu A chính là B, thường dùng khi giới thiệu tên, nghề nghiệp, danh tính.',
    example: { hanzi: '我是学生。', pinyin: 'Wǒ shì xuéshēng.', vi: 'Tôi là học sinh.' },
    notes: 'Học sinh thường quên từ 是 hoặc đặt sai vị trí trong câu.',
    exercises: [
      { type: 'mcq', question: '我 ___ 学生。', options: ['是', '你', '好'], answerIndex: 0, explanation: '是 dùng để nối A và B trong câu giới thiệu.' }
    ]
  });

  const sentenceData = [
    { hanzi: '老师，您好。', pinyin: 'Lǎoshī, nín hǎo.', vi: 'Xin chào cô giáo.', category: 'dialogue' },
    { hanzi: '我是学生。', pinyin: 'Wǒ shì xuéshēng.', vi: 'Tôi là học sinh.', category: 'reading' },
    { hanzi: '谢谢老师。', pinyin: 'Xièxiè lǎoshī.', vi: 'Cảm ơn cô giáo.', category: 'listening' },
    { hanzi: '再见，老师。', pinyin: 'Zàijiàn, lǎoshī.', vi: 'Tạm biệt cô giáo.', category: 'reading' }
  ];
  sentenceData.forEach((s, idx) => db.insert('sentences', {
    lessonId: lesson1.id, ...s, order: idx + 1,
    questions: [{ q: `Câu "${s.hanzi}" có nghĩa là gì?`, options: [s.vi, 'Tạm biệt bạn', 'Chào buổi sáng'], answerIndex: 0, explanation: `${s.hanzi} (${s.pinyin}) = ${s.vi}` }]
  }));

  const slideDeck = db.insert('slides', { lessonId: lesson1.id, title: 'PPT Bài 1: 你好', pages: [], version: 1 });
  if (storage.mode === 'local') {
    writeSvg(`slides/${slideDeck.id}/page-1.svg`, { bg: '#DC2626', text: '你好', sub: 'Bài 1 - HSK1' });
    writeSvg(`slides/${slideDeck.id}/page-2.svg`, { bg: '#059669', text: '你好 谢谢 再见', sub: 'Từ vựng bài 1' });
    db.update('slides', slideDeck.id, {
      pages: [
        { pageNum: 1, fileName: 'page-1.svg' },
        { pageNum: 2, fileName: 'page-2.svg' }
      ]
    });
  }

  db.insert('songs', {
    lessonId: lesson1.id, title: '你好歌 (Bài hát chào hỏi)', mediaUrl: '',
    lines: [
      { start: 0, end: 3, hanzi: '你好你好', pinyin: 'nǐ hǎo nǐ hǎo', vi: 'Xin chào, xin chào' },
      { start: 3, end: 6, hanzi: '谢谢谢谢', pinyin: 'xièxiè xièxiè', vi: 'Cảm ơn, cảm ơn' },
      { start: 6, end: 9, hanzi: '再见再见', pinyin: 'zàijiàn zàijiàn', vi: 'Tạm biệt, tạm biệt' }
    ],
    grammarNotes: 'Bài hát lặp lại các từ chào hỏi đã học trong bài 1. Giáo viên có thể cập nhật link nhạc thật qua trang Quản trị.'
  });

  db.insert('videos', {
    lessonId: lesson1.id, title: 'Tình huống: Chào hỏi ở lớp học',
    url: '', description: 'Giáo viên cập nhật link video thực tế qua trang Quản trị.'
  });

  console.log('Đã tạo dữ liệu mẫu. Đăng nhập demo:');
  console.log('  Admin:   admin@hsk360.vn   / admin123');
  console.log('  Giáo viên: teacher@hsk360.vn / teacher123');
  console.log('  Học sinh:  student@hsk360.vn / student123');
  if (storage.mode !== 'local') {
    console.log('  (Chế độ R2: bỏ qua tạo ảnh/PPT mẫu - hãy upload qua trang Quản trị.)');
  }
}

module.exports = { seedIfEmpty };
