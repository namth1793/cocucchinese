import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, ExternalLink, Pencil, Trash2, Upload } from 'lucide-react';
import api from '../../api/client';
import { openAuthFile } from '../../utils/openAuthFile';
import { refreshPublicSite } from '../../utils/publicSite';
import CourseCover from '../../components/CourseCover';
import CoverEditor from '../../components/CoverEditor';

const ACCEPT = '.pdf,.epub,.mobi,.azw3,.djvu,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.7z,.mp3,.m4a,.wav,.mp4';
const EMPTY = { title: '', author: '', category: '', note: '', description: '', downloadUrl: '', showOnHome: true };

function fileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
const fileExt = (name) => (name || '').split('.').pop().toUpperCase();
/** Dữ liệu cho CourseCover/CoverEditor (chưa có bìa thì khung màu ghi "SÁCH"). */
const coverOf = (b) => ({ id: b.id, name: b.title, code: 'SÁCH', coverUrl: b.coverUrl || null });
const toForm = (b) => ({
  title: b.title || '', author: b.author || '', category: b.category || '', note: b.note || '',
  description: b.description || '', downloadUrl: b.downloadUrl || '', showOnHome: b.showOnHome === true
});

/** Các ô thông tin sách - dùng chung cho form tải lên và form sửa. */
function BookFields({ value, onChange, categories }) {
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  return (
    <>
      <div className="admin-form-row">
        <div className="form-field"><label>Tên sách</label><input value={value.title} onChange={set('title')} placeholder="VD: Giáo trình chuẩn HSK 1" maxLength={200} /></div>
        <div className="form-field"><label>Tác giả / NXB</label><input value={value.author} onChange={set('author')} maxLength={160} /></div>
      </div>
      <div className="form-field">
        <label>Giới thiệu sách</label>
        <textarea rows={4} value={value.description} onChange={set('description')} maxLength={4000} placeholder="Tổng quan nội dung sách, dành cho ai, có gì bên trong... (hiện trên trang chủ)" />
      </div>
      <div className="admin-form-row">
        <div className="form-field">
          <label>Link tải sách (không bắt buộc)</label>
          <input type="url" value={value.downloadUrl} onChange={set('downloadUrl')} placeholder="https://drive.google.com/..." maxLength={1000} />
          <small className="lib-muted">Dùng khi không tải file lên (VD: sách để trên Google Drive). Có file thì học viên tải file.</small>
        </div>
        <div className="form-field">
          <label>Danh mục</label>
          <input value={value.category} onChange={set('category')} list="lib-categories" placeholder="VD: HSK, YCT, Giao tiếp..." maxLength={80} />
          <datalist id="lib-categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </div>
      </div>
      <div className="form-field"><label>Ghi chú nội bộ</label><input value={value.note} onChange={set('note')} maxLength={1000} placeholder="Chỉ quản trị viên/giáo viên thấy" /></div>
      <label className="lib-check">
        <input type="checkbox" checked={value.showOnHome} onChange={set('showOnHome')} />
        Hiện ở mục <b>Kho tài liệu</b> trên trang chủ (ảnh bìa, giới thiệu và nút tải sách cho học viên)
      </label>
    </>
  );
}

