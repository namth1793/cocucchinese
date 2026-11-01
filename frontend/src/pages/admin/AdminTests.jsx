import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, Eye, EyeOff, FileCheck2, Trash2, Upload } from 'lucide-react';
import api from '../../api/client';

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
const formatTime = (iso) => (iso ? new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '');
const isHtml = (file) => /\.html?$/i.test(file.name);
const levelLabel = (lv) => `${lv.code} — ${lv.name}`;

/** Một dòng bài kiểm tra: đổi tên tại chỗ, chuyển khoá, ẩn/hiện, thay file, xem thử, xoá. */
function TestRow({ test, index, total, levels, onMove, onChanged, onError }) {
  const fileRef = useRef(null);
  const [title, setTitle] = useState(test.title);
  const [busy, setBusy] = useState(false);

  useEffect(() => setTitle(test.title), [test.title]);

  const saveTitle = async () => {
    if (!title.trim() || title.trim() === test.title) { setTitle(test.title); return; }
    await api.put(`/course-tests/${test.id}`, { title: title.trim() });
    onChanged();
  };

  const togglePublished = async () => {
    await api.put(`/course-tests/${test.id}`, { published: !test.published });
    onChanged();
  };

  const changeLevel = async (e) => {
    await api.put(`/course-tests/${test.id}`, { levelId: e.target.value });
    onChanged();
  };

  const replace = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!isHtml(file)) { onError('Chỉ nhận file .html hoặc .htm'); return; }
    if (!window.confirm(`Thay nội dung "${test.title}" bằng file "${file.name}"? Học viên sẽ thấy bản mới ngay.`)) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/course-tests/${test.id}/file`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChanged();
    } catch (err) {
      onError(err?.response?.data?.error || 'Thay file thất bại, vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Xoá bài kiểm tra "${test.title}"? File sẽ bị xoá vĩnh viễn.`)) return;
    await api.delete(`/course-tests/${test.id}`);
    onChanged();
  };

  return (
    <div className={`html-page-row ${test.published ? '' : 'is-hidden'}`}>
      <span className="sort-cell">
        <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0} title="Đưa lên"><ArrowUp size={14} /></button>
        <button type="button" onClick={() => onMove(index, 1)} disabled={index === total - 1} title="Đưa xuống"><ArrowDown size={14} /></button>
      </span>
      <span className="html-page-icon"><FileCheck2 size={18} /></span>
      <div className="html-page-main">
        <input className="html-page-title" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={saveTitle} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
        <span className="html-page-meta">
          {test.originalName} · {formatSize(test.size)} · cập nhật {formatTime(test.updatedAt)}
          {!test.published && <b> · Đang ẩn với học viên</b>}
        </span>
      </div>
      <select className="test-level-select" value={levels.some((lv) => lv.id === test.levelId) ? test.levelId : ''} onChange={changeLevel} aria-label="Chuyển sang khoá học khác" title="Chuyển sang khoá học khác">
        {!levels.some((lv) => lv.id === test.levelId) && <option value="" disabled>Chọn khoá học</option>}
        {levels.map((lv) => <option key={lv.id} value={lv.id}>{levelLabel(lv)}</option>)}
      </select>
      <div className="html-page-actions">
        <a href={`/tests/${test.id}`} target="_blank" rel="noreferrer" className="btn-secondary" title="Xem như học viên"><ExternalLink size={14} /> Xem thử</a>
        <button type="button" className="btn-secondary" onClick={() => fileRef.current?.click()} disabled={busy}><Upload size={14} /> {busy ? 'Đang tải...' : 'Thay file'}</button>
        <button type="button" className="btn-secondary" onClick={togglePublished} title={test.published ? 'Ẩn với học viên' : 'Hiện cho học viên'}>
          {test.published ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button type="button" className="btn-danger" onClick={remove} title="Xoá"><Trash2 size={14} /></button>
        <input ref={fileRef} type="file" accept=".html,.htm,text/html" hidden onChange={replace} />
      </div>
    </div>
  );
}

