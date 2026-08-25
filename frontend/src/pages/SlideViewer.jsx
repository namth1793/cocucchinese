import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, CheckCircle2, Presentation } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import ProtectedContent from '../components/ProtectedContent';
import ProgressBar from '../components/ProgressBar';
import PageHeader from '../components/PageHeader';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function SlideViewer() {
  const { lessonId } = useParams();
  const { user } = useAuth();
  const [deck, setDeck] = useState(null);
  const [token, setToken] = useState(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [marked, setMarked] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    api.get('/slides', { params: { lessonId } }).then((res) => {
      if (res.data[0]) setDeck(res.data[0]);
    });
  }, [lessonId]);

  const refreshToken = useCallback(() => {
    if (!deck) return;
    api.get(`/slides/${deck.id}/token`).then((res) => setToken(res.data.token));
  }, [deck]);

  useEffect(() => {
    if (!deck) return;
    refreshToken();
    api.get(`/slides/${deck.id}/my-progress`).then((res) => {
      if (res.data.lastPage) setPage(res.data.lastPage);
    });
    const interval = setInterval(refreshToken, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, [deck, refreshToken]);

  useEffect(() => {
    if (!deck) return;
    const percent = Math.round((page / deck.pageCount) * 100);
    api.post(`/slides/${deck.id}/progress`, { page, percent }).catch(() => {});
  }, [page, deck]);

  const markDone = async () => {
    await api.post(`/progress/${lessonId}/complete-module`, { module: 'ppt' });
    setMarked(true);
  };

  const fullscreen = () => {
    if (wrapRef.current) wrapRef.current.requestFullscreen?.();
  };

  if (!deck) {
    return (
      <div>
        <PageHeader icon={Presentation} color="#B91C1C" title="PPT / Bài giảng" backTo={`/lessons/${lessonId}`} />
        <p className="empty-state">Chưa có bài giảng PPT/PDF cho bài học này.</p>
      </div>
    );
  }

  const imgSrc = token ? `${API_BASE}/slides/${deck.id}/page/${page}?token=${token}` : null;

  return (
    <div className="slide-viewer">
      <PageHeader icon={Presentation} color="#B91C1C" title={deck.title} backTo={`/lessons/${lessonId}`} />
      <ProgressBar percent={Math.round((page / deck.pageCount) * 100)} />

      <ProtectedContent>
        <div className="slide-image-wrap" ref={wrapRef}>
          {imgSrc && (
            <img
              src={imgSrc}
              alt={`Trang ${page}`}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}
              draggable={false}
            />
          )}
          <div className="slide-watermark">
            {user?.name} · {user?.email}<br />
            {new Date().toLocaleString('vi-VN')}
          </div>
        </div>
      </ProtectedContent>

      <div className="slide-controls">
        <button type="button" className="btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={16} /> Trang trước</button>
        <span style={{ fontWeight: 700, color: 'var(--ink-soft)' }}>{page}/{deck.pageCount}</span>
        <button type="button" className="btn-secondary" disabled={page >= deck.pageCount} onClick={() => setPage((p) => p + 1)}>Trang sau <ChevronRight size={16} /></button>
      </div>
      <div className="slide-controls">
        <button type="button" className="btn-secondary" onClick={() => setZoom((z) => Math.max(1, z - 0.25))}><ZoomOut size={16} /></button>
        <button type="button" className="btn-secondary" onClick={() => setZoom((z) => Math.min(2.5, z + 0.25))}><ZoomIn size={16} /></button>
        <button type="button" className="btn-secondary" onClick={fullscreen}><Maximize size={16} /> Toàn màn hình</button>
      </div>
      <button type="button" className="btn-primary btn-block" style={{ marginTop: 14, display: 'flex' }} onClick={markDone} disabled={marked}>
        <CheckCircle2 size={17} />
        {marked ? 'Đã đánh dấu đã học' : 'Đánh dấu đã học bài này'}
      </button>
    </div>
  );
}
