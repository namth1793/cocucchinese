import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowLeftCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../components/Logo';

const TABS = [
  { path: 'lessons', label: 'Bài học' },
  { path: 'levels', label: 'Cấp độ' },
  { path: 'words', label: 'Từ vựng' },
  { path: 'grammar', label: 'Ngữ pháp' },
  { path: 'sentences', label: 'Câu' },
  { path: 'slides', label: 'PPT' },
  { path: 'songs', label: 'Bài hát' },
  { path: 'videos', label: 'Video' },
  { path: 'instructors', label: 'Giảng viên' },
  { path: 'users', label: 'Người dùng', adminOnly: true }
];

export default function AdminLayout() {
  const { user } = useAuth();
  return (
    <div className="admin-shell">
      <header className="navbar">
        <Link to="/" style={{ display: 'flex' }}><Logo size="sm" /></Link>
        <div className="navbar-actions">
          <span className="navbar-user-chip">
            <span className="navbar-avatar">{user.name?.trim()?.[0]?.toUpperCase() || '?'}</span>
            <span className="navbar-user">{user.name}</span>
          </span>
          <Link to="/" className="navbar-link"><ArrowLeftCircle size={14} style={{ marginRight: 4, verticalAlign: -2 }} />Về trang học</Link>
        </div>
      </header>
      <nav className="admin-tabs">
        {TABS.filter((t) => !t.adminOnly || user.role === 'admin').map((t) => (
          <NavLink key={t.path} to={t.path} className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
            {t.label}
          </NavLink>
        ))}
      </nav>
      <div className="admin-body">
        <Outlet />
      </div>
    </div>
  );
}
