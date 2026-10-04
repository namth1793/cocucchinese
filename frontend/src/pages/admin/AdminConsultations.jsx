import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import api from '../../api/client';

const STATUS = { new: 'Mới', contacted: 'Đã liên hệ', closed: 'Đã xong' };
const VIA = { zalo: 'Zalo', facebook: 'Facebook', phone: 'Gọi điện' };

/** Danh sách khách để lại thông tin ở form "Đăng ký tư vấn" trên trang chủ. */
export default function AdminConsultations() {
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('new');

  useEffect(() => {
    api.get('/consultations').then((r) => setItems(r.data)).catch(() => setItems([]));
  }, []);

  const setStatus = async (id, status) => {
    const { data } = await api.patch(`/consultations/${id}`, { status });
    setItems((list) => list.map((x) => (x.id === id ? data : x)));
  };
  const remove = async (id) => {
    if (!window.confirm('Xoá yêu cầu tư vấn này?')) return;
    await api.delete(`/consultations/${id}`);
    setItems((list) => list.filter((x) => x.id !== id));
  };

  const shown = (items || []).filter((x) => filter === 'all' || x.status === filter);
  const count = (s) => (items || []).filter((x) => x.status === s).length;

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Đăng ký tư vấn</h2>
      <p className="page-sub">Khách để lại thông tin ở form trên trang chủ. Liên hệ xong thì đổi trạng thái để dễ theo dõi.</p>
      <div className="admin-tabs" style={{ position: 'static', padding: '0 0 10px', background: 'none', border: 0 }}>
        {[['new', `Mới (${count('new')})`], ['contacted', `Đã liên hệ (${count('contacted')})`], ['closed', `Đã xong (${count('closed')})`], ['all', `Tất cả (${items?.length || 0})`]].map(([k, l]) => (
          <button key={k} type="button" className={`tab-btn ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>{l}</button>
        ))}
      </div>
      {items === null && <p className="empty-state">Đang tải...</p>}
      {items && shown.length === 0 && <p className="empty-state">Không có yêu cầu nào.</p>}
      {shown.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr><th>Thời gian</th><th>Khách hàng</th><th>Liên hệ qua</th><th>Quan tâm</th><th>Nội dung</th><th>Trạng thái</th><th /></tr>
            </thead>
            <tbody>
              {shown.map((x) => (
                <tr key={x.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(x.createdAt).toLocaleString('vi-VN')}</td>
                  <td>
                    <b>{x.name}</b><br />
                    <a href={`tel:${x.phone.replace(/[^\d+]/g, '')}`}>{x.phone}</a>
                    {x.email && <><br /><a href={`mailto:${x.email}`}>{x.email}</a></>}
                  </td>
                  <td>{VIA[x.contactVia] || x.contactVia}</td>
                  <td>{x.interest || '—'}</td>
                  <td style={{ maxWidth: 280, whiteSpace: 'pre-wrap' }}>{x.message || '—'}</td>
                  <td>
                    <select value={x.status} onChange={(e) => setStatus(x.id, e.target.value)}>
                      {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </td>
                  <td><button type="button" className="btn-danger" onClick={() => remove(x.id)} aria-label="Xoá"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
