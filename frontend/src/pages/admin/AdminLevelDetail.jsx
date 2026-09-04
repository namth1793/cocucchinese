import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import api from '../../api/client';
import AdminLessons from './AdminLessons';
import { LEVEL_TYPE_OPTIONS } from '../../constants/courseCategories';

function EditLevelForm({ level, onSaved, onCancel }) {
  const [form, setForm] = useState({ code: level.code, name: level.name, type: level.type, order: level.order ?? 1 });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.put(`/levels/${level.id}`, { ...form, order: Number(form.order) || 1 });
      onSaved(res.data);
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  return (
    <form className="admin-form" onSubmit={submit} style={{ marginBottom: 18 }}>
      {error && <div className="form-error">{error}</div>}
      <div className="form-field">
        <label>Mã cấp độ (VD: HSK1, CONVO-BASIC)</label>
        <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
      </div>
      <div className="form-field">
        <label>Tên hiển thị</label>
        <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      </div>
      <div className="form-field">
        <label>Loại</label>
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required>
          {LEVEL_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Sidebar sẽ tự sắp xếp cấp độ vào đúng mục/nhóm con dựa theo Loại đã chọn.</span>
      </div>
      <div className="form-field">
        <label>Thứ tự trong nhóm</label>
        <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
      </div>
      <div className="admin-actions">
        <button type="submit" className="btn-primary">Lưu thay đổi</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Huỷ</button>
      </div>
    </form>
  );
}

export default function AdminLevelDetail() {
  const { levelId } = useParams();
  const [level, setLevel] = useState(null);
  const [editing, setEditing] = useState(false);

  const load = () => { api.get(`/levels/${levelId}`).then((res) => setLevel(res.data)); };

  useEffect(load, [levelId]);
  useEffect(() => setEditing(false), [levelId]);

  return (
    <div>
      <Link to="/admin" className="top-back-link"><ArrowLeft size={14} style={{ verticalAlign: -2, marginRight: 4 }} />Tất cả cấp độ</Link>

      {level && !editing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6, marginBottom: 2 }}>
          <h2 style={{ margin: 0 }}>{`${level.code} — ${level.name}`}</h2>
          <button type="button" className="btn-secondary" onClick={() => setEditing(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Pencil size={13} /> Sửa thông tin cấp độ
          </button>
        </div>
      )}
      {!level && <h2 style={{ marginTop: 6, marginBottom: 2 }}>Đang tải...</h2>}

      {level && editing ? (
        <EditLevelForm
          level={level}
          onCancel={() => setEditing(false)}
          onSaved={(updated) => { setLevel(updated); setEditing(false); }}
        />
      ) : (
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0, marginBottom: 18 }}>
          Danh sách bài học thuộc cấp độ này. Bấm "Nội dung" trên mỗi bài để chỉnh sửa từ vựng, ngữ pháp, câu, PPT, video, bài hát...
        </p>
      )}

      <AdminLessons levelId={levelId} />
    </div>
  );
}
