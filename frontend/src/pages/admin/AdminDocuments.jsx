import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Paperclip, Trash2, Upload } from 'lucide-react';
import api from '../../api/client';
import { openAuthFile } from '../../utils/openAuthFile';

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

async function uploadDocument(file) {
  const fd = new FormData();
  fd.append('kind', 'document');
  fd.append('file', file);
  const res = await api.post('/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
}

/** Tài liệu đính kèm bài học (PDF, Word, ảnh, file nghe...) - học viên mở/tải ở mục "Tài liệu đính kèm". */
export default function AdminDocuments({ lessonId }) {
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const replaceRef = useRef(null);
  const replaceTarget = useRef(null);

  const load = () => api.get('/lesson-documents', { params: { lessonId } })
    .then((res) => setDocs([...res.data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [lessonId]);

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    setError('');
    for (let i = 0; i < files.length; i += 1) {
      setBusy(`Đang tải ${i + 1}/${files.length}: ${files[i].name}`);
      try {
        // eslint-disable-next-line no-await-in-loop
        const up = await uploadDocument(files[i]);
        // eslint-disable-next-line no-await-in-loop
        await api.post('/lesson-documents', {
          lessonId, title: files[i].name.replace(/\.[^.]+$/, ''), url: up.url,
          originalName: up.originalName, size: up.size, mimetype: up.mimetype, order: docs.length + i + 1
        });
      } catch (err) {
        setError(err?.response?.data?.error || `Tải "${files[i].name}" thất bại.`);
      }
    }
    setBusy('');
    load();
  };

  const replace = async (file) => {
    const doc = replaceTarget.current;
    if (!file || !doc) return;
    setBusy(`Đang thay file cho "${doc.title}"...`);
    try {
      const up = await uploadDocument(file);
      await api.put(`/lesson-documents/${doc.id}`, { url: up.url, originalName: up.originalName, size: up.size, mimetype: up.mimetype });
      load();
    } catch (err) {
      setError(err?.response?.data?.error || 'Thay file thất bại.');
    } finally {
      setBusy('');
    }
  };

  const rename = async (doc, title) => {
    if (!title.trim() || title === doc.title) return;
    await api.put(`/lesson-documents/${doc.id}`, { title: title.trim() });
    load();
  };

  const remove = async (doc) => {
    if (!window.confirm(`Xoá tài liệu "${doc.title}"?`)) return;
    await api.delete(`/lesson-documents/${doc.id}`);
    load();
  };

  const move = async (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= docs.length) return;
    const next = [...docs];
    [next[index], next[j]] = [next[j], next[index]];
    setDocs(next);
    await Promise.all(next.map((d, i) => (d.order !== i + 1 ? api.put(`/lesson-documents/${d.id}`, { order: i + 1 }) : null)));
    load();
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Tài liệu đính kèm</h2>
      <p className="page-sub">PDF, Word, Excel, PowerPoint, ảnh, file nghe hoặc .zip (tối đa 100MB/file). Học viên của khoá học mở/tải ở mục "Tài liệu đính kèm" trong bài.</p>

      <button type="button" className="btn-primary" disabled={!!busy} onClick={() => fileRef.current?.click()}>
        <Upload size={15} /> {busy || 'Tải tài liệu lên'}
      </button>
      <input ref={fileRef} type="file" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }} />
      <input ref={replaceRef} type="file" hidden onChange={(e) => { replace(e.target.files[0]); e.target.value = ''; }} />
      {error && <div className="form-error" style={{ marginTop: 10 }}>{error}</div>}

      <div className="html-page-list">
        {docs.map((d, i) => (
          <div key={d.id} className="html-page-row">
            <span className="sort-cell">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Đưa lên"><ArrowUp size={14} /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === docs.length - 1} title="Đưa xuống"><ArrowDown size={14} /></button>
            </span>
            <span className="html-page-icon doc"><Paperclip size={18} /></span>
            <div className="html-page-main">
              <input className="html-page-title" defaultValue={d.title} key={d.title} onBlur={(e) => rename(d, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
              <span className="html-page-meta">{d.originalName} · {formatSize(d.size)}</span>
            </div>
            <div className="html-page-actions">
              <button type="button" className="btn-secondary" onClick={() => openAuthFile(d.url, d.originalName)}>Mở</button>
              <button type="button" className="btn-secondary" disabled={!!busy} onClick={() => { replaceTarget.current = d; replaceRef.current?.click(); }}><Upload size={14} /> Thay file</button>
              <button type="button" className="btn-danger" onClick={() => remove(d)} title="Xoá"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      {docs.length === 0 && !busy && <p className="empty-state">Bài này chưa có tài liệu đính kèm.</p>}
    </div>
  );
}
