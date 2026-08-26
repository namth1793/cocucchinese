import { ChevronRight, GraduationCap, Home, LogOut, RotateCcw, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const LEVEL_DOT_COLORS = ['#DC2626', '#059669', '#D97706', '#2563EB', '#7C3AED', '#DB2777'];

/**
 * Điều hướng riêng cho màn hình desktop (>=1024px). Trên mobile thành phần
 * này bị ẩn bằng CSS và thay bằng BottomNav — không có logic hay nội dung
 * nào bị nhân đôi, chỉ là hai cách trình bày cho cùng một điều hướng.
 * Nhóm "Cấp độ" có thể thu gọn/mở rộng, liệt kê thẳng các cấp độ HSK/YCT
 * thật lấy từ API (không phải danh mục tĩnh không có chức năng đứng sau).
 */
export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [levels, setLevels] = useState([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    if (!user) return;
    api.get('/levels').then((res) => {
      const sorted = [...res.data].sort((a, b) => (a.type === b.type ? a.order - b.order : a.type.localeCompare(b.type)));
      setLevels(sorted);
    }).catch(() => {});
  }, [user]);

  if (!user) return null;
  const initial = user.name?.trim()?.[0]?.toUpperCase() || '?';
  const levelActive = location.pathname.startsWith('/levels/');

  return (
    <aside className="sidebar">
      <div className="sidebar-brand"><Logo size="sm" /></div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <Home size={18} /> Trang chủ
        </NavLink>

        <div className="sidebar-section-label">Học tập</div>

        <button type="button" className={`sidebar-group-header ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)}>
          <GraduationCap size={18} /> Cấp độ
          <ChevronRight size={16} className="chevron" />
        </button>
        {open && (
          <div className="sidebar-group-items">
            {levels.map((lv, i) => (
              <NavLink
                key={lv.id}
                to={`/levels/${lv.id}`}
                className={({ isActive }) => `sidebar-sublink ${isActive || (levelActive && location.pathname.includes(lv.id)) ? 'active' : ''}`}
              >
                <span className="sidebar-sublink-dot" style={{ background: LEVEL_DOT_COLORS[i % LEVEL_DOT_COLORS.length] }} />
                {lv.name}
              </NavLink>
            ))}
            {levels.length === 0 && (
              <span className="sidebar-sublink" style={{ opacity: 0.6 }}>Đang tải...</span>
            )}
          </div>
        )}

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
