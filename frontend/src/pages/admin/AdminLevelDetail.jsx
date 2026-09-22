import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil } from 'lucide-react';
import api from '../../api/client';
import AdminLessons from './AdminLessons';
import AdminExamPapers from './AdminExamPapers';
import { LEVEL_TYPE_OPTIONS } from '../../constants/courseCategories';
import CourseCover from '../../components/CourseCover';

/** Upload/đổi/xoá ảnh bìa - lưu ngay khi chọn file (không cần bấm "Lưu thay đổi" của form). */
function CoverEditor({ level, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Vui lòng chọn file ảnh (JPG, PNG, WEBP).'); return; }
    if (file.size > 15 * 1024 * 1024) { setError('Ảnh quá lớn (tối đa 15MB).'); return; }
    setError('');
    setBusy(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await api.post(`/levels/${level.id}/cover`, body);
      onChanged(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Tải ảnh lên thất bại, vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Xoá ảnh bìa của cấp độ này?')) return;
    setBusy(true);
    try {
      const res = await api.delete(`/levels/${level.id}/cover`);
      onChanged(res.data);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-field">
      <label>Ảnh bìa (dạng bìa sách, hiện ở trang chủ và danh sách khoá học)</label>
      {error && <div className="form-error">{error}</div>}
      <div className="cover-editor">
        <CourseCover course={level} className="cover-thumb" />
        <div className="cover-editor-actions">
          <label className={`btn-secondary cover-upload-btn ${busy ? 'disabled' : ''}`}>
            {busy ? 'Đang tải...' : (level.coverUrl ? 'Đổi ảnh bìa' : 'Tải ảnh bìa lên')}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={upload} disabled={busy} hidden />
          </label>
          {level.coverUrl && <button type="button" className="btn-danger" onClick={remove} disabled={busy}>Xoá ảnh</button>}
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>JPG/PNG/WEBP, tối đa 15MB. Nên dùng ảnh bìa dọc (tỉ lệ ~4:5).</span>
        </div>
      </div>
    </div>
  );
}

function EditLevelForm({ level, onSaved, onCancel, onCoverChanged }) {
  const [form, setForm] = useState({
    code: level.code, name: level.name, type: level.type, order: level.order ?? 1,
    price: typeof level.price === 'number' ? level.price : '',
    duration: level.duration || '', audience: level.audience || '', description: level.description || '',
    outcomes: (level.outcomes || []).join('\n'),
    listed: level.listed !== false
  });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await api.put(`/levels/${level.id}`, {
        ...form,
        order: Number(form.order) || 1,
        price: form.price === '' ? null : Math.max(0, Number(form.price) || 0),
        outcomes: form.outcomes.split('\n').map((x) => x.trim()).filter(Boolean)
      });
      onSaved(res.data);
    } catch (e2) {
      setError(e2?.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  return (
    <form className="admin-form" onSubmit={submit} style={{ marginBottom: 18 }}>
      {error && <div className="form-error">{error}</div>}
      <CoverEditor level={level} onChanged={onCoverChanged} />
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
      <h3 style={{ margin: '6px 0 0' }}>Thông tin bán khoá học</h3>
      <div className="form-field">
        <label>Học phí (VNĐ)</label>
        <input type="number" min="0" step="1000" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Để trống = không bán / không hiện ở trang khoá học" />
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Chỉ khoá đã nhập học phí mới hiện ở trang công khai và cho phép đăng ký.</span>
      </div>
      <div className="form-field">
        <label className="check-label"><input type="checkbox" checked={form.listed} onChange={(e) => setForm({ ...form, listed: e.target.checked })} /> Hiển thị công khai (bỏ chọn để tạm ẩn khoá khỏi trang đăng ký)</label>
      </div>
      <div className="form-field">
        <label>Thời lượng (VD: 3 tháng, 15 bài)</label>
        <input type="text" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
      </div>
      <div className="form-field">
        <label>Đối tượng phù hợp</label>
        <input type="text" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
      </div>
      <div className="form-field">
        <label>Giới thiệu khoá học</label>
        <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </div>
      <div className="form-field">
        <label>Kết quả đạt được (mỗi dòng một ý)</label>
        <textarea rows={4} value={form.outcomes} onChange={(e) => setForm({ ...form, outcomes: e.target.value })} />
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
          onCoverChanged={setLevel}
          onSaved={(updated) => { setLevel(updated); setEditing(false); }}
        />
      ) : (
        <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0, marginBottom: 18 }}>
          Danh sách bài học thuộc cấp độ này. Bấm "Nội dung" trên mỗi bài để chỉnh sửa từ vựng, ngữ pháp, câu, PPT, video, bài hát...
        </p>
      )}

      <AdminLessons levelId={levelId} />

      <hr style={{ margin: '28px 0', border: 0, borderTop: '1px solid var(--line)' }} />
      <AdminExamPapers levelId={levelId} />
    </div>
  );
}
