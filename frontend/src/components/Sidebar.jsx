import { ChevronRight, Home, LogOut, RotateCcw, ShieldCheck, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const LEVEL_DOT_COLORS = ['#DC2626', '#059669', '#D97706', '#2563EB', '#7C3AED', '#DB2777'];

const CATEGORIES = [
  {
    key: 'hsk_hskk', label: 'HSK & HSKK', emoji: '🎯',
    groups: [
      { key: 'HSK 3.0', label: 'HSK 3.0', emoji: '🌟' },
      { key: 'HSKK', label: 'HSKK', emoji: '🗣️' }
    ]
  },
  { key: 'kids', label: 'Tiếng Trung trẻ em', emoji: '👶' },
  { key: 'conversation', label: 'Tiếng Trung giao tiếp', emoji: '🗣️' }
];

function LevelLinks({ items }) {
  if (items.length === 0) {
    return <span className="sidebar-sublink" style={{ opacity: 0.6 }}>Chưa có mục nào.</span>;
  }
  return items.map((lv, i) => (
    <NavLink key={lv.id} to={`/levels/${lv.id}`} className={({ isActive }) => `sidebar-sublink ${isActive ? 'active' : ''}`}>
      <span className="sidebar-sublink-dot" style={{ background: LEVEL_DOT_COLORS[i % LEVEL_DOT_COLORS.length] }} />
      {lv.name}
    </NavLink>
  ));
}

/**
 * Cây "Khoá học" 3 tầng: Danh mục (HSK & HSKK / Trẻ em / Giao tiếp) -> nhóm
 * con (chỉ HSK & HSKK có nhóm con: HSK 3.0, HSKK) -> cấp độ/khoá học cụ thể.
 * Dữ liệu lấy thật từ API (trường category/group trên mỗi level), không phải
 * cây điều hướng tĩnh — cấp độ nào chưa có bài học sẽ tự hiện trạng thái rỗng
 * khi bấm vào, không phải link chết.
 */
function CourseTree() {
  const [levels, setLevels] = useState([]);
  const [openCats, setOpenCats] = useState(() => new Set());
  const [openGroups, setOpenGroups] = useState(() => new Set());

  useEffect(() => {
    api.get('/levels').then((res) => setLevels(res.data)).catch(() => {});
  }, []);

  const toggleCat = (key) => setOpenCats((s) => {
    const next = new Set(s);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const toggleGroup = (key) => setOpenGroups((s) => {
    const next = new Set(s);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const itemsFor = (catKey, groupKey) => levels
    .filter((lv) => lv.category === catKey && (groupKey === undefined || lv.group === groupKey))
    .sort((a, b) => a.order - b.order);

  return CATEGORIES.map((cat) => {
    const catOpen = openCats.has(cat.key);
    return (
      <div key={cat.key}>
        <button type="button" className={`sidebar-group-header ${catOpen ? 'open' : ''}`} onClick={() => toggleCat(cat.key)}>
          <span aria-hidden="true">{cat.emoji}</span> {cat.label}
          <ChevronRight size={16} className="chevron" />
        </button>
        {catOpen && (
          <div className="sidebar-group-items">
            {cat.groups ? cat.groups.map((g) => {
              const groupKey = `${cat.key}:${g.key}`;
              const groupOpen = openGroups.has(groupKey);
              return (
                <div key={g.key}>
                  <button
                    type="button"
                    className={`sidebar-group-header sidebar-subgroup-header ${groupOpen ? 'open' : ''}`}
                    onClick={() => toggleGroup(groupKey)}
                  >
                    <span aria-hidden="true">{g.emoji}</span> {g.label}
                    <ChevronRight size={14} className="chevron" />
                  </button>
                  {groupOpen && (
                    <div className="sidebar-group-items sidebar-group-items-nested">
                      <LevelLinks items={itemsFor(cat.key, g.key)} />
                    </div>
                  )}
                </div>
              );
            }) : (
              <LevelLinks items={itemsFor(cat.key, undefined)} />
            )}
          </div>
        )}
      </div>
    );
  });
}

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

        <div className="sidebar-section-label">Khoá học</div>
        <CourseTree />

        <div className="sidebar-section-label">Học tập</div>
        <NavLink to="/review" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <RotateCcw size={18} /> Ôn tập
        </NavLink>

        <NavLink to="/instructors" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          <UserRound size={18} /> Giới thiệu giảng viên
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
