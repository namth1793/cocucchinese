import useAuthMedia from '../utils/useAuthMedia';

/**
 * Ảnh minh hoạ có 2 kiểu URL tuỳ chế độ lưu trữ của backend:
 * - Chế độ R2 (production): imageUrl là URL công khai đầy đủ (CDN), hiển thị
 *   thẳng qua <img src> như bình thường, không cần fetch/token gì cả.
 * - Chế độ local (dev): imageUrl là đường dẫn tương đối (/uploads/media/...)
 *   được phục vụ qua route yêu cầu đăng nhập, nên <img src> thuần không gửi
 *   kèm được header xác thực - phải tự fetch bằng Bearer token rồi hiển thị
 *   dưới dạng blob URL.
 */
export default function AuthImage({ src, alt = '', className, style }) {
  const url = useAuthMedia(src);
  if (!url) return <div className={className} style={{ ...style, background: 'var(--bg-alt)' }} />;
  return <img className={className} style={style} src={url} alt={alt} />;
}