/** Bài kiểm tra: admin tải file HTML lên, chọn khoá học; bài hiện trong trang của khoá đó. */
export default function AdminTests() {
  const [tests, setTests] = useState(null);
  const [levels, setLevels] = useState([]);
  const [levelId, setLevelId] = useState('');
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const load = () => api.get('/course-tests').then((res) => setTests(res.data)).catch(() => setTests([]));
  useEffect(() => {
    load();
    api.get('/levels').then((res) => setLevels([...res.data].sort((a, b) => (a.order || 0) - (b.order || 0))));
  }, []);

  const uploadFiles = async (fileList) => {
    if (!levelId) { setError('Vui lòng chọn khoá học trước khi tải file.'); return; }
    const files = Array.from(fileList || []);
    const bad = files.filter((f) => !isHtml(f));
    const good = files.filter(isHtml);
    setError(bad.length ? `Bỏ qua ${bad.length} file không phải HTML: ${bad.map((f) => f.name).join(', ')}` : '');
    for (let i = 0; i < good.length; i += 1) {
      setUploading(`Đang tải ${i + 1}/${good.length}: ${good[i].name}`);
      const fd = new FormData();
      fd.append('levelId', levelId);
      fd.append('file', good[i]);
      try {
        // eslint-disable-next-line no-await-in-loop
        await api.post('/course-tests', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } catch (err) {
        setError(err?.response?.data?.error || `Tải "${good[i].name}" thất bại.`);
      }
    }
    setUploading('');
    load();
  };

  const move = async (list, index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[index], next[j]] = [next[j], next[index]];
    await Promise.all(next.map((t, i) => (t.order !== i + 1 ? api.put(`/course-tests/${t.id}`, { order: i + 1 }) : null)));
    load();
  };

  // Gom theo khoá học, khoá theo thứ tự sidebar; bài của khoá đã xoá nằm cuối để admin chuyển sang khoá khác.
  const groups = levels.map((lv) => ({ key: lv.id, label: levelLabel(lv), items: (tests || []).filter((t) => t.levelId === lv.id) }));
  const orphans = (tests || []).filter((t) => !levels.some((lv) => lv.id === t.levelId));
  if (levels.length > 0 && orphans.length > 0) groups.push({ key: 'orphans', label: 'Khoá học đã xoá', items: orphans });

  return (
    <div className="tests-admin">
      <h2 style={{ marginTop: 0 }}>Bài kiểm tra</h2>
      <p className="page-sub">
        Tải file bài kiểm tra dạng <b>.html</b> (tự chứa câu hỏi, chấm điểm trong 1 file) rồi chọn khoá học. Bài kiểm tra hiện ở
        trang của khoá học đó, học viên bấm vào để làm toàn màn hình.
      </p>

      <div className="form-field tests-level-field">
        <label>Khoá học hiển thị bài kiểm tra</label>
        <select value={levelId} onChange={(e) => { setLevelId(e.target.value); setError(''); }}>
          <option value="">Chọn khoá học</option>
          {levels.map((lv) => <option key={lv.id} value={lv.id}>{levelLabel(lv)}</option>)}
        </select>
      </div>

      <div
        className={`drop-zone ${dragOver ? 'over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
        onClick={() => {
          if (uploading) return;
          if (levelId) fileRef.current?.click(); else setError('Vui lòng chọn khoá học trước khi tải file.');
        }}
        role="button"
        tabIndex={0}
      >
        <Upload size={22} />
        <b>{uploading || 'Kéo thả file HTML vào đây hoặc bấm để chọn'}</b>
        <span>Có thể chọn nhiều file cùng lúc - mỗi file thành 1 bài kiểm tra, tên bài lấy theo tên file (đổi lại được).</span>
        <input ref={fileRef} type="file" accept=".html,.htm,text/html" multiple hidden onChange={(e) => { uploadFiles(e.target.files); e.target.value = ''; }} />
      </div>
      {error && <div className="form-error" style={{ marginTop: 10 }}>{error}</div>}

      {tests === null && <p className="empty-state">Đang tải...</p>}
      {tests?.length === 0 && !uploading && <p className="empty-state">Chưa có bài kiểm tra nào.</p>}
      {groups.filter((g) => g.items.length > 0).map((g) => (
        <section key={g.key} className="tests-group">
          <h3>{g.label}</h3>
          <div className="html-page-list">
            {g.items.map((t, i) => (
              <TestRow
                key={t.id} test={t} index={i} total={g.items.length} levels={levels}
                onMove={(idx, dir) => move(g.items, idx, dir)} onChanged={load} onError={setError}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
