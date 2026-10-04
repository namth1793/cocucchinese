const express = require('express');
const db = require('../db');
const storage = require('../storage');
const { requireAuth, requireRole } = require('../middleware/auth');
const { mediaUpload } = require('../middleware/upload');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * Nội dung trang chủ công khai (admin sửa ở /admin/homepage), lưu 1 bản ghi `settings` id "homepage".
 * Các danh sách tin tức/video/giảng viên/cảm nhận mặc định rỗng - mục nào rỗng thì trang chủ ẩn mục đó,
 * để không bao giờ hiện nội dung giả.
 */
const DEFAULTS = {
  contact: {
    hotline: '', email: '', address: '', hours: '',
    facebook: '', youtube: '', tiktok: '', zalo: ''
  },
  topbar: { slogan: 'HSK 360 – HỌC TIẾNG TRUNG BÀI BẢN THEO CHUẨN HSK / YCT' },
  hero: {
    title1: 'HỌC LÀ NHỚ',
    title2: 'NÓI LÀ HAY',
    subtitle: 'TIẾNG TRUNG CƠ BẢN ĐẾN NÂNG CAO',
    promo: 'HỌC MỌI LÚC – MỌI NƠI – MỌI THIẾT BỊ',
    tagline: 'BÁM SÁT GIÁO TRÌNH CHUẨN HSK / YCT',
    imageUrl: ''
  },
  activity: { caption: 'HỌC TIẾNG TRUNG MỖI NGÀY CÙNG HSK 360', imageUrl: '' },
  quickLinks: [
    { label: 'Khoá học đang mở', url: '/courses' },
    { label: 'Đăng ký tư vấn', url: '#dang-ky' },
    { label: 'Đăng nhập vào học', url: '/login' }
  ],
  why: {
    title: 'TẠI SAO NÊN CHỌN HSK 360',
    items: [
      'Bám sát giáo trình chuẩn HSK / YCT, chia bài rõ ràng theo cấp độ',
      'Đủ kỹ năng trong một bài: từ vựng, ngữ pháp, hội thoại, nghe, đọc, viết',
      'Ôn tập bằng flashcard và trò chơi tạo tự động từ chính bài học',
      'Tự động đưa phần làm sai vào hàng đợi ôn tập riêng',
      'Theo dõi tiến độ, học trên điện thoại và máy tính'
    ],
    brandName: 'HSK 360',
    brandTagline: 'Học tiếng Trung HSK / YCT trực tuyến',
    buttonLabel: 'Xem khoá học',
    buttonUrl: '/courses'
  },
  courses: {
    title: 'THÔNG TIN KHÓA HỌC VÀ LỘ TRÌNH HỌC TẬP',
    desc: 'Từ chưa biết gì đến tự tin giao tiếp và thi đỗ HSK – mỗi cấp độ là một khoá học riêng, học đúng lộ trình.'
  },
  news: [],
  videos: [],
  teachers: [],
  testimonials: [],
  consult: {
    eyebrow: 'ĐĂNG KÝ NHẬN TƯ VẤN MIỄN PHÍ',
    title: 'Học tiếng Trung',
    highlight: 'Online mọi lúc, mọi nơi',
    desc: 'Để lại thông tin, HSK 360 sẽ liên hệ tư vấn lộ trình và khoá học phù hợp với mục tiêu của bạn.',
    imageUrl: ''
  },
  footer: {
    about: 'HSK 360 – nền tảng học tiếng Trung trực tuyến theo chuẩn HSK / YCT, đồng hành cùng bạn từ cơ bản đến nâng cao.'
  }
};

const T = (max = 200) => ({ t: 'text', max });
const U = { t: 'url' };
const obj = (f) => ({ t: 'obj', f });
const list = (max, item) => ({ t: 'list', max, item });

