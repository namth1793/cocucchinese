import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../api/client';
import { API_BASE } from '../HtmlLesson';

/**
 * Điểm danh học sinh: ứng dụng quản lý lớp (file HTML riêng, xem backend/classroom) mở toàn màn
 * hình. Không dùng sandbox: file do mình cung cấp và cần localStorage, Firebase, in, tải Excel.
 */
export default function AdminClassroom() {
  const navigate = useNavigate();
  const [src, setSrc] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/classroom/token')
      .then((res) => setSrc(`${API_BASE}/classroom/view?token=${encodeURIComponent(res.data.token)}`))
      .catch(() => setError('Không tải được trang điểm danh, vui lòng thử lại.'));
  }, []);

  return (
    <div className="html-viewer">
      <div className="html-viewer-bar">
        <button type="button" className="html-viewer-back" onClick={() => navigate('/admin')}>
          <ArrowLeft size={16} /> <span>Về trang quản trị</span>
        </button>
        <div className="html-viewer-title">Điểm danh học sinh</div>
      </div>
      {error && <p className="empty-state" style={{ padding: 24 }}>{error}</p>}
      {!error && !src && <p className="empty-state" style={{ padding: 24 }}>Đang tải...</p>}
      {src && <iframe title="Điểm danh học sinh" src={src} allow="autoplay; fullscreen" className="html-viewer-frame" />}
    </div>
  );
}
