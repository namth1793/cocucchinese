import { Link, Outlet } from 'react-router-dom';
import { GraduationCap, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

/** Khung cho các trang công khai (danh sách khoá học, chi tiết, đăng ký mua) - không cần đăng nhập. */
export default function PublicLayout() {
  const { user } = useAuth();
  const isStaff = user && (user.role === 'admin' || user.role === 'teacher');
  return (
    <div className="pub-shell">
      <header className="pub-header">
        <Link to="/courses" className="pub-brand"><Logo size="sm" /></Link>
        <nav className="pub-nav">
          <Link to="/courses" className="pub-nav-link"><GraduationCap size={15} /> Khoá học</Link>
          {user ? (
            <Link to={isStaff ? '/admin' : '/'} className="btn-primary pub-nav-cta">{isStaff ? 'Quản trị' : 'Vào học'}</Link>
          ) : (
            <Link to="/login" className="btn-primary pub-nav-cta"><LogIn size={15} /> Đăng nhập</Link>
          )}
        </nav>
      </header>
      <main className="pub-main">
        <Outlet />
      </main>
      <footer className="pub-footer">HSK 360 · Học tiếng Trung HSK / YCT</footer>
    </div>
  );
}
