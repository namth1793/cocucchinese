import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { COURSE_CATEGORIES } from '../constants/courseCategories';
import Logo from './Logo';

function LevelLinks({ items }) {
  if (items.length === 0) {
    return <span className="sidebar-sublink sidebar-sublink-empty">Chưa có khoá nào</span>;
  }
  return items.map((lv) => (
    <NavLink key={lv.id} to={`/levels/${lv.id}`} className={({ isActive }) => `sidebar-sublink ${isActive ? 'active' : ''}`}>
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

  return COURSE_CATEGORIES.map((cat) => {
    const catOpen = openCats.has(cat.key);
    return (
      <div key={cat.key}>
        <button type="button" className={`sidebar-group-header ${catOpen ? 'open' : ''}`} onClick={() => toggleCat(cat.key)}>
          {cat.label}
          <ChevronRight size={15} className="chevron" />
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
                    {g.label}
                    <ChevronRight size={13} className="chevron" />
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
          Trang chủ
        </NavLink>

        <div className="sidebar-section-label">Khoá học của tôi</div>
        <CourseTree />
        <NavLink to="/courses" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          Khám phá khoá học
        </NavLink>

        <div className="sidebar-section-label">Học tập</div>
        <NavLink to="/review" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          Ôn tập
        </NavLink>

        <NavLink to="/instructors" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
          Giới thiệu giảng viên
        </NavLink>

        {(user.role === 'admin' || user.role === 'teacher') && (
          <NavLink to="/admin" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            Quản trị
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <span className="sidebar-avatar">{initial}</span>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user.name}</span>
            <span className="sidebar-user-role">
              {user.role === 'admin' ? 'Quản trị viên' : user.role === 'teacher' ? 'Giáo viên' : 'Học sinh'}
            </span>
          </div>
        </div>
        <button type="button" className="sidebar-logout" onClick={async () => { await logout(); navigate('/login'); }}>
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
