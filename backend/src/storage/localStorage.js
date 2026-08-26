const fs = require('fs');
const path = require('path');

const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function safeExt(originalname) {
  return path.extname(originalname || '') || '';
}

function randomName(prefix, originalname) {
  return `${prefix}${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt(originalname)}`;
}

/**
 * Lưu trên ổ đĩa cục bộ của server - dùng cho môi trường dev/demo, không cần
 * tài khoản cloud. Dùng khi KHÔNG khai báo biến môi trường R2_*.
 */
async function saveMedia(buffer, originalname) {
  const dir = path.join(UPLOAD_ROOT, 'media');
  ensureDir(dir);
  const filename = randomName('', originalname);
  fs.writeFileSync(path.join(dir, filename), buffer);
  return { url: `/uploads/media/${filename}`, key: filename };
}

async function saveSlidePage(slideId, buffer, originalname) {
  const dir = path.join(UPLOAD_ROOT, 'slides', slideId);
  ensureDir(dir);
  const filename = randomName('page-', originalname);
  fs.writeFileSync(path.join(dir, filename), buffer);
  return { key: filename };
}

/** Trả về true nếu đã gửi file, false nếu không tìm thấy (route tự trả 404). */
async function sendSlidePage(res, slideId, key) {
  const filePath = path.join(UPLOAD_ROOT, 'slides', slideId, key);
  if (!fs.existsSync(filePath)) return false;
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    'Content-Disposition': 'inline',
    'X-Content-Type-Options': 'nosniff'
  });
  res.sendFile(filePath);
  return true;
}

module.exports = { mode: 'local', saveMedia, saveSlidePage, sendSlidePage };
