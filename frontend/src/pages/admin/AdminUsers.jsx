import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [tab, setTab] = useState('users');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'teacher' });
  const [error, setError] = useState('');

  const loadUsers = () => api.get('/users').then((res) => setUsers(res.data));
  const loadLogs = () => api.get('/users/logs/all').then((res) => setLogs(res.data));

  useEffect(() => { loadUsers(); }, []);
  useEffect(() => { if (tab === 'logs') loadLogs(); }, [tab]);

  const createUser = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/users', form);
      setForm({ name: '', email: '', password: '', role: 'teacher' });
      loadUsers();
    } catch (err) {
      setError(err?.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const resetPassword = async (u) => {
    if (!window.confirm(`Cấp lại mật khẩu tạm cho ${u.email}? Mật khẩu cũ sẽ không dùng được nữa và mọi thiết bị sẽ bị đăng xuất.`)) return;
    const { data } = await api.post(`/users/${u.id}/reset-password`);
    window.prompt(`Mật khẩu tạm cho ${data.email} (sao chép và gửi cho người dùng):`, data.tempPassword);
    loadUsers();
  };

  const approve = async (u) => {
    await api.put(`/users/${u.id}/status`, { status: 'active' });
    loadUsers();
  };

  const reject = async (u) => {
    if (!window.confirm(`Từ chối và xoá đăng ký của ${u.email}?`)) return;
    await api.delete(`/users/${u.id}/pending`);
    loadUsers();
  };

  const pending = users.filter((u) => u.status === 'pending')
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  const toggleStatus = async (u) => {
    await api.put(`/users/${u.id}/status`, { status: u.status === 'locked' ? 'active' : 'locked' });
    loadUsers();
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Quản lý người dùng & nhật ký</h2>

      <div className="tabs">
        <button type="button" className={`tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          Người dùng{pending.length > 0 && <span className="pending-count">{pending.length} chờ duyệt</span>}
        </button>
        <button type="button" className={`tab-btn ${tab === 'logs' ? 'active' : ''}`} onClick={() => setTab('logs')}>Nhật ký hoạt động</button>
      </div>

      {tab === 'users' && (
        <>
          {pending.length > 0 && (
            <section className="card pending-users">
              <h3 style={{ marginTop: 0 }}>Tài khoản chờ duyệt ({pending.length})</h3>
              <p className="page-sub" style={{ marginTop: 0 }}>Học viên tự đăng ký ở trang đăng nhập. Chỉ đăng nhập được sau khi bạn bấm <b>Duyệt</b>.</p>
              <table className="admin-table">
                <thead><tr><th>Tên</th><th>Email</th><th>Điện thoại</th><th>Đăng ký lúc</th><th /></tr></thead>
                <tbody>
                  {pending.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.phone}</td>
                      <td>{u.createdAt ? new Date(u.createdAt).toLocaleString('vi-VN') : ''}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <button type="button" className="btn-primary" onClick={() => approve(u)}>Duyệt</button>{' '}
                        <button type="button" className="btn-danger" onClick={() => reject(u)}>Từ chối</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <form className="admin-form" onSubmit={createUser}>
            <h3 style={{ margin: 0 }}>Tạo tài khoản giáo viên/quản trị</h3>
            {error && <div className="form-error">{error}</div>}
            <div className="admin-form-row">
              <div className="form-field"><label>Họ tên</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-field"><label>Email</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
            </div>
            <div className="admin-form-row">
              <div className="form-field"><label>Mật khẩu</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mặc định: 123456" /></div>
              <div className="form-field">
                <label>Vai trò</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="teacher">Giáo viên</option>
                  <option value="admin">Quản trị</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn-primary">+ Tạo tài khoản</button>
          </form>

          <table className="admin-table" style={{ marginTop: 16 }}>
            <thead>
              <tr><th>Tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Thiết bị</th><th /></tr>
            </thead>
            <tbody>
              {users.filter((u) => u.status !== 'pending').map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>{u.status === 'locked' ? '🔒 Đã khoá' : '✅ Hoạt động'}</td>
                  <td>{u.sessions}</td>
                  <td>
                    <button type="button" className={u.status === 'locked' ? 'btn-secondary' : 'btn-danger'} onClick={() => toggleStatus(u)}>
                      {u.status === 'locked' ? 'Mở khoá' : 'Khoá'}
                    </button>{' '}
                    <button type="button" className="btn-secondary" style={{ padding: '8px 12px', fontSize: 13 }} onClick={() => resetPassword(u)}>Cấp lại MK</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {tab === 'logs' && (
        <table className="admin-table">
          <thead><tr><th>Thời gian</th><th>Loại</th><th>Chi tiết</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{new Date(l.createdAt).toLocaleString('vi-VN')}</td>
                <td>{l.type}</td>
                <td><code style={{ fontSize: 11 }}>{JSON.stringify(l.meta)}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
