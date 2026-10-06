import { createContext, useContext, useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Gift, Lock } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

/** Thông tin quyền của bài đang mở: { freeTrial, courseId, courseName } - null khi chưa tải xong. */
const LessonAccessContext = createContext(null);
export const useLessonAccess = () => useContext(LessonAccessContext);

function AccessDenied({ courseId }) {
  const { user } = useAuth();
  return (
    <div className="card access-denied">
      <span className="access-denied-icon"><Lock size={26} /></span>
      <h2 style={{ margin: '8px 0 4px' }}>
        {courseId ? 'Bài này dành cho học viên đã đăng ký khoá học' : 'Bạn chưa được cấp quyền truy cập khoá học này'}
      </h2>
      <p style={{ color: 'var(--ink-soft)', margin: '0 0 16px' }}>
        {courseId
          ? 'Bài 1 và bài 2 của mỗi khoá được học thử miễn phí. Từ bài 3 trở đi, bạn cần đăng ký khoá học để được cấp quyền học bằng email của mình.'
          : 'Nội dung chỉ dành cho học viên đã đăng ký và thanh toán khoá học. Hãy xem thông tin khoá học hoặc liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn.'}
      </p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {courseId
          ? <Link to={`/courses/${courseId}`} className="btn-primary">Xem khoá học & đăng ký</Link>
          : <Link to="/courses" className="btn-primary">Xem các khoá học</Link>}
        {user
          ? <Link to="/" className="btn-secondary">Khoá học của tôi</Link>
          : <Link to="/login" className="btn-secondary">Đăng nhập</Link>}
      </div>
    </div>
  );
}

/** Băng nhắc ở đầu mọi trang của bài học thử: nội dung mở miễn phí, khoá chính bắt đầu từ bài 3. */
function TrialBanner({ info }) {
  const { user } = useAuth();
  return (
    <div className="trial-banner">
      <span className="trial-banner-icon"><Gift size={18} /></span>
      <span className="trial-banner-text">
        <b>Bạn đang học thử miễn phí</b>
        {' '}— bài 1 và 2 {info.courseName ? <>của khoá <b>{info.courseName}</b> </> : ''}mở cho mọi người. Đăng ký khoá học để học tiếp từ bài 3
        {user ? '.' : ' và lưu tiến độ học.'}
      </span>
      <Link to={`/courses/${info.courseId}`} className="btn-primary trial-banner-btn">Đăng ký khoá học</Link>
    </div>
  );
}

/**
 * Chặn cả cụm route con nếu không có quyền. Đây chỉ là lớp giao diện - việc chặn thật sự nằm
 * ở backend (mọi API nội dung đều kiểm tra quyền); gate này giúp hiển thị thông báo rõ ràng
 * thay vì các trang trống/lỗi khi ai đó gõ thẳng đường dẫn.
 */
function useGate(checkUrl) {
  const [state, setState] = useState({ status: 'loading' });
  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    if (!checkUrl) { setState({ status: 'ok' }); return undefined; }
    api.get(checkUrl)
      .then((res) => { if (!cancelled) setState({ status: 'ok', data: res.data }); })
      .catch((err) => {
        if (cancelled) return;
        if (err?.response?.status === 403) setState({ status: 'denied', courseId: err.response.data?.courseId });
        else setState({ status: 'ok' });
      });
    return () => { cancelled = true; };
  }, [checkUrl]);
  return state;
}

function GateView({ state, children }) {
  if (state.status === 'loading') return <p className="empty-state">Đang tải...</p>;
  if (state.status === 'denied') return <AccessDenied courseId={state.courseId} />;
  return children || <Outlet />;
}

export function LessonGate({ banner = true }) {
  const { pathname } = useLocation();
  const lessonId = (pathname.match(/^\/lessons\/([^/]+)/) || [])[1];
  const state = useGate(lessonId ? `/lessons/${lessonId}/access` : null);
  const info = state.data || null;
  return (
    <LessonAccessContext.Provider value={info}>
      <GateView state={state}>
        {banner && info?.freeTrial && <TrialBanner info={info} />}
        <Outlet />
      </GateView>
    </LessonAccessContext.Provider>
  );
}

export function LevelGate() {
  const { pathname } = useLocation();
  const levelId = (pathname.match(/^\/levels\/([^/]+)/) || [])[1];
  return <GateView state={useGate(levelId ? `/levels/${levelId}` : null)} />;
}
