import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../api/client';
import AdminLessons from './AdminLessons';

export default function AdminLevelDetail() {
  const { levelId } = useParams();
  const [level, setLevel] = useState(null);

  useEffect(() => {
    api.get(`/levels/${levelId}`).then((res) => setLevel(res.data));
  }, [levelId]);

  return (
    <div>
      <Link to="/admin" className="top-back-link"><ArrowLeft size={14} style={{ verticalAlign: -2, marginRight: 4 }} />Tất cả cấp độ</Link>
      <h2 style={{ marginTop: 6, marginBottom: 2 }}>{level ? `${level.code} — ${level.name}` : 'Đang tải...'}</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0, marginBottom: 18 }}>
        Danh sách bài học thuộc cấp độ này. Bấm "Nội dung" trên mỗi bài để chỉnh sửa từ vựng, ngữ pháp, câu, PPT, video, bài hát...
      </p>
      <AdminLessons levelId={levelId} />
    </div>
  );
}
