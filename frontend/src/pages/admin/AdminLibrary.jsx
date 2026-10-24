import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Pencil, Trash2, Upload } from 'lucide-react';
import api from '../../api/client';
import { openAuthFile } from '../../utils/openAuthFile';

const ACCEPT = '.pdf,.epub,.mobi,.azw3,.djvu,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.7z,.mp3,.m4a,.wav,.mp4';
const EMPTY = { title: '', author: '', category: '', note: '' };

function fileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
const fileExt = (name) => (name || '').split('.').pop().toUpperCase();

/** Kho tài liệu: cất file sách dùng chung cho đội ngũ (không gắn bài học, học viên không thấy). */
export default function AdminLibrary() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [editing, setEditing] = useState(null);
  const fileInput = useRef(null);

  useEffect(() => {
    api.get('/library').then((r) => setItems(r.data)).catch(() => setItems([]));
  }, []);

  const categories = useMemo(
    () => [...new Set((items || []).map((b) => b.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')),
    [items]
  );
  const shown = (items || []).filter((b) => {
    const term = q.trim().toLowerCase();
    const hay = `${b.title} ${b.author} ${b.note} ${b.originalName}`.toLowerCase();
    return (!cat || b.category === cat) && (!term || hay.includes(term));
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const baseName = (f) => (f ? f.name.replace(/\.[^.]+$/, '') : '');
  const pick = (f) => {
    if (!f) return;
    // Tên sách đang trống hoặc vẫn là tên tự điền từ file trước -> thay bằng tên file mới.
    setForm((x) => (!x.title || x.title === baseName(file) ? { ...x, title: baseName(f) } : x));
    setFile(f);
    setError('');
  };

  const upload = async (e) => {
    e.preventDefault();
    if (!file) { setError('Vui lòng chọn file sách'); return; }
    setError('');
    setProgress(0);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append('file', file);
    try {
      const { data } = await api.post('/library', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => ev.total && setProgress(Math.round((ev.loaded / ev.total) * 100))
      });
      setItems((list) => [data, ...(list || [])]);
      setForm(EMPTY);
      setFile(null);
      if (fileInput.current) fileInput.current.value = '';
    } catch (err) {
      setError(err?.response?.data?.error || 'Tải file lên thất bại');
    } finally {
      setProgress(null);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put(`/library/${editing.id}`, editing);
      setItems((list) => list.map((b) => (b.id === data.id ? data : b)));
      setEditing(null);
    } catch (err) {
      window.alert(err?.response?.data?.error || 'Lưu thất bại');
    }
  };

  const remove = async (b) => {
    if (!window.confirm(`Xoá "${b.title}" khỏi kho tài liệu?`)) return;
    await api.delete(`/library/${b.id}`);
    setItems((list) => list.filter((x) => x.id !== b.id));
  };

  const uploading = progress !== null;

  return (
    <div className="lib">
      <h2 style={{ marginTop: 0 }}>Kho tài liệu</h2>
      <p className="page-sub">Nơi cất file sách (giáo trình, sách bài tập, đề thi, audio kèm sách...) dùng chung cho đội ngũ. Chỉ quản trị viên và giáo viên xem được, học viên không thấy.</p>

      <form className="admin-form lib-upload" onSubmit={upload}>
        <label
          className={`lib-drop ${file ? 'has-file' : ''}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
        >
          <input ref={fileInput} type="file" accept={ACCEPT} onChange={(e) => pick(e.target.files?.[0])} disabled={uploading} />
          <Upload size={22} />
          {file
            ? <span><b>{file.name}</b> · {fileSize(file.size)}</span>
            : <span><b>Chọn file sách</b> hoặc kéo thả vào đây<br /><small>PDF, EPUB, MOBI, Word, PowerPoint, Excel, ZIP/RAR, audio · tối đa 500MB</small></span>}
        </label>
        <div className="admin-form-row">
          <div className="form-field"><label>Tên sách</label><input value={form.title} onChange={set('title')} placeholder="VD: Giáo trình chuẩn HSK 1" maxLength={200} /></div>
          <div className="form-field"><label>Tác giả / NXB</label><input value={form.author} onChange={set('author')} maxLength={160} /></div>
        </div>
        <div className="admin-form-row">
          <div className="form-field">
            <label>Danh mục</label>
            <input value={form.category} onChange={set('category')} list="lib-categories" placeholder="VD: HSK, YCT, Giao tiếp..." maxLength={80} />
            <datalist id="lib-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div className="form-field"><label>Ghi chú</label><input value={form.note} onChange={set('note')} maxLength={1000} /></div>
        </div>
        {error && <div className="form-error">{error}</div>}
        {uploading && (
          <div className="lib-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${progress}%` }} /><em>{progress < 100 ? `Đang tải lên ${progress}%` : 'Đang lưu...'}</em>
          </div>
        )}
        <div><button type="submit" className="btn-primary" disabled={uploading}>{uploading ? 'Đang tải lên...' : '+ Tải lên kho'}</button></div>
      </form>

      <div className="lib-filter">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên sách, tác giả, ghi chú..." aria-label="Tìm tài liệu" />
        <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Lọc danh mục">
          <option value="">Mọi danh mục ({items?.length || 0})</option>
          {categories.map((c) => <option key={c} value={c}>{c} ({items.filter((b) => b.category === c).length})</option>)}
        </select>
      </div>

      {items === null && <p className="empty-state">Đang tải...</p>}
      {items && items.length === 0 && <p className="empty-state">Kho chưa có tài liệu nào. Tải file sách đầu tiên ở khung phía trên.</p>}
      {items && items.length > 0 && shown.length === 0 && <p className="empty-state">Không tìm thấy tài liệu phù hợp.</p>}
      {shown.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table lib-table">
            <thead>
              <tr><th>Tên sách</th><th>Danh mục</th><th>File</th><th>Ngày tải</th><th /></tr>
            </thead>
            <tbody>
              {shown.map((b) => (editing?.id === b.id ? (
                <tr key={b.id}>
                  <td colSpan={5}>
                    <form className="lib-edit" onSubmit={saveEdit}>
                      <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="Tên sách" required maxLength={200} />
                      <input value={editing.author} onChange={(e) => setEditing({ ...editing, author: e.target.value })} placeholder="Tác giả / NXB" maxLength={160} />
                      <input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} placeholder="Danh mục" list="lib-categories" maxLength={80} />
                      <input value={editing.note} onChange={(e) => setEditing({ ...editing, note: e.target.value })} placeholder="Ghi chú" maxLength={1000} />
                      <button type="submit" className="btn-primary">Lưu</button>
                      <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Huỷ</button>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={b.id}>
                  <td>
                    <b>{b.title}</b>
                    {b.author && <><br /><small className="lib-muted">{b.author}</small></>}
                    {b.note && <><br /><small className="lib-muted">{b.note}</small></>}
                  </td>
                  <td>{b.category || '—'}</td>
                  <td style={{ whiteSpace: 'nowrap' }}><span className="lib-ext">{fileExt(b.originalName)}</span> {fileSize(b.size)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(b.createdAt).toLocaleDateString('vi-VN')}{b.uploadedByName && <><br /><small className="lib-muted">{b.uploadedByName}</small></>}</td>
                  <td className="lib-actions">
                    <button type="button" className="btn-secondary" onClick={() => openAuthFile(b.fileUrl, b.originalName)} title="Mở / tải về"><Download size={14} /> Mở</button>
                    <button type="button" className="btn-secondary" onClick={() => setEditing({ id: b.id, title: b.title, author: b.author || '', category: b.category || '', note: b.note || '' })} aria-label="Sửa" title="Sửa thông tin"><Pencil size={14} /></button>
                    <button type="button" className="btn-danger" onClick={() => remove(b)} aria-label="Xoá" title="Xoá"><Trash2 size={14} /></button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