const SCHEMA = obj({
  contact: obj({
    hotline: T(30), email: T(120), address: T(250), hours: T(120),
    facebook: U, youtube: U, tiktok: U, zalo: U
  }),
  topbar: obj({ slogan: T(150) }),
  hero: obj({ title1: T(40), title2: T(40), subtitle: T(80), promo: T(80), tagline: T(100), imageUrl: U }),
  activity: obj({ caption: T(120), imageUrl: U }),
  quickLinks: list(3, obj({ label: T(40), url: U })),
  why: obj({
    title: T(80), items: { t: 'strings', max: 8, len: 150 },
    brandName: T(40), brandTagline: T(100), buttonLabel: T(40), buttonUrl: U
  }),
  courses: obj({ title: T(100), desc: T(300) }),
  news: list(12, obj({ title: T(200), date: T(20), excerpt: T(400), imageUrl: U, link: U })),
  videos: list(12, obj({ youtubeUrl: U, title: T(200), desc: T(300) })),
  teachers: list(12, obj({
    name: T(80), title: T(100), imageUrl: U, workplace: T(300), degree: T(150),
    major: T(150), school: T(150), experience: T(60)
  })),
  testimonials: list(24, obj({
    name: T(80), avatarUrl: U, content: T(800), achievement: T(200), course: T(120), link: U
  })),
  consult: obj({ eyebrow: T(100), title: T(60), highlight: T(80), desc: T(400), imageUrl: U }),
  footer: obj({ about: T(400) })
});

// Chỉ nhận link http(s), đường dẫn nội bộ "/..." hoặc neo "#..." - chặn javascript:, data:...
const URL_RE = /^(https?:\/\/[^\s"'<>]+|\/(?!\/)[^\s"'<>]*|#[\w-]*)$/i;

function clean(schema, input, fallback) {
  switch (schema.t) {
    case 'text':
      return typeof input === 'string' ? input.trim().slice(0, schema.max) : fallback;
    case 'url':
      if (typeof input !== 'string') return fallback;
      return URL_RE.test(input.trim()) && input.length <= 500 ? input.trim() : '';
    case 'strings':
      if (!Array.isArray(input)) return fallback;
      return input.filter((s) => typeof s === 'string' && s.trim())
        .slice(0, schema.max).map((s) => s.trim().slice(0, schema.len));
    case 'list':
      if (!Array.isArray(input)) return fallback;
      return input.filter((x) => x && typeof x === 'object').slice(0, schema.max)
        .map((x) => clean(schema.item, x, {}));
    case 'obj': {
      const src = input && typeof input === 'object' ? input : {};
      const base = fallback && typeof fallback === 'object' ? fallback : {};
      const out = {};
      Object.entries(schema.f).forEach(([k, s]) => {
        const v = clean(s, src[k], base[k] ?? (s.t === 'list' || s.t === 'strings' ? [] : ''));
        out[k] = v;
      });
      return out;
    }
    default:
      return fallback;
  }
}

async function load() {
  const doc = await db.find('settings', 'homepage');
  // Ghép với mặc định để trường mới thêm sau này vẫn có giá trị cho bản ghi cũ.
  return clean(SCHEMA, (doc && doc.value) || {}, DEFAULTS);
}

// Công khai: trang chủ + header/footer các trang công khai.
router.get('/', asyncHandler(async (req, res) => {
  res.json(await load());
}));

router.put('/', requireAuth, requireRole('admin'), asyncHandler(async (req, res) => {
  const value = clean(SCHEMA, req.body || {}, await load());
  const existing = await db.find('settings', 'homepage');
  if (existing) await db.update('settings', 'homepage', { value });
  else await db.insert('settings', { id: 'homepage', value });
  await db.logActivity(req.user.id, 'update_homepage', {});
  res.json(value);
}));

const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i;

// Ảnh trang chủ (hero, giảng viên, tin tức...) phải xem được khi chưa đăng nhập nên đi chung đường với ảnh bìa khoá học.
router.post('/image', requireAuth, requireRole('admin'), mediaUpload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Thiếu file ảnh' });
  if (!IMAGE_EXT.test(req.file.originalname || '') || !/^image\//.test(req.file.mimetype || '')) {
    return res.status(400).json({ error: 'Chỉ nhận ảnh JPG, PNG, WEBP hoặc GIF' });
  }
  const { url } = await storage.saveCover(req.file.buffer, req.file.originalname, req.file.mimetype);
  await db.logActivity(req.user.id, 'homepage_image_upload', {});
  res.status(201).json({ url });
}));

module.exports = router;
