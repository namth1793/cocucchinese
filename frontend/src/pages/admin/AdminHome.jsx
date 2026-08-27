import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Settings2 } from 'lucide-react';
import api from '../../api/client';

export default function AdminHome() {
  const [stats, setStats] = useState(null);

  useEffect(() => { api.get('/stats/overview').then((res) => setStats(res.data)); }, []);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Tổng quan quản trị</h2>
      <p style={{ fontSize: 13.5, color: 'var(--muted)', marginTop: -6, marginBottom: 20 }}>
        Chọn một cấp độ ở thanh bên để quản lý bài học và nội dung (từ vựng, ngữ pháp, câu, PPT, video, bài hát...).
      </p>

      <div className="stats-row" style={{ marginBottom: 20 }}>
        <div className="stat-tile">
          <span className="stat-tile-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary-dark)' }}><GraduationCap size={17} /></span>
          <div><div className="stat-tile-num">{stats ? stats.levels : '—'}</div><div className="stat-tile-label">Cấp độ</div></div>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-icon" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}><GraduationCap size={17} /></span>
          <div><div className="stat-tile-num">{stats ? stats.lessons : '—'}</div><div className="stat-tile-label">Bài học</div></div>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-icon" style={{ background: 'var(--jade-soft)', color: 'var(--jade-dark)' }}><GraduationCap size={17} /></span>
          <div><div className="stat-tile-num">{stats ? stats.words : '—'}</div><div className="stat-tile-label">Từ vựng</div></div>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}><GraduationCap size={17} /></span>
          <div><div className="stat-tile-num">{stats ? stats.sentences : '—'}</div><div className="stat-tile-label">Câu ví dụ</div></div>
        </div>
      </div>

      <Link to="/admin/levels" className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
        <span className="module-card-icon" style={{ background: 'var(--ink-soft)' }}><Settings2 size={18} /></span>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--ink)' }}>Quản lý chi tiết tất cả cấp độ</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>Sửa mã, tên, loại, thứ tự hiển thị của từng cấp độ.</div>
        </div>
      </Link>
    </div>
  );
}
