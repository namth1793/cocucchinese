import { useEffect } from 'react';

/**
 * Chống sao chép ở mức hợp lý trên trình duyệt: chặn chuột phải, chọn/copy văn bản,
 * và một số phím tắt (Ctrl+C/U/S). Không cam kết ngăn chặn tuyệt đối chụp/quay màn hình.
 */
export default function ProtectedContent({ children, className = '' }) {
  useEffect(() => {
    const blockContext = (e) => e.preventDefault();
    const blockKeys = (e) => {
      const key = e.key ? e.key.toLowerCase() : '';
      if (e.ctrlKey && ['c', 'u', 's'].includes(key)) e.preventDefault();
    };
    document.addEventListener('contextmenu', blockContext);
    document.addEventListener('keydown', blockKeys);
    return () => {
      document.removeEventListener('contextmenu', blockContext);
      document.removeEventListener('keydown', blockKeys);
    };
  }, []);

  return <div className={`protected-content ${className}`}>{children}</div>;
}
