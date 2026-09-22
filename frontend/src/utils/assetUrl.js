import { API_ORIGIN } from '../api/client';

/**
 * URL ảnh công khai (ảnh bìa...). Chế độ R2 lưu sẵn URL đầy đủ (https://...); chế độ local lưu đường dẫn
 * tương đối (/uploads/covers/...) nên cần nối với origin của backend - khi frontend và backend
 * chạy khác domain (Netlify + Railway) thì đường dẫn tương đối sẽ trỏ nhầm về frontend.
 */
export function assetUrl(url) {
  if (!url) return '';
  return /^(https?:|data:|blob:)/i.test(url) ? url : `${API_ORIGIN}${url}`;
}
