import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { ChevronRight, GraduationCap, LogOut, Plus, ShieldCheck, Trash2, UserRound, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { COURSE_CATEGORIES, LEVEL_TYPE_OPTIONS } from '../../constants/courseCategories';
import Logo from '../../components/Logo';

const LEVEL_DOT_COLORS = ['#DC2626', '#059669', '#D97706', '#2563EB', '#7C3AED', '#DB2777'];
const EMPTY_LEVEL_FORM = { code: '', name: '', type: 'HSK', order: 1 };

function AdminLevelLinks({ items, onDelete }) {
  if (items.length === 0) return <span className="sidebar-sublink" style={{ opacity: 0.5, fontSize: 12 }}>Trống</span>;
  return items.map((lv, i) => (
    <NavLink key={lv.id} to={`/admin/levels/${lv.id}`} className={({ isActive }) => `sidebar-sublink admin-level-link ${isActive ? 'active' : ''}`}>
      <span className="sidebar-sublink-dot" style={{ background: LEVEL_DOT_COLORS[i % LEVEL_DOT_COLORS.length] }} />
      <span style={{ flex: 1 }}>{lv.code} — {lv.name}</span>
      <button type="button" className="admin-level-delete" title="Xoá cấp độ" onClick={(e) => onDelete(e, lv)}>
        <Trash2 size={13} />
      </button>
    </NavLink>
  ));
}

function AdminLevelsNav() {
  const [levels, setLevels] = useState([]);
  const [openCats, setOpenCats] = useState(() => new Set(COURSE_CATEGORIES.map((c) => c.key)));
  const [openGroups, setOpenGroups] = useState(() => new Set());
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY_LEVEL_FORM);

  const load = () => { api.get('/levels').then((res) => setLevels(res.data)); };
  useEffect(load, []);

  const toggleCat = (key) => setOpenCats((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });
  const toggleGroup = (key) => setOpenGroups((s) => { const n = new Set(s); n.has(key) ? n.delete(key) : n.add(key); return n; });

  const itemsFor = (catKey, groupKey) => levels
    .filter((lv) => lv.category === catKey && (groupKey === undefined || lv.group === groupKey))
    .sort((a, b) => a.order - b.order);

  const createLevel = async (e) => {
    e.preventDefault();
    await api.post('/levels', { ...form, order: Number(form.order) || 1 });
    setForm(EMPTY_LEVEL_FORM);
    setAdding(false);
    load();
  };

  const deleteLevel = async (e, lv) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm(`Xoá cấp độ "${lv.name}"? Bài học/nội dung bên trong sẽ không còn hiển thị cho cấp độ này.`)) return;
    await api.delete(`/levels/${lv.id}`);
    load();
  };

  return (
    <>
      {COURSE_CATEGORIES.map((cat) => {
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
                          <AdminLevelLinks items={itemsFor(cat.key, g.key)} onDelete={deleteLevel} />
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <AdminLevelLinks items={itemsFor(cat.key, undefined)} onDelete={deleteLevel} />
                )}
              </div>
            )}
          </div>
        );
      })}

      {adding ? (
        <form className="admin-level-add-form" onSubmit={createLevel}>
          <input placeholder="Mã (VD: HSK4)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          <input placeholder="Tên hiển thị" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {LEVEL_TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input type="number" placeholder="Thứ tự" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, padding: '7px 0', fontSize: 12.5 }}>Tạo</button>
            <button type="button" className="admin-level-cancel" onClick={() => { setAdding(false); setForm(EMPTY_LEVEL_FORM); }}><X size={14} /></button>
          </div>
        </form>
      ) : (
        <button type="button" className="sidebar-sublink admin-level-add-btn" onClick={() => setAdding(true)}>
          <Plus size={14} /> Thêm cấp độ
        </button>
      )}
    </>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initial = user.name?.trim()?.[0]?.toUpperCase() || '?';

  const doLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="app-shell">
      <aside className="sidebar admin-sidebar">
        <div className="sidebar-brand"><Logo size="sm" /></div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Khoá học</div>
          <AdminLevelsNav />

          <div className="sidebar-section-label">Khác</div>
          <NavLink to="/admin/instructors" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <UserRound size={18} /> Giảng viên
          </NavLink>
          {user.role === 'admin' && (
            <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              <ShieldCheck size={18} /> Người dùng
            </NavLink>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <span className="navbar-avatar">{initial}</span>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user.name}</span>
              <span className="sidebar-user-role">{user.role === 'admin' ? 'Quản trị viên' : 'Giáo viên'}</span>
            </div>
          </div>
          <button type="button" className="sidebar-logout" onClick={doLogout}>
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </aside>

      <div className="app-content-col">
        <header className="navbar">
          <Link to="/admin" className="navbar-mobile-only"><Logo size="sm" /></Link>
          <div className="navbar-actions">
            <span className="navbar-user-chip">
              <span className="navbar-avatar">{initial}</span>
              <span className="navbar-user">{user.name}</span>
            </span>
            <button type="button" className="navbar-logout navbar-mobile-only" aria-label="Đăng xuất" onClick={doLogout}>
              <LogOut size={15} />
            </button>
          </div>
        </header>

        <nav className="admin-tabs navbar-mobile-only">
          <MobileLevelTabs />
          <NavLink to="/admin/instructors" className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
            <GraduationCap size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Giảng viên
          </NavLink>
          {user.role === 'admin' && (
            <NavLink to="/admin/users" className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
              <ShieldCheck size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Người dùng
            </NavLink>
          )}
        </nav>

        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function MobileLevelTabs() {
  const [levels, setLevels] = useState([]);
  useEffect(() => { api.get('/levels').then((res) => setLevels(res.data)); }, []);
  return levels.map((lv) => (
    <NavLink key={lv.id} to={`/admin/levels/${lv.id}`} className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>
      {lv.code}
    </NavLink>
  ));
}
