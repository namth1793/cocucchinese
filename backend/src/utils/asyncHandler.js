/**
 * Bọc route handler/middleware bất đồng bộ (dùng async/await để gọi db.*) để lỗi
 * (promise reject) được chuyển cho middleware xử lý lỗi ở server.js qua next(err),
 * thay vì làm treo request hoặc crash tiến trình - Express 4 không tự bắt lỗi ném
 * ra từ một async function như Express 5.
 */
module.exports = function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
