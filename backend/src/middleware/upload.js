const multer = require('multer');

// Nhận file vào bộ nhớ (buffer) rồi giao cho storage adapter (local hoặc R2) tự
// quyết định lưu ở đâu - route không cần biết đang chạy chế độ nào.
const memory = multer.memoryStorage();

const mediaUpload = multer({ storage: memory, limits: { fileSize: 15 * 1024 * 1024 } });
const slideUpload = multer({ storage: memory, limits: { fileSize: 25 * 1024 * 1024 } });
const sourceFileUpload = multer({ storage: memory, limits: { fileSize: 80 * 1024 * 1024 } });

module.exports = { mediaUpload, slideUpload, sourceFileUpload };
