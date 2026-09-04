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
  const hsk4 = db.insert('levels', { code: 'HSK4', name: 'HSK 4', type: 'HSK', category: 'hsk_hskk', group: 'HSK 3.0', order: 4 });
  const hsk5 = db.insert('levels', { code: 'HSK5', name: 'HSK 5', type: 'HSK', category: 'hsk_hskk', group: 'HSK 3.0', order: 5 });
  const hsk6 = db.insert('levels', { code: 'HSK6', name: 'HSK 6', type: 'HSK', category: 'hsk_hskk', group: 'HSK 3.0', order: 6 });

  const hskkSc = db.insert('levels', { code: 'HSKK-SC', name: 'HSKK Sơ cấp', type: 'HSKK', category: 'hsk_hskk', group: 'HSKK', order: 1 });
  const hskkTc = db.insert('levels', { code: 'HSKK-TC', name: 'HSKK Trung cấp', type: 'HSKK', category: 'hsk_hskk', group: 'HSKK', order: 2 });
  const hskkCc = db.insert('levels', { code: 'HSKK-CC', name: 'HSKK Cao cấp', type: 'HSKK', category: 'hsk_hskk', group: 'HSKK', order: 3 });

  const yct1 = db.insert('levels', { code: 'YCT1', name: 'YCT 1', type: 'YCT', category: 'kids', order: 1 });
  const yct2 = db.insert('levels', { code: 'YCT2', name: 'YCT 2', type: 'YCT', category: 'kids', order: 2 });
  const yct3 = db.insert('levels', { code: 'YCT3', name: 'YCT 3', type: 'YCT', category: 'kids', order: 3 });
  const yct4 = db.insert('levels', { code: 'YCT4', name: 'YCT 4', type: 'YCT', category: 'kids', order: 4 });
  const kidsFlashcard = db.insert('levels', { code: 'KIDS-FLASHCARD', name: 'Flashcard theo chủ đề', type: 'KIDS', category: 'kids', order: 5 });
  const kidsLittlefox = db.insert('levels', { code: 'KIDS-LITTLEFOX', name: 'Little Fox Chinese', type: 'KIDS', category: 'kids', order: 6 });
  const kidsStory = db.insert('levels', { code: 'KIDS-STORY', name: 'Truyện tiếng Trung', type: 'KIDS', category: 'kids', order: 7 });
  const kidsSong = db.insert('levels', { code: 'KIDS-SONG', name: 'Bài hát tiếng Trung', type: 'KIDS', category: 'kids', order: 8 });

  const convoBasic = db.insert('levels', { code: 'CONVO-BASIC', name: 'Giao tiếp cơ bản', type: 'CONVO', category: 'conversation', order: 1 });
  const convoDaily = db.insert('levels', { code: 'CONVO-DAILY', name: 'Giao tiếp hằng ngày', type: 'CONVO', category: 'conversation', order: 2 });
  const convoTravel = db.insert('levels', { code: 'CONVO-TRAVEL', name: 'Tiếng Trung du lịch', type: 'CONVO', category: 'conversation', order: 3 });
  const convoWork = db.insert('levels', { code: 'CONVO-WORK', name: 'Tiếng Trung công việc', type: 'CONVO', category: 'conversation', order: 4 });
  const convoOffice = db.insert('levels', { code: 'CONVO-OFFICE', name: 'Tiếng Trung công sở', type: 'CONVO', category: 'conversation', order: 5 });

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
   * Bài học mẫu ngắn (từ vựng + ví dụ, có thể kèm ngữ pháp) cho từng cấp độ ở
   * mọi danh mục, để sidebar có nội dung minh hoạ ngay khi demo thay vì trống
   * trơn. Giáo viên/admin chỉnh sửa hoặc thay thế bằng nội dung thật qua trang
   * Quản trị bất cứ lúc nào.
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

  addDemoLesson(hsk4, {
    title: 'Bài 1: 周末你打算做什么 - Dự định cuối tuần',
    description: 'Nói về dự định, kế hoạch trong tương lai gần',
    topicName: 'Dự định & kế hoạch',
    words: [
      ['打算', 'dǎsuàn', 'Dự định'],
      ['周末', 'zhōumò', 'Cuối tuần'],
      ['计划', 'jìhuà', 'Kế hoạch'],
      ['决定', 'juédìng', 'Quyết định'],
      ['需要', 'xūyào', 'Cần'],
      ['提高', 'tígāo', 'Nâng cao'],
      ['影响', 'yǐngxiǎng', 'Ảnh hưởng']
    ],
    grammar: {
      structure: 'S + 打算 + V',
      usageVi: 'Diễn đạt dự định, kế hoạch sắp làm trong tương lai gần.',
      example: { hanzi: '我打算周末去爬山。', pinyin: 'Wǒ dǎsuàn zhōumò qù páshān.', vi: 'Tôi dự định cuối tuần đi leo núi.' },
      notes: '打算 luôn đứng trước động từ chỉ hành động, không dùng cho việc đã xảy ra.',
      exercises: [{ type: 'mcq', question: '你周末 ___ 做什么？', options: ['打算', '需要', '影响'], answerIndex: 0, explanation: '打算 dùng để hỏi/nói về dự định.' }]
    }
  });

  addDemoLesson(hsk5, {
    title: 'Bài 1: 逐渐适应新环境 - Dần thích nghi môi trường mới',
    description: 'Diễn đạt sự thay đổi, thích nghi theo thời gian',
    topicName: 'Thích nghi & thay đổi',
    words: [
      ['逐渐', 'zhújiàn', 'Dần dần'],
      ['适应', 'shìyìng', 'Thích nghi'],
      ['环境', 'huánjìng', 'Môi trường'],
      ['特点', 'tèdiǎn', 'Đặc điểm'],
      ['竞争', 'jìngzhēng', 'Cạnh tranh'],
      ['承担', 'chéngdān', 'Đảm nhận, gánh vác'],
      ['挑战', 'tiǎozhàn', 'Thách thức']
    ],
    grammar: {
      structure: '随着 + Mệnh đề，逐渐 + V/Adj',
      usageVi: 'Diễn đạt một sự thay đổi diễn ra từ từ, theo cùng với một điều kiện/thời gian nào đó.',
      example: { hanzi: '随着时间的推移，他逐渐适应了新环境。', pinyin: 'Suízhe shíjiān de tuīyí, tā zhújiàn shìyìngle xīn huánjìng.', vi: 'Theo thời gian, anh ấy dần thích nghi với môi trường mới.' },
      notes: '逐渐 nhấn mạnh quá trình từ từ, khác với 突然 (đột nhiên).',
      exercises: [{ type: 'mcq', question: '他 ___ 适应了这里的生活。', options: ['逐渐', '突然', '马上'], answerIndex: 0, explanation: '逐渐 diễn tả quá trình thay đổi từ từ theo thời gian.' }]
    }
  });

  addDemoLesson(hsk6, {
    title: 'Bài 1: 毫无疑问 - Diễn đạt học thuật & thành ngữ',
    description: 'Từ vựng và cấu trúc dùng trong văn viết, tranh luận học thuật',
    topicName: 'Diễn đạt học thuật',
    words: [
      ['毫无疑问', 'háo wú yíyì', 'Không nghi ngờ gì, chắc chắn'],
      ['局面', 'júmiàn', 'Cục diện, tình hình'],
      ['采取', 'cǎiqǔ', 'Áp dụng, thực hiện'],
      ['措施', 'cuòshī', 'Biện pháp'],
      ['显著', 'xiǎnzhù', 'Rõ rệt, đáng kể'],
      ['缓解', 'huǎnjiě', 'Giảm bớt, xoa dịu'],
      ['趋势', 'qūshì', 'Xu hướng']
    ],
    grammar: {
      structure: '毫无疑问，...',
      usageVi: 'Dùng ở đầu câu để nhấn mạnh một khẳng định chắc chắn, thường gặp trong văn viết/tranh luận học thuật.',
      example: { hanzi: '毫无疑问，这项政策对经济发展有积极影响。', pinyin: 'Háo wú yíyì, zhè xiàng zhèngcè duì jīngjì fāzhǎn yǒu jījí yǐngxiǎng.', vi: 'Không nghi ngờ gì, chính sách này có ảnh hưởng tích cực đến phát triển kinh tế.' },
      notes: 'Là cách diễn đạt trang trọng, ít dùng trong khẩu ngữ hằng ngày.',
      exercises: [{ type: 'mcq', question: '___，环境保护非常重要。', options: ['毫无疑问', '没关系', '打算'], answerIndex: 0, explanation: '毫无疑问 dùng để nhấn mạnh khẳng định chắc chắn ở đầu câu.' }]
    }
  });

  addDemoLesson(hskkTc, {
    title: 'Bài 1: 谈谈你的爱好 - Nói về sở thích',
    description: 'Luyện khẩu ngữ trình bày về sở thích cá nhân',
    topicName: 'Khẩu ngữ trung cấp',
    words: [
      ['爱好', 'àihào', 'Sở thích'],
      ['兴趣', 'xìngqù', 'Hứng thú'],
      ['坚持', 'jiānchí', 'Kiên trì'],
      ['业余时间', 'yèyú shíjiān', 'Thời gian rảnh'],
      ['提高水平', 'tígāo shuǐpíng', 'Nâng cao trình độ']
    ]
  });

  addDemoLesson(hskkCc, {
    title: 'Bài 1: 对这个问题的看法 - Nêu quan điểm về một vấn đề',
    description: 'Luyện khẩu ngữ trình bày, tranh luận quan điểm ở trình độ cao cấp',
    topicName: 'Khẩu ngữ cao cấp',
    words: [
      ['看法', 'kànfǎ', 'Quan điểm, cách nhìn'],
      ['观点', 'guāndiǎn', 'Quan điểm, góc nhìn'],
      ['赞成', 'zànchéng', 'Tán thành'],
      ['反对', 'fǎnduì', 'Phản đối'],
      ['综合来看', 'zōnghé lái kàn', 'Nhìn tổng thể'],
      ['举例来说', 'jǔlì lái shuō', 'Ví dụ như']
    ]
  });

  addDemoLesson(yct2, {
    title: 'Bài 1: 颜色 - Màu sắc',
    description: 'Học tên các màu sắc cơ bản (dành cho thiếu nhi)',
    topicName: 'Màu sắc',
    words: [
      ['红色', 'hóngsè', 'Màu đỏ'],
      ['黄色', 'huángsè', 'Màu vàng'],
      ['蓝色', 'lánsè', 'Màu xanh dương'],
      ['绿色', 'lǜsè', 'Màu xanh lá'],
      ['白色', 'báisè', 'Màu trắng'],
      ['黑色', 'hēisè', 'Màu đen']
    ]
  });

  addDemoLesson(yct3, {
    title: 'Bài 1: 动物朋友 - Những người bạn động vật',
    description: 'Học tên các con vật quen thuộc (dành cho thiếu nhi)',
    topicName: 'Động vật',
    words: [
      ['猫', 'māo', 'Con mèo'],
      ['狗', 'gǒu', 'Con chó'],
      ['兔子', 'tùzi', 'Con thỏ'],
      ['熊猫', 'xióngmāo', 'Gấu trúc'],
      ['大象', 'dàxiàng', 'Con voi'],
      ['小鸟', 'xiǎoniǎo', 'Chim nhỏ']
    ]
  });

  addDemoLesson(yct4, {
    title: 'Bài 1: 我的一天 - Một ngày của tôi',
    description: 'Mô tả các hoạt động thường ngày (dành cho thiếu nhi)',
    topicName: 'Sinh hoạt hằng ngày',
    words: [
      ['起床', 'qǐchuáng', 'Thức dậy'],
      ['刷牙', 'shuāyá', 'Đánh răng'],
      ['上学', 'shàngxué', 'Đi học'],
      ['放学', 'fàngxué', 'Tan học'],
      ['做作业', 'zuò zuòyè', 'Làm bài tập'],
      ['睡觉', 'shuìjiào', 'Đi ngủ']
    ]
  });

  addDemoLesson(kidsFlashcard, {
    title: 'Bộ thẻ 1: 水果 - Trái cây',
    description: 'Flashcard theo chủ đề, dùng để học và ôn nhanh từ vựng theo nhóm',
    topicName: 'Chủ đề: Trái cây',
    words: [
      ['苹果', 'píngguǒ', 'Quả táo'],
      ['香蕉', 'xiāngjiāo', 'Quả chuối'],
      ['西瓜', 'xīguā', 'Quả dưa hấu'],
      ['草莓', 'cǎoméi', 'Quả dâu tây'],
      ['葡萄', 'pútáo', 'Quả nho'],
      ['橙子', 'chéngzi', 'Quả cam']
    ]
  });

  addDemoLesson(kidsLittlefox, {
    title: 'Bài 1: 小狐狸的故事 - Câu chuyện chú cáo nhỏ',
    description: 'Học từ vựng qua câu chuyện ngắn, phong cách Little Fox',
    topicName: 'Từ vựng trong truyện',
    words: [
      ['狐狸', 'húli', 'Con cáo'],
      ['森林', 'sēnlín', 'Khu rừng'],
      ['朋友', 'péngyou', 'Bạn bè'],
      ['帮助', 'bāngzhù', 'Giúp đỡ'],
      ['勇敢', 'yǒnggǎn', 'Dũng cảm'],
      ['聪明', 'cōngmíng', 'Thông minh']
    ]
  });

  addDemoLesson(kidsStory, {
    title: 'Bài 1: 龟兔赛跑 - Rùa và Thỏ',
    description: 'Truyện ngụ ngôn kinh điển, học từ vựng qua tình tiết câu chuyện',
    topicName: 'Từ vựng trong truyện',
    words: [
      ['乌龟', 'wūguī', 'Con rùa'],
      ['兔子', 'tùzi', 'Con thỏ'],
      ['比赛', 'bǐsài', 'Cuộc thi'],
      ['慢', 'màn', 'Chậm'],
      ['骄傲', 'jiāo\'ào', 'Kiêu ngạo'],
      ['认真', 'rènzhēn', 'Nghiêm túc, chăm chỉ']
    ]
  });

  addDemoLesson(convoDaily, {
    title: 'Bài 1: Hỏi thăm sức khoẻ & thời tiết',
    description: 'Mẫu câu hỏi thăm, trò chuyện thường ngày',
    topicName: 'Trò chuyện hằng ngày',
    words: [
      ['你怎么样', 'nǐ zěnmeyàng', 'Bạn thế nào'],
      ['今天天气', 'jīntiān tiānqì', 'Thời tiết hôm nay'],
      ['有点儿', 'yǒudiǎnr', 'Hơi, một chút'],
      ['没事', 'méishì', 'Không sao'],
      ['保重', 'bǎozhòng', 'Bảo trọng']
    ]
  });

  addDemoLesson(convoTravel, {
    title: 'Bài 1: Đặt phòng khách sạn & hỏi đường',
    description: 'Các mẫu câu cần thiết khi đi du lịch',
    topicName: 'Giao tiếp du lịch',
    words: [
      ['酒店', 'jiǔdiàn', 'Khách sạn'],
      ['预订', 'yùdìng', 'Đặt trước'],
      ['请问怎么走', 'qǐngwèn zěnme zǒu', 'Xin hỏi đi thế nào'],
      ['机场', 'jīchǎng', 'Sân bay'],
      ['护照', 'hùzhào', 'Hộ chiếu'],
      ['行李', 'xíngli', 'Hành lý']
    ]
  });

  addDemoLesson(convoWork, {
    title: 'Bài 1: Giới thiệu công việc & trao đổi email',
    description: 'Từ vựng và mẫu câu giao tiếp trong môi trường làm việc',
    topicName: 'Giao tiếp công việc',
    words: [
      ['项目', 'xiàngmù', 'Dự án'],
      ['会议', 'huìyì', 'Cuộc họp'],
      ['截止日期', 'jiézhǐ rìqī', 'Hạn chót'],
      ['汇报', 'huìbào', 'Báo cáo'],
      ['同事', 'tóngshì', 'Đồng nghiệp'],
      ['加班', 'jiābān', 'Làm thêm giờ']
    ]
  });

  addDemoLesson(convoOffice, {
    title: 'Bài 1: Giao tiếp nơi công sở',
    description: 'Từ vựng và mẫu câu dùng phổ biến chốn công sở',
    topicName: 'Giao tiếp công sở',
    words: [
      ['老板', 'lǎobǎn', 'Sếp'],
      ['客户', 'kèhù', 'Khách hàng'],
      ['安排', 'ānpái', 'Sắp xếp'],
      ['通知', 'tōngzhī', 'Thông báo'],
      ['出差', 'chūchāi', 'Đi công tác'],
      ['请假', 'qǐngjià', 'Xin nghỉ phép']
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
