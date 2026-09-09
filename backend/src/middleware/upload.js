const multer = require('multer');
const os = require('os');
const path = require('path');
const crypto = require('crypto');

// Nhận file vào bộ nhớ (buffer) rồi giao cho storage adapter (local hoặc R2) tự
// quyết định lưu ở đâu - route không cần biết đang chạy chế độ nào.
const memory = multer.memoryStorage();

// File PPT/PDF gốc có thể rất lớn (tới 500MB) - ghi thẳng ra đĩa tạm (streaming)
// thay vì giữ nguyên trong RAM suốt quá trình xử lý/convert, tránh server bị
// crash do hết bộ nhớ. Route dùng req.file.path rồi tự xoá file tạm sau khi xong.
const disk = multer.diskStorage({
  destination: os.tmpdir(),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '');
    cb(null, `cocuc-upload-${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  }
});

const mediaUpload = multer({ storage: memory, limits: { fileSize: 15 * 1024 * 1024 } });
const slideUpload = multer({ storage: memory, limits: { fileSize: 25 * 1024 * 1024 } });
const sourceFileUpload = multer({ storage: disk, limits: { fileSize: 500 * 1024 * 1024 } });

module.exports = { mediaUpload, slideUpload, sourceFileUpload };
