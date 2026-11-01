import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCw } from 'lucide-react';
import api from '../api/client';
import { API_BASE, sandboxFor } from './HtmlLesson';

/** Làm bài kiểm tra (file HTML của khoá học) toàn màn hình. */
export default function TestViewer() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [src, setSrc] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setSrc('');
    setError('');
    api.get(`/course-tests/${testId}/token`)
      .then((res) => {
        setTest(res.data);
        setSrc(`${API_BASE}/course-tests/${testId}/view?token=${encodeURIComponent(res.data.token)}&v=${res.data.version}`);
      })
      .catch((err) => {
        const status = err?.response?.status;
        setError(status === 403 ? 'Bạn chưa được cấp quyền làm bài kiểm tra này.'
          : status === 404 ? 'Không tìm thấy bài kiểm tra.' : 'Không tải được bài kiểm tra, vui lòng thử lại.');
      });
  }, [testId, reloadKey]);

  return (
    <div className="html-viewer">
      <div className="html-viewer-bar">
        <button type="button" className="html-viewer-back" onClick={() => navigate(test ? `/courses/${test.levelId}` : '/courses')}>
          <ArrowLeft size={16} /> <span>Về khoá học</span>
        </button>
        <div className="html-viewer-title">{test?.title || ''}</div>
        <div className="html-viewer-nav">
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} title="Tải lại"><RotateCw size={16} /></button>
        </div>
      </div>
      {error && <p className="empty-state" style={{ padding: 24 }}>{error}</p>}
      {!error && !src && <p className="empty-state" style={{ padding: 24 }}>Đang tải bài kiểm tra...</p>}
      {src && (
        <iframe
          key={src}
          title={test?.title || 'Bài kiểm tra'}
          src={src}
          sandbox={sandboxFor(src)}
          allow="autoplay; fullscreen; microphone"
          className="html-viewer-frame"
        />
      )}
    </div>
  );
}