/** Kho tài liệu: cất file sách; sách được tick "Hiện trên trang chủ" thì học viên/khách tải được ở trang chủ. */
export default function AdminLibrary() {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [cover, setCover] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [editing, setEditing] = useState(null);
  const fileInput = useRef(null);
  const coverInput = useRef(null);
  const coverPreview = useMemo(() => (cover ? URL.createObjectURL(cover) : ''), [cover]);
  useEffect(() => () => coverPreview && URL.revokeObjectURL(coverPreview), [coverPreview]);

  useEffect(() => {
    api.get('/library').then((r) => setItems(r.data)).catch(() => setItems([]));
  }, []);

  const categories = useMemo(
    () => [...new Set((items || []).map((b) => b.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'vi')),
    [items]
  );
  const shown = (items || []).filter((b) => {
    const term = q.trim().toLowerCase();
    const hay = `${b.title} ${b.author} ${b.note} ${b.description || ''} ${b.originalName || ''}`.toLowerCase();
    return (!cat || b.category === cat) && (!term || hay.includes(term));
  });

  const replaceItem = (data) => {
    setItems((list) => list.map((b) => (b.id === data.id ? data : b)));
    refreshPublicSite();
  };

  const baseName = (f) => (f ? f.name.replace(/\.[^.]+$/, '') : '');
  const pick = (f) => {
    if (!f) return;
    // Tên sách đang trống hoặc vẫn là tên tự điền từ file trước -> thay bằng tên file mới.
    setForm((x) => (!x.title || x.title === baseName(file) ? { ...x, title: baseName(f) } : x));
    setFile(f);
    setError('');
  };
  const pickCover = (f) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) { setError('Ảnh bìa phải là file ảnh (JPG, PNG, WEBP).'); return; }
    if (f.size > 15 * 1024 * 1024) { setError('Ảnh bìa quá lớn (tối đa 15MB).'); return; }
    setCover(f);
    setError('');
  };

  const upload = async (e) => {
    e.preventDefault();
    if (!file && !form.downloadUrl.trim()) { setError('Vui lòng chọn file sách hoặc nhập link tải sách'); return; }
    if (!file && !form.title.trim()) { setError('Vui lòng nhập tên sách'); return; }
    setError('');
    setProgress(0);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    if (file) fd.append('file', file);
    try {
      let { data } = await api.post('/library', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => ev.total && setProgress(Math.round((ev.loaded / ev.total) * 100))
      });
      if (cover) {
        const body = new FormData();
        body.append('file', cover);
        try {
          data = (await api.post(`/library/${data.id}/cover`, body)).data;
        } catch (err) {
          window.alert(`Đã lưu sách nhưng tải ảnh bìa thất bại: ${err?.response?.data?.error || 'lỗi không xác định'}. Bấm sửa sách để thử lại.`);
        }
      }
      setItems((list) => [data, ...(list || [])]);
      refreshPublicSite();
      setForm(EMPTY);
      setFile(null);
      setCover(null);
      if (fileInput.current) fileInput.current.value = '';
      if (coverInput.current) coverInput.current.value = '';
    } catch (err) {
      setError(err?.response?.data?.error || 'Tải file lên thất bại');
    } finally {
      setProgress(null);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put(`/library/${editing.id}`, editing.form);
      replaceItem(data);
      setEditing(null);
    } catch (err) {
      window.alert(err?.response?.data?.error || 'Lưu thất bại');
    }
  };

  const remove = async (b) => {
    if (!window.confirm(`Xoá "${b.title}" khỏi kho tài liệu?`)) return;
    await api.delete(`/library/${b.id}`);
    setItems((list) => list.filter((x) => x.id !== b.id));
    refreshPublicSite();
  };

  const uploading = progress !== null;
  const editingBook = editing && (items || []).find((b) => b.id === editing.id);

  return (
    <div className="lib">
      <h2 style={{ marginTop: 0 }}>Kho tài liệu</h2>
      <p className="page-sub">
        Nơi cất file sách (giáo trình, sách bài tập, đề thi, audio kèm sách...). Sách được tick <b>Hiện trên trang chủ</b> sẽ hiện
        ở mục "Kho tài liệu" của trang chủ kèm ảnh bìa, giới thiệu và nút tải về cho học viên; sách không tick chỉ quản trị viên và giáo viên thấy.
      </p>

      {editingBook && (
        <form className="admin-form lib-upload lib-editor" onSubmit={saveEdit}>
          <h3 style={{ margin: 0 }}>Sửa sách: {editingBook.title}</h3>
          <CoverEditor
            level={coverOf(editingBook)} label="Ảnh bìa sách" endpoint={`/library/${editingBook.id}/cover`}
            onChanged={replaceItem}
          />
          <BookFields value={editing.form} onChange={(f) => setEditing({ ...editing, form: f })} categories={categories} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn-primary">Lưu thay đổi</button>
            <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Đóng</button>
          </div>
        </form>
      )}

      <form className="admin-form lib-upload" onSubmit={upload}>
        <div className="lib-upload-top">
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
          <label className="lib-cover-pick" title="Chọn ảnh bìa sách">
            <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => pickCover(e.target.files?.[0])} disabled={uploading} hidden />
            {coverPreview
              ? <span className="cover-frame cover-thumb"><img src={coverPreview} alt="Ảnh bìa đã chọn" /></span>
              : <span className="cover-frame cover-thumb cover-fallback lib-cover-empty">+ Ảnh bìa</span>}
            <small>{cover ? 'Đổi ảnh bìa' : 'Ảnh bìa (JPG/PNG, dọc ~4:5)'}</small>
          </label>
        </div>
        <BookFields value={form} onChange={setForm} categories={categories} />
        {error && <div className="form-error">{error}</div>}
        {uploading && (
          <div className="lib-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${progress}%` }} /><em>{progress < 100 ? `Đang tải lên ${progress}%` : 'Đang lưu...'}</em>
          </div>
        )}
        <div><button type="submit" className="btn-primary" disabled={uploading}>{uploading ? 'Đang tải lên...' : '+ Thêm vào kho'}</button></div>
      </form>


      <div className="lib-filter">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên sách, tác giả, giới thiệu..." aria-label="Tìm tài liệu" />
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
              <tr><th>Bìa</th><th>Tên sách</th><th>Trang chủ</th><th>File / link</th><th>Ngày tải</th><th /></tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.id} className={editing?.id === b.id ? 'is-editing' : ''}>
                  <td><CourseCover course={coverOf(b)} className="lib-thumb" /></td>
                  <td>
                    <b>{b.title}</b>
                    {(b.author || b.category) && <><br /><small className="lib-muted">{[b.author, b.category].filter(Boolean).join(' · ')}</small></>}
                    {b.description && <><br /><small className="lib-muted lib-desc">{b.description}</small></>}
                    {b.note && <><br /><small className="lib-muted">Ghi chú: {b.note}</small></>}
                  </td>
                  <td>{b.showOnHome ? <span className="lib-badge is-on">Đang hiện</span> : <span className="lib-badge">Nội bộ</span>}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {b.fileUrl
                      ? <><span className="lib-ext">{fileExt(b.originalName)}</span> {fileSize(b.size)}</>
                      : <span className="lib-ext">LINK</span>}
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{new Date(b.createdAt).toLocaleDateString('vi-VN')}{b.uploadedByName && <><br /><small className="lib-muted">{b.uploadedByName}</small></>}</td>
                  <td className="lib-actions">
                    {b.fileUrl
                      ? <button type="button" className="btn-secondary" onClick={() => openAuthFile(b.fileUrl, b.originalName)} title="Mở / tải về"><Download size={14} /> Mở</button>
                      : b.downloadUrl && <a className="btn-secondary" href={b.downloadUrl} target="_blank" rel="noopener noreferrer" title="Mở link tải"><ExternalLink size={14} /> Mở</a>}
                    <button
                      type="button" className="btn-secondary" aria-label="Sửa" title="Sửa ảnh bìa, giới thiệu, link tải"
                      onClick={() => { setEditing({ id: b.id, form: toForm(b) }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    ><Pencil size={14} /></button>
                    <button type="button" className="btn-danger" onClick={() => remove(b)} aria-label="Xoá" title="Xoá"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
