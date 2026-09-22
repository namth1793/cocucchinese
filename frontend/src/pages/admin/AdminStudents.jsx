import { useEffect, useState } from 'react';
import api from '../../api/client';
import StatusBadge from '../../components/StatusBadge';
import { ENROLLMENT_STATUS_LABEL, ORDER_STATUS_LABEL, formatVnd } from '../../constants/enrollment';

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString('vi-VN') : '—');

/** Hiển thị tài khoản/mật khẩu tạm 1 lần sau khi cấp quyền để admin gửi cho học viên. */
function CredentialsNotice({ notice, onClose }) {
  if (!notice) return null;
  return (
    <div className="card notice-card">
      <b>{notice.message}</b>
      {notice.tempPassword && (
        <p style={{ margin: '8px 0 0' }}>
          Tài khoản mới: <code>{notice.email}</code> · mật khẩu tạm: <code className="temp-pass">{notice.tempPassword}</code><br />
          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>Mật khẩu chỉ hiển thị một lần này - hãy gửi cho học viên (họ chưa tự đặt mật khẩu).</span>
        </p>
      )}
      {!notice.tempPassword && notice.accountCreated && (
        <p style={{ margin: '8px 0 0', fontSize: 13 }}>Tài khoản mới đã tạo với mật khẩu học viên tự đặt lúc đăng ký.</p>
      )}
      <button type="button" className="btn-secondary" style={{ marginTop: 10 }} onClick={onClose}>Đóng</button>
    </div>
  );
}

