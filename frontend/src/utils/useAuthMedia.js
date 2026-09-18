import { useEffect, useState } from 'react';
import { API_ORIGIN } from '../api/client';

/**
 * Giống AuthImage nhưng dùng chung cho mọi loại file tĩnh yêu cầu đăng nhập
 * (/uploads/media/...) - ảnh, audio... Ở chế độ R2 (production) src đã là URL
 * CDN công khai nên trả về thẳng, không cần fetch.
 */
export default function useAuthMedia(src) {
  const isPublicUrl = /^https?:\/\//i.test(src || '');
  const [url, setUrl] = useState(isPublicUrl ? src : null);

  useEffect(() => {
    if (!src || isPublicUrl) { setUrl(src || null); return undefined; }
    let objectUrl;
    let cancelled = false;
    const token = localStorage.getItem('cocuc_token');
    fetch(`${API_ORIGIN}${src}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
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

  return url;
}
