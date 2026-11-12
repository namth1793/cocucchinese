import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import api from '../api/client';
import { API_BASE } from './HtmlLesson';

export default function ExamViewer() {
  const { paperId } = useParams();
  const navigate = useNavigate();
  const [paper, setPaper] = useState(null);
  const [error, setError] = useState('');
  const [src, setSrc] = useState('');

  useEffect(() => {
    setSrc('');
    api.get(`/exam-papers/${paperId}`)
      .then(async (res) => {
        setPaper(res.data);
        const url = res.data.url;
        if (!url) return;
        // File trên R2 (URL http) mở thẳng; file lưu trên ổ đĩa server (/uploads/media) cần đăng nhập
        // mà iframe không gửi được header -> xin token ngắn hạn rồi mở qua route /view.
        if (/^https?:/i.test(url)) { setSrc(url); return; }
        const { data } = await api.get(`/exam-papers/${paperId}/token`);
        setSrc(`${API_BASE}/exam-papers/${paperId}/view?token=${encodeURIComponent(data.token)}`);
      })
      .catch(() => setError('Không tìm thấy đề thi.'));
  }, [paperId]);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else if (paper) navigate(`/levels/${paper.levelId}`);
    else navigate('/');
  };

  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#dc2626', color: '#fff', flexShrink: 0 }}>
        <button
          type="button"
          onClick={goBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', color: '#dc2626', border: 'none', borderRadius: 8, padding: '7px 12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', flexShrink: 0 }}
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
        <div style={{ flex: 1, minWidth: 0, fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {paper ? `${paper.group ? paper.group + ' · ' : ''}${paper.title}` : ''}
        </div>
        {src && (
          <a href={src} target="_blank" rel="noreferrer" title="Mở trong tab mới" style={{ color: '#fff', display: 'inline-flex', flexShrink: 0 }}>
            <ExternalLink size={18} />
          </a>
        )}
      </div>
      {error && <p className="empty-state" style={{ padding: 20 }}>{error}</p>}
      {src && (
        <iframe title={paper.title} src={src} style={{ flex: 1, width: '100%', border: 'none' }} />
      )}
    </div>
  );
}
