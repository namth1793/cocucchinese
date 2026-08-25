import { NavLink, useNavigate } from 'react-router-dom';
import { Home, RotateCcw, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

/**
 * Điều hướng riêng cho màn hình desktop (>=1024px). Trên mobile thành phần
 * này bị ẩn bằng CSS và thay bằng BottomNav — không có logic hay nội dung
 * nào bị nhân đôi, chỉ là hai cách trình bày cho cùng một điều hướng.
 */
export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const initial = user.name?.trim()?.[0]?.toUpperCase() || '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand"><Logo size="sm" /></div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Home size={18} /> Trang chủ
        </NavLink>
        <NavLink to="/review" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <RotateCcw size={18} /> Ôn tập
        </NavLink>
        {(user.role === 'admin' || user.role === 'teacher') && (
          <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <ShieldCheck size={18} /> Quản trị
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="navbar-avatar">{initial}</span>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.name}</span>
            <span className="sidebar-user-role">
              {user.role === 'admin' ? 'Quản trị viên' : user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
            </span>
          </div>
        </div>
        <button type="button" className="sidebar-logout" onClick={async () => { await logout(); navigate('/login'); }}>
          <LogOut size={16} /> Đăng xuất
        </button>
      </div>
    </aside>
  );
}
