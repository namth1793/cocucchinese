import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, FileCode2, RotateCw } from 'lucide-react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

/**
 * Khung iframe chỉ được cấp quyền chạy script/biểu mẫu. Chỉ khi file được phục vụ từ một
 * origin KHÁC trang web (backend riêng / R2) mới cho thêm allow-same-origin (để file dùng
 * được localStorage của chính nó) - cùng origin thì không, tránh file HTML đọc được phiên
 * đăng nhập của học viên.
 */
function sandboxFor(src) {
  const base = 'allow-scripts allow-forms allow-popups allow-modals allow-downloads';
  const origin = new URL(src, window.location.href).origin;
  return origin === window.location.origin ? base : `${base} allow-same-origin`;
}

/** Danh sách bài học HTML của 1 bài (khi có nhiều hơn 1). */
export function HtmlLessonList() {
  const { lessonId } = useParams();
  const [pages, setPages] = useState(null);

  useEffect(() => {
    api.get('/html-pages', { params: { lessonId } }).then((res) => setPages(res.data)).catch(() => setPages([]));
  }, [lessonId]);

  if (pages && pages.length === 1) return <Navigate to={`/lessons/${lessonId}/html/${pages[0].id}`} replace />;

  return (
    <div>
      <PageHeader icon={FileCode2} color="#C2410C" title="Bài học tương tác" subtitle="Chọn phần muốn học" backTo={`/lessons/${lessonId}`} />
      {pages === null && <p className="empty-state">Đang tải...</p>}
      <div className="module-list">
        {pages?.map((p, i) => (
          <Link key={p.id} to={`/lessons/${lessonId}/html/${p.id}`} className="module-row">
            <span className="module-row-icon" style={{ background: '#C2410C' }}>{i + 1}</span>
            <span className="module-row-body"><span className="module-row-label">{p.title}</span></span>
            <ChevronRight size={18} className="module-row-chevron" />
          </Link>
        ))}
      </div>
      {pages?.length === 0 && <p className="empty-state">Bài này chưa có bài học tương tác.</p>}
    </div>
  );
}

/** Xem 1 bài học HTML toàn màn hình, có chuyển nhanh sang phần trước/sau. */
export default function HtmlLessonViewer() {
  const { lessonId, pageId } = useParams();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [src, setSrc] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    api.get('/html-pages', { params: { lessonId } }).then((res) => setPages(res.data)).catch(() => {});
  }, [lessonId]);

  useEffect(() => {
    setSrc('');
    setError('');
    api.get(`/html-pages/${pageId}/token`)
      .then((res) => setSrc(`${API_BASE}/html-pages/${pageId}/view?token=${encodeURIComponent(res.data.token)}&v=${res.data.version}`))
      .catch((err) => setError(err?.response?.status === 403 ? 'Bạn chưa được cấp quyền xem bài học này.' : 'Không tải được bài học, vui lòng thử lại.'));
  }, [pageId, reloadKey]);

  const index = pages.findIndex((p) => p.id === pageId);
  const current = pages[index];
  const prev = index > 0 ? pages[index - 1] : null;
  const next = index >= 0 && index < pages.length - 1 ? pages[index + 1] : null;

  return (
    <div className="html-viewer">
      <div className="html-viewer-bar">
        <button type="button" className="html-viewer-back" onClick={() => navigate(`/lessons/${lessonId}`)}>
          <ArrowLeft size={16} /> <span>Về bài học</span>
        </button>
        <div className="html-viewer-title">{current?.title || ''}</div>
        <div className="html-viewer-nav">
          {pages.length > 1 && (
            <>
              <button type="button" disabled={!prev} onClick={() => navigate(`/lessons/${lessonId}/html/${prev.id}`)} title="Phần trước"><ChevronLeft size={18} /></button>
              <span>{index + 1}/{pages.length}</span>
              <button type="button" disabled={!next} onClick={() => navigate(`/lessons/${lessonId}/html/${next.id}`)} title="Phần sau"><ChevronRight size={18} /></button>
            </>
          )}
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} title="Tải lại"><RotateCw size={16} /></button>
        </div>
      </div>
      {error && <p className="empty-state" style={{ padding: 24 }}>{error}</p>}
      {!error && !src && <p className="empty-state" style={{ padding: 24 }}>Đang tải bài học...</p>}
      {src && (
        <iframe
          key={src}
          title={current?.title || 'Bài học'}
          src={src}
          sandbox={sandboxFor(src)}
          allow="autoplay; fullscreen; microphone"
          className="html-viewer-frame"
        />
      )}
    </div>
  );
}
