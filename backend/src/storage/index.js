/**
 * Chọn nơi lưu file khi khởi động: mặc định lưu ổ đĩa cục bộ (không cần cấu
 * hình gì, phù hợp dev/demo). Khi khai báo đủ biến môi trường R2_* (xem
 * .env.example), tự động chuyển sang Cloudflare R2 - không cần đổi code ở
 * nơi khác vì cả 2 adapter cùng interface: saveMedia / saveSlidePage / sendSlidePage.
 */
const hasR2Config = !!(
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  process.env.R2_BUCKET_MEDIA &&
  process.env.R2_BUCKET_SLIDES
);

module.exports = hasR2Config ? require('./r2Storage') : require('./localStorage');