function OrdersTab({ setNotice, onChanged }) {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [busy, setBusy] = useState('');

  const load = () => api.get('/orders', { params: filter ? { status: filter } : {} }).then((res) => setOrders(res.data));
  useEffect(() => { load(); }, [filter]);

  const confirm = async (o) => {
    if (!window.confirm(`Xác nhận đã nhận ${formatVnd(o.amount)} từ ${o.email} và cấp quyền học "${o.courseName}"?`)) return;
    setBusy(o.id);
    try {
      const { data } = await api.post(`/orders/${o.id}/confirm`);
      setNotice({
        message: `Đã cấp quyền "${o.courseName}" cho ${o.email}.`,
        email: o.email, tempPassword: data.tempPassword, accountCreated: data.accountCreated
      });
      onChanged();
    } catch (err) {
      window.alert(err?.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setBusy('');
      load();
    }
  };

  const reject = async (o) => {
    const note = window.prompt('Lý do từ chối (không bắt buộc):', '');
    if (note === null) return;
    await api.post(`/orders/${o.id}/reject`, { note });
    load();
  };

  return (
    <>
      <div className="form-field" style={{ maxWidth: 240 }}>
        <label>Lọc theo trạng thái</label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Tất cả</option>
          {Object.entries(ORDER_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div className="table-scroll">
        <table className="admin-table" style={{ marginTop: 0 }}>
          <thead><tr><th>Mã đơn</th><th>Thời gian</th><th>Học viên</th><th>Khoá học</th><th>Số tiền</th><th>Trạng thái</th><th /></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><b>{o.code}</b></td>
                <td>{fmtDate(o.createdAt)}</td>
                <td>{o.name}<br /><span className="cell-sub">{o.email}{o.phone ? ` · ${o.phone}` : ''}</span>{o.note && <><br /><span className="cell-sub">“{o.note}”</span></>}</td>
                <td>{o.courseName}</td>
                <td>{formatVnd(o.amount)}</td>
                <td><StatusBadge kind="order" status={o.status} /></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {o.status === 'pending' && (
                    <>
                      <button type="button" className="btn-primary" style={{ padding: '7px 12px', fontSize: 13 }} disabled={busy === o.id} onClick={() => confirm(o)}>Xác nhận đã thanh toán</button>{' '}
                      <button type="button" className="btn-danger" onClick={() => reject(o)}>Từ chối</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {orders.length === 0 && <p className="empty-state">Không có đơn nào.</p>}
    </>
  );
}

function EnrollmentsTab({ levels, setNotice, refreshKey, onChanged }) {
  const [items, setItems] = useState([]);
  const [levelFilter, setLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ email: '', name: '', levelId: '' });
  const [error, setError] = useState('');

  const load = () => api.get('/enrollments', { params: { ...(levelFilter ? { levelId: levelFilter } : {}), ...(statusFilter ? { status: statusFilter } : {}) } })
    .then((res) => setItems(res.data));
  useEffect(() => { load(); }, [levelFilter, statusFilter, refreshKey]);

  const grant = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/enrollments', form);
      const lv = levels.find((l) => l.id === form.levelId);
      setNotice({
        message: `Đã cấp quyền "${lv ? lv.name : ''}" cho ${form.email}.`,
        email: form.email.trim().toLowerCase(), tempPassword: data.tempPassword, accountCreated: data.accountCreated
      });
      setForm({ email: '', name: '', levelId: form.levelId });
      onChanged();
    } catch (err) {
      setError(err?.response?.data?.error || 'Có lỗi xảy ra');
    }
  };

  const changeStatus = async (en, status) => {
    if (status === 'revoked' && !window.confirm(`Thu hồi quyền học "${en.courseName}" của ${en.email}? Họ sẽ không xem được khoá này nữa.`)) return;
    await api.put(`/enrollments/${en.id}/status`, { status });
    load();
  };

  return (
    <>
      <form className="admin-form" onSubmit={grant}>
        <h3 style={{ margin: 0 }}>Cấp quyền thủ công cho một email</h3>
        {error && <div className="form-error">{error}</div>}
        <div className="admin-form-row">
          <div className="form-field"><label>Email học viên</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></div>
          <div className="form-field"><label>Họ tên (nếu tạo tài khoản mới)</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-field">
            <label>Khoá học</label>
            <select value={form.levelId} onChange={(e) => setForm({ ...form, levelId: e.target.value })} required>
              <option value="">— Chọn khoá —</option>
              {levels.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
            </select>
          </div>
        </div>
        <button type="submit" className="btn-primary">+ Cấp quyền</button>
      </form>

      <div className="admin-form-row" style={{ marginBottom: 6 }}>
        <div className="form-field">
          <label>Lọc theo khoá học</label>
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
            <option value="">Tất cả</option>
            {levels.map((l) => <option key={l.id} value={l.id}>{l.code} — {l.name}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label>Lọc theo trạng thái</label>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Tất cả</option>
            {Object.entries(ENROLLMENT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="table-scroll">
        <table className="admin-table" style={{ marginTop: 0 }}>
          <thead><tr><th>Học viên</th><th>Khoá học</th><th>Trạng thái</th><th>Tiến độ</th><th>Cấp quyền lúc</th><th>Đổi trạng thái</th></tr></thead>
          <tbody>
            {items.map((en) => (
              <tr key={en.id}>
                <td>{en.name}<br /><span className="cell-sub">{en.email}</span></td>
                <td>{en.courseName}</td>
                <td><StatusBadge status={en.status} /></td>
                <td>{en.progressPercent}%</td>
                <td>{fmtDate(en.grantedAt)}{en.note && <><br /><span className="cell-sub">{en.note}</span></>}</td>
                <td>
                  <select value={en.status} onChange={(e) => changeStatus(en, e.target.value)}>
                    {Object.entries(ENROLLMENT_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <p className="empty-state">Chưa có học viên nào.</p>}
    </>
  );
}

export default function AdminStudents() {
  const [tab, setTab] = useState('orders');
  const [levels, setLevels] = useState([]);
  const [notice, setNotice] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.get('/levels').then((res) => setLevels([...res.data].sort((a, b) => String(a.code).localeCompare(String(b.code), 'vi', { numeric: true }))));
  }, []);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Học viên & thanh toán</h2>
      <p className="page-sub">Xác nhận thanh toán → cấp quyền cho email → học viên đăng nhập và chỉ thấy khoá đã được cấp.</p>

      <CredentialsNotice notice={notice} onClose={() => setNotice(null)} />

      <div className="tabs">
        <button type="button" className={`tab-btn ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}>Đơn đăng ký / thanh toán</button>
        <button type="button" className={`tab-btn ${tab === 'enrollments' ? 'active' : ''}`} onClick={() => setTab('enrollments')}>Học viên theo khoá</button>
      </div>

      {tab === 'orders'
        ? <OrdersTab setNotice={setNotice} onChanged={() => setRefreshKey((k) => k + 1)} />
        : <EnrollmentsTab levels={levels} setNotice={setNotice} refreshKey={refreshKey} onChanged={() => setRefreshKey((k) => k + 1)} />}
    </div>
  );
}
