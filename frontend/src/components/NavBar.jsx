import { Link, useNavigate } from 'react-router-dom';
import { LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PinyinToggle from './PinyinToggle';
import Logo from './Logo';

/**
 * Trên mobile đây là thanh điều hướng đầy đủ (logo, quản trị, người dùng, đăng xuất).
 * Trên desktop, các phần đó đã có trong Sidebar nên chỉ giữ lại nút Ẩn/hiện Pinyin
 * để thanh trên cùng gọn nhẹ, tránh lặp điều hướng. Việc ẩn/hiện xử lý hoàn toàn
 * bằng CSS (.navbar-mobile-only) để không cần nhân đôi state hay logic.
 */
export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;
  const initial = user.name?.trim()?.[0]?.toUpperCase() || '?';

  return (
    <header className="navbar">
      <Link to="/" className="navbar-mobile-only">
        <Logo size="sm" />
      </Link>
      <div className="navbar-actions">
        <PinyinToggle />
        <div className="navbar-mobile-only navbar-mobile-actions">
          {(user.role === 'admin' || user.role === 'teacher') && (
            <Link to="/admin" className="navbar-link">
              <ShieldCheck size={14} style={{ marginRight: 4, verticalAlign: -2 }} />
              Quản trị
            </Link>
          )}
          <span className="navbar-user-chip">
            <span className="navbar-avatar">{initial}</span>
            <span className="navbar-user">{user.name}</span>
          </span>
          <button
            type="button"
            className="navbar-logout"
            aria-label="Đăng xuất"
            onClick={async () => { await logout(); navigate('/login'); }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
