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

  const hsk1 = db.insert('levels', { code: 'HSK1', name: 'HSK 1', type: 'HSK', category: 'hsk_hskk', group: 'HSK 3.0', order: 1 });
  const hsk2 = db.insert('levels', { code: 'HSK2', name: 'HSK 2', type: 'HSK', category: 'hsk_hskk', group: 'HSK 3.0', order: 2 });
  const hsk3 = db.insert('levels', { code: 'HSK3', name: 'HSK 3', type: 'HSK', category: 'hsk_hskk', group: 'HSK 3.0', order: 3 });
  db.insert('levels', { code: 'HSK4', name: 'HSK 4', type: 'HSK', category: 'hsk_hskk', group: 'HSK 3.0', order: 4 });
  db.insert('levels', { code: 'HSK5', name: 'HSK 5', type: 'HSK', category: 'hsk_hskk', group: 'HSK 3.0', order: 5 });
  db.insert('levels', { code: 'HSK6', name: 'HSK 6', type: 'HSK', category: 'hsk_hskk', group: 'HSK 3.0', order: 6 });

  const hskkSc = db.insert('levels', { code: 'HSKK-SC', name: 'HSKK Sơ cấp', type: 'HSKK', category: 'hsk_hskk', group: 'HSKK', order: 1 });
  db.insert('levels', { code: 'HSKK-TC', name: 'HSKK Trung cấp', type: 'HSKK', category: 'hsk_hskk', group: 'HSKK', order: 2 });
  db.insert('levels', { code: 'HSKK-CC', name: 'HSKK Cao cấp', type: 'HSKK', category: 'hsk_hskk', group: 'HSKK', order: 3 });

  const yct1 = db.insert('levels', { code: 'YCT1', name: 'YCT 1', type: 'YCT', category: 'kids', order: 1 });
  db.insert('levels', { code: 'YCT2', name: 'YCT 2', type: 'YCT', category: 'kids', order: 2 });
  db.insert('levels', { code: 'YCT3', name: 'YCT 3', type: 'YCT', category: 'kids', order: 3 });
  db.insert('levels', { code: 'YCT4', name: 'YCT 4', type: 'YCT', category: 'kids', order: 4 });
  db.insert('levels', { code: 'KIDS-FLASHCARD', name: 'Flashcard theo chủ đề', type: 'KIDS', category: 'kids', order: 5 });
  db.insert('levels', { code: 'KIDS-LITTLEFOX', name: 'Little Fox Chinese', type: 'KIDS', category: 'kids', order: 6 });
  db.insert('levels', { code: 'KIDS-STORY', name: 'Truyện tiếng Trung', type: 'KIDS', category: 'kids', order: 7 });
  const kidsSong = db.insert('levels', { code: 'KIDS-SONG', name: 'Bài hát tiếng Trung', type: 'KIDS', category: 'kids', order: 8 });

  const convoBasic = db.insert('levels', { code: 'CONVO-BASIC', name: 'Giao tiếp cơ bản', type: 'CONVO', category: 'conversation', order: 1 });
  db.insert('levels', { code: 'CONVO-DAILY', name: 'Giao tiếp hằng ngày', type: 'CONVO', category: 'conversation', order: 2 });
  db.insert('levels', { code: 'CONVO-TRAVEL', name: 'Tiếng Trung du lịch', type: 'CONVO', category: 'conversation', order: 3 });
  db.insert('levels', { code: 'CONVO-WORK', name: 'Tiếng Trung công việc', type: 'CONVO', category: 'conversation', order: 4 });
  db.insert('levels', { code: 'CONVO-OFFICE', name: 'Tiếng Trung công sở', type: 'CONVO', category: 'conversation', order: 5 });

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

  db.insert('instructors', {
    name: 'Cô Lan', title: 'Giáo viên', avatarUrl: null, order: 1,
    bio: 'Thông tin giới thiệu (kinh nghiệm, bằng cấp, ảnh...) sẽ được admin/giáo viên cập nhật qua trang Quản trị.'
  });

  /**
   * Bài học mẫu ngắn (từ vựng + ví dụ, có thể kèm ngữ pháp) cho một số cấp độ
   * tiêu biểu ở mỗi danh mục, để sidebar không trống hoàn toàn khi demo. Các
   * cấp độ còn lại vẫn để trống có chủ đích, chờ giáo viên nhập nội dung thật
   * qua trang Quản trị - không tự bịa thêm cho toàn bộ 22 mục.
   */
  function addDemoLesson(level, { title, description, topicName, words, grammar }) {
    const lesson = db.insert('lessons', { levelId: level.id, order: 1, title, description, published: true });
    const topic = db.insert('topics', { lessonId: lesson.id, name: topicName });
    words.forEach(([hanzi, pinyin, vi]) => {
      db.insert('words', {
        lessonId: lesson.id, topicId: topic.id, hanzi, pinyin, meaningVi: vi,
        type: 'Từ vựng', example: { hanzi: `${hanzi}。`, pinyin: `${pinyin}.`, vi }, imageUrl: null,
        audioUrl: null, strokeOrderUrl: null
      });
    });
    if (grammar) db.insert('grammarPoints', { lessonId: lesson.id, ...grammar });
    return lesson;
  }

  addDemoLesson(hsk2, {
    title: 'Bài 1: 你叫什么名字 - Hỏi tên',
    description: 'Hỏi và trả lời tên, tuổi',
    topicName: 'Làm quen',
    words: [
      ['叫', 'jiào', 'Tên là, gọi là'],
      ['名字', 'míngzi', 'Tên'],
      ['什么', 'shénme', 'Gì, cái gì'],
      ['多大', 'duōdà', 'Bao nhiêu tuổi'],
      ['岁', 'suì', 'Tuổi']
    ],
    grammar: {
      structure: '你叫什么名字？',
      usageVi: 'Mẫu câu hỏi tên người khác một cách lịch sự, dùng phổ biến khi mới làm quen.',
      example: { hanzi: '我叫王明。', pinyin: 'Wǒ jiào Wáng Míng.', vi: 'Tôi tên là Vương Minh.' },
      notes: 'Trả lời bằng 我叫 + tên, không lặp lại 什么名字.',
      exercises: [{ type: 'mcq', question: '你 ___ 什么名字？', options: ['叫', '是', '在'], answerIndex: 0, explanation: '叫 dùng để hỏi/nói tên.' }]
    }
  });

  addDemoLesson(hsk3, {
    title: 'Bài 1: 你在哪儿工作 - Hỏi nơi làm việc',
    description: 'Hỏi và trả lời về công việc, nơi làm việc',
    topicName: 'Công việc',
    words: [
      ['工作', 'gōngzuò', 'Công việc, làm việc'],
      ['在', 'zài', 'Ở, tại'],
      ['哪儿', 'nǎr', 'Ở đâu'],
      ['公司', 'gōngsī', 'Công ty'],
      ['医生', 'yīshēng', 'Bác sĩ']
    ],
    grammar: {
      structure: '你在哪儿工作？',
      usageVi: 'Hỏi địa điểm làm việc của ai đó, trả lời bằng 我在 + địa điểm + 工作.',
      example: { hanzi: '我在医院工作。', pinyin: 'Wǒ zài yīyuàn gōngzuò.', vi: 'Tôi làm việc ở bệnh viện.' },
      notes: 'Giới từ 在 luôn đứng trước địa điểm, không đứng sau động từ.',
      exercises: [{ type: 'mcq', question: '我 ___ 公司工作。', options: ['在', '是', '叫'], answerIndex: 0, explanation: '在 chỉ nơi chốn diễn ra hành động.' }]
    }
  });

  addDemoLesson(yct1, {
    title: 'Bài 1: 数字 - Số đếm',
    description: 'Học đếm số từ 1 đến 5 (dành cho thiếu nhi)',
    topicName: 'Số đếm',
    words: [
      ['一', 'yī', 'Một'],
      ['二', 'èr', 'Hai'],
      ['三', 'sān', 'Ba'],
      ['四', 'sì', 'Bốn'],
      ['五', 'wǔ', 'Năm']
    ]
  });

  addDemoLesson(hskkSc, {
    title: 'Bài 1: Tự giới thiệu bản thân',
    description: 'Luyện khẩu ngữ giới thiệu bản thân trước lớp',
    topicName: 'Khẩu ngữ giới thiệu',
    words: [
      ['大家好', 'dàjiā hǎo', 'Chào mọi người'],
      ['我叫', 'wǒ jiào', 'Tôi tên là'],
      ['很高兴认识你', 'hěn gāoxìng rènshi nǐ', 'Rất vui được quen bạn'],
      ['来自', 'láizì', 'Đến từ']
    ]
  });

  addDemoLesson(kidsSong, {
    title: 'Bài 1: 两只老虎 - Hai chú hổ',
    description: 'Bài hát thiếu nhi kinh điển, giai điệu quen thuộc',
    topicName: 'Từ vựng trong bài hát',
    words: [
      ['老虎', 'lǎohǔ', 'Con hổ'],
      ['跑', 'pǎo', 'Chạy'],
      ['快', 'kuài', 'Nhanh'],
      ['眼睛', 'yǎnjīng', 'Mắt'],
      ['耳朵', 'ěrduo', 'Tai']
    ]
  });

  addDemoLesson(convoBasic, {
    title: 'Bài 1: Xin phép & cảm ơn trong giao tiếp',
    description: 'Các mẫu câu lịch sự dùng hằng ngày',
    topicName: 'Giao tiếp lịch sự',
    words: [
      ['麻烦你', 'máfan nǐ', 'Phiền bạn'],
      ['没关系', 'méi guānxi', 'Không sao'],
      ['请问', 'qǐngwèn', 'Xin hỏi'],
      ['谢谢你', 'xièxiè nǐ', 'Cảm ơn bạn'],
      ['不客气', 'bú kèqi', 'Không có gì']
    ]
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
