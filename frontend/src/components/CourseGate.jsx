import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import api from '../api/client';

function AccessDenied() {
  return (
    <div className="card access-denied">
      <span className="access-denied-icon"><Lock size={26} /></span>
      <h2 style={{ margin: '8px 0 4px' }}>Bạn chưa được cấp quyền truy cập khoá học này</h2>
      <p style={{ color: 'var(--ink-soft)', margin: '0 0 16px' }}>
        Nội dung chỉ dành cho học viên đã đăng ký và thanh toán khoá học. Hãy xem thông tin khoá học hoặc liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn.
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/courses" className="btn-primary">Xem các khoá học</Link>
        <Link to="/" className="btn-secondary">Khoá học của tôi</Link>
      </div>
    </div>
  );
}

/**
 * Chặn cả cụm route con nếu học viên chưa được cấp quyền. Đây chỉ là lớp giao diện - việc chặn
 * thật sự nằm ở backend (mọi API nội dung đều kiểm tra quyền); gate này giúp hiển thị thông báo
 * rõ ràng thay vì các trang trống/lỗi khi ai đó gõ thẳng đường dẫn.
 */
function useGate(checkUrl) {
  const [state, setState] = useState('loading');
  useEffect(() => {
    let cancelled = false;
    setState('loading');
    if (!checkUrl) { setState('ok'); return undefined; }
    api.get(checkUrl)
      .then(() => { if (!cancelled) setState('ok'); })
      .catch((err) => { if (!cancelled) setState(err?.response?.status === 403 ? 'denied' : 'ok'); });
    return () => { cancelled = true; };
  }, [checkUrl]);
  return state;
}

function GateView({ state }) {
  if (state === 'loading') return <p className="empty-state">Đang tải...</p>;
  if (state === 'denied') return <AccessDenied />;
  return <Outlet />;
}

export function LessonGate() {
  const { pathname } = useLocation();
  const lessonId = (pathname.match(/^\/lessons\/([^/]+)/) || [])[1];
  return <GateView state={useGate(lessonId ? `/lessons/${lessonId}` : null)} />;
}

export function LevelGate() {
  const { pathname } = useLocation();
  const levelId = (pathname.match(/^\/levels\/([^/]+)/) || [])[1];
  return <GateView state={useGate(levelId ? `/levels/${levelId}` : null)} />;
}
