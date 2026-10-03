import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, FileCode2, Trash2, Upload } from 'lucide-react';
import api from '../../api/client';

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
const formatTime = (iso) => (iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '');
const isHtml = (file) => /\.html?$/i.test(file.name);

/** Một dòng trang HTML: đổi tên tại chỗ, ẩn/hiện, thay file, xem thử, xoá. */
function HtmlPageRow({ page, index, total, lessonId, onMove, onChanged, onError }) {
  const fileRef = useRef(null);
  const [title, setTitle] = useState(page.title);
  const [busy, setBusy] = useState(false);

  useEffect(() => setTitle(page.title), [page.title]);

  const saveTitle = async () => {
    if (!title.trim() || title.trim() === page.title) { setTitle(page.title); return; }
    await api.put(`/html-pages/${page.id}`, { title: title.trim() });
    onChanged();
  };

  const togglePublished = async () => {
    await api.put(`/html-pages/${page.id}`, { published: !page.published });
    onChanged();
  };

  const replace = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!isHtml(file)) { onError('Chỉ nhận file .html hoặc .htm'); return; }
    if (!window.confirm(`Thay nội dung "${page.title}" bằng file "${file.name}"? Học viên sẽ thấy bản mới ngay.`)) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/html-pages/${page.id}/file`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChanged();
    } catch (err) {
      onError(err?.response?.data?.error || 'Thay file thất bại, vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Xoá bài học HTML "${page.title}"? File sẽ bị xoá vĩnh viễn.`)) return;
    await api.delete(`/html-pages/${page.id}`);
    onChanged();
  };

  return (
    <div className={`html-page-row ${page.published ? '' : 'is-hidden'}`}>
      <span className="sort-cell">
        <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} title="Đưa lên"><ArrowUp size={14} /></button>
        <button type="button" onClick={() => onMove(index, 1)} disabled={index === total - 1} title="Đưa xuống"><ArrowDown size={14} /></button>
      </span>
      <span className="html-page-icon"><FileCode2 size={18} /></span>
      <div className="html-page-main">
        <input className="html-page-title" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveTitle} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
        <span className="html-page-meta">
          {page.originalName} · {formatSize(page.size)} · cập nhật {formatTime(page.updatedAt)} · phiên bản {page.version}
          {!page.published && <b> · Đang ẩn với học viên</b>}
        </span>
      </div>
      <div className="html-page-actions">
        <a href={`/lessons/${lessonId}/html/${page.id}`} target="_blank" rel="noreferrer" className="btn-secondary" title="Xem như học viên"><ExternalLink size={14} /> Xem thử</a>
        <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={busy}><Upload size={14} /> {busy ? 'Đang tải...' : 'Thay file'}</button>
        <button type="button" className="btn-secondary" onClick={togglePublished} title={page.published ? 'Ẩn với học viên' : 'Hiện cho học viên'}>
          {page.published ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button type="button" className="btn-danger" onClick={remove} title="Xoá"><Trash2 size={14} /></button>
        <input ref={fileRef} type="file" accept=".html,.htm,text/html" hidden onChange={replace} />
      </div>
    </div>
  );
}

/**
 * Bài học dạng file HTML tự chứa (vd. file bài giảng tương tác soạn sẵn): admin tải lên/thay
 * thế/sắp xếp/xoá, không cần sửa code. Học viên xem trong khung riêng, chỉ khi có quyền khoá học.
 */
export default function AdminHtmlPages({ lessonId }) {
  const [pages, setPages] = useState([]);
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const load = () => api.get('/html-pages', { params: { lessonId } }).then((res) => setPages(res.data));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [lessonId]);

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    const bad = files.filter((f) => !isHtml(f));
    const good = files.filter(isHtml);
    setError(bad.length ? `Bỏ qua ${bad.length} file không phải HTML: ${bad.map((f) => f.name).join(', ')}` : '');
    for (let i = 0; i < good.length; i += 1) {
      setUploading(`Đang tải ${i + 1}/${good.length}: ${good[i].name}`);
      const fd = new FormData();
      fd.append('lessonId', lessonId);
      fd.append('file', good[i]);
      try {
        // eslint-disable-next-line no-await-in-loop
        await api.post('/html-pages', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } catch (err) {
        setError(err?.response?.data?.error || `Tải "${good[i].name}" thất bại.`);
      }
    }
    setUploading('');
    load();
  };

  const move = async (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= pages.length) return;
    const next = [...pages];
    [next[index], next[j]] = [next[j], next[index]];
    setPages(next);
    await Promise.all(next.map((p, i) => (p.order !== i + 1 ? api.put(`/html-pages/${p.id}`, { order: i + 1 }) : null)));
    load();
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Bài học HTML</h2>
      <p className="page-sub">
        Tải file bài học dạng <b>.html</b> (tự chứa: chữ, hình, âm thanh, bài tập trong 1 file) để hiển thị nguyên vẹn cho học viên.
        Muốn sửa nội dung chỉ cần <b>Thay file</b> - không cần chỉnh code. File được bảo vệ: chỉ học viên có quyền khoá học mới xem được.
      </p>

      <div
        className={`drop-zone ${dragOver ? 'over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
        onClick={() => !uploading && fileRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <Upload size={22} />
        <b>{uploading || 'Kéo thả file HTML vào đây hoặc bấm để chọn'}</b>
        <span>Có thể chọn nhiều file cùng lúc - mỗi file thành 1 bài, tên bài lấy theo tên file (đổi lại được).</span>
        <input ref={fileRef} type="file" accept=".html,.htm,text/html" multiple hidden onChange={(e) => { uploadFiles(e.target.files); e.target.value = ''; }} />
      </div>
      {error && <div className="form-error" style={{ marginTop: 10 }}>{error}</div>}

      <div className="html-page-list">
        {pages.map((p, i) => (
          <HtmlPageRow key={p.id} page={p} index={i} total={pages.length} lessonId={lessonId} onMove={move} onChanged={load} onError={setError} />
        ))}
      </div>
      {pages.length === 0 && !uploading && <p className="empty-state">Bài này chưa có bài học HTML nào.</p>}
    </div>
  );
}
