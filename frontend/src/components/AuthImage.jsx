import { useEffect, useState } from 'react';

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
  const isPublicUrl = /^https?:\/\//i.test(src || '');
  const [url, setUrl] = useState(isPublicUrl ? src : null);

  useEffect(() => {
    if (!src || isPublicUrl) { setUrl(src || null); return undefined; }
    let objectUrl;
    let cancelled = false;
    const token = localStorage.getItem('cocuc_token');
    fetch(src, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => (res.ok ? res.blob() : Promise.reject(res)))
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => { if (!cancelled) setUrl(null); });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, isPublicUrl]);

  if (!url) return <div className={className} style={{ ...style, background: 'var(--bg-alt)' }} />;
  return <img className={className} style={style} src={url} alt={alt} />;
}
