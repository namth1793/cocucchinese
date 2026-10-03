import { API_ORIGIN } from '../api/client';

/**
 * Mở file đã tải lên trong tab mới. URL CDN công khai (chế độ R2) mở thẳng; file lưu cục bộ
 * (/uploads/media, cần đăng nhập) thì tải kèm token thành blob rồi mới mở.
 */
export async function openAuthFile(url, filename) {
  if (/^https?:\/\//i.test(url)) {
    window.open(url, '_blank', 'noopener');
    return;
  }
  // Mở tab trước (trong cùng thao tác bấm) để không bị chặn popup, rồi điền nội dung sau.
  const win = window.open('', '_blank');
  const token = localStorage.getItem('cocuc_token');
  const res = await fetch(`${API_ORIGIN}${url}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) { if (win) win.close(); window.alert('Không mở được tài liệu.'); return; }
  const objectUrl = URL.createObjectURL(await res.blob());
  if (win) win.location.href = objectUrl;
  else {
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = filename || '';
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}
