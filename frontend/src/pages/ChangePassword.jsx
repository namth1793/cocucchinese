import { useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

// Dùng chung cho học viên (/account/password) và trang quản trị (/admin/password).
export default function ChangePassword() {
  const { user } = useAuth();
  const empty = { currentPassword: '', newPassword: '', confirm: '' };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => { setForm({ ...form, [key]: e.target.value }); setDone(false); };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword.length < 6) return setError('Mật khẩu mới phải có ít nhất 6 ký tự');
    if (form.newPassword !== form.confirm) return setError('Nhập lại mật khẩu mới không khớp');
    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setForm(empty);
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <h2 style={{ marginTop: 0 }}>Đổi mật khẩu</h2>
      <p style={{ color: 'var(--ink-soft)', marginTop: -4 }}>Tài khoản: <strong>{user?.email}</strong></p>

      <form className="admin-form" onSubmit={submit}>
        {error && <div className="form-error">{error}</div>}
        {done && <div className="form-success">Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.</div>}
        <div className="form-field">
          <label htmlFor="cp-current">Mật khẩu hiện tại</label>
          <input id="cp-current" type="password" autoComplete="current-password" value={form.currentPassword} onChange={set('currentPassword')} required />
        </div>
        <div className="form-field">
          <label htmlFor="cp-new">Mật khẩu mới (ít nhất 6 ký tự)</label>
          <input id="cp-new" type="password" autoComplete="new-password" value={form.newPassword} onChange={set('newPassword')} required minLength={6} maxLength={128} />
        </div>
        <div className="form-field">
          <label htmlFor="cp-confirm">Nhập lại mật khẩu mới</label>
          <input id="cp-confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} required />
        </div>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Đang lưu…' : 'Đổi mật khẩu'}</button>
      </form>
    </div>
  );
}
