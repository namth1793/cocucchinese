import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const BAND_COLORS = ['#DC2626', '#059669', '#D97706', '#2563EB', '#7C3AED', '#DB2777'];
const bandFor = (index) => BAND_COLORS[index % BAND_COLORS.length];

export default function Dashboard() {
  const { user } = useAuth();
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/levels').then((res) => {
      const sorted = [...res.data].sort((a, b) => (a.type === b.type ? a.order - b.order : a.type.localeCompare(b.type)));
      setLevels(sorted);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="hero-banner">
        <h1>Chào {user?.name?.split(' ').pop() || 'bạn'}, tiếp tục hành trình nhé!</h1>
        <p>Chọn một cấp độ HSK hoặc YCT bên dưới để bắt đầu bài học hôm nay.</p>
      </div>

      <h2 className="page-title" style={{ fontSize: 17 }}>Các cấp độ</h2>
      <p className="page-sub">HSK / YCT → Bài → Chủ đề → Dạng bài</p>

      {loading && <p className="empty-state">Đang tải...</p>}
      <div className="level-grid">
        {levels.map((lv, i) => (
          <Link to={`/levels/${lv.id}`} key={lv.id} className="level-card">
            <span className="level-card-band" style={{ background: bandFor(i) }}>
              <span className="level-card-band-label">{lv.code}</span>
            </span>
            <span className="level-card-body">
              <span className="level-card-name">{lv.name}</span>
              <span className="level-card-sub">{lv.type === 'HSK' ? 'Hán ngữ tiêu chuẩn' : 'Thanh thiếu niên'}</span>
            </span>
          </Link>
        ))}
      </div>
      {!loading && levels.length === 0 && <p className="empty-state">Chưa có cấp độ nào. Vui lòng liên hệ giáo viên/quản trị.</p>}
    </div>
  );
}
