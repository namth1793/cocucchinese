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

/** Ảnh bìa khoá học - lưu riêng thư mục covers vì được phục vụ công khai (trang danh sách khoá học không cần đăng nhập). */
async function saveCover(buffer, originalname) {
  const dir = path.join(UPLOAD_ROOT, 'covers');
  ensureDir(dir);
  const filename = randomName('cover-', originalname);
  fs.writeFileSync(path.join(dir, filename), buffer);
  return { url: `/uploads/covers/${filename}`, key: filename };
}

/** File lớn (đề thi thử...) - nhận đường dẫn file tạm trên đĩa, tránh giữ hết trong RAM. */
async function saveExamFile(tmpFilePath, originalname) {
  const dir = path.join(UPLOAD_ROOT, 'media');
  ensureDir(dir);
  const filename = randomName('exam-', originalname);
  fs.copyFileSync(tmpFilePath, path.join(dir, filename));
  return { url: `/uploads/media/${filename}` };
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

/**
 * Lưu file PowerPoint/tài liệu gốc của bộ bài giảng - chỉ giáo viên/admin tải
 * lên và tải về được (route tự kiểm tra role), KHÔNG hiển thị/convert cho học
 * sinh. Mỗi bộ bài giảng chỉ giữ 1 file gốc - tải lên lại sẽ ghi đè bản cũ.
 * Nhận đường dẫn file tạm trên đĩa (route tự xoá sau khi gọi xong) thay vì
 * buffer trong RAM - file gốc có thể tới 500MB, tránh giữ hết trong bộ nhớ.
 */
async function saveSlideSource(slideId, tmpFilePath, originalname) {
  const dir = path.join(UPLOAD_ROOT, 'slides', slideId);
  ensureDir(dir);
  const filename = `source${safeExt(originalname)}`;
  fs.copyFileSync(tmpFilePath, path.join(dir, filename));
  return { fileName: filename };
}

async function sendSlideSource(res, slideId, fileName, downloadName) {
  const filePath = path.join(UPLOAD_ROOT, 'slides', slideId, fileName);
  if (!fs.existsSync(filePath)) return false;
  res.set({
    'Cache-Control': 'no-store',
    'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadName || fileName)}"`
  });
  res.sendFile(filePath);
  return true;
}

/** Xoá toàn bộ file (trang ảnh + file gốc) của 1 bộ bài giảng - dùng khi admin xoá deck để tải lại từ đầu. */
async function deleteSlideDeck(slideId) {
  const dir = path.join(UPLOAD_ROOT, 'slides', slideId);
  fs.rmSync(dir, { recursive: true, force: true });
}

module.exports = { mode: 'local', saveMedia, saveCover, saveExamFile, saveSlidePage, sendSlidePage, saveSlideSource, sendSlideSource, deleteSlideDeck };
