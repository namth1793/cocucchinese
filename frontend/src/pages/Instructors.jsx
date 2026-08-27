import { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';
import api from '../api/client';
import AuthImage from '../components/AuthImage';
import PageHeader from '../components/PageHeader';

export default function Instructors() {
  const [instructors, setInstructors] = useState(null);

  useEffect(() => {
    api.get('/instructors').then((res) => {
      const sorted = [...res.data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      setInstructors(sorted);
    });
  }, []);

  return (
    <div>
      <PageHeader icon={UserRound} color="#7C3AED" title="Giới thiệu giảng viên" subtitle="Đội ngũ giảng dạy tại HSK 360" />

      {instructors === null && <p className="empty-state">Đang tải...</p>}

      <div className="instructor-grid">
        {instructors?.map((ins) => (
          <div key={ins.id} className="card instructor-card">
            {ins.avatarUrl ? (
              <AuthImage src={ins.avatarUrl} alt={ins.name} className="instructor-avatar" />
            ) : (
              <div className="instructor-avatar instructor-avatar-empty"><UserRound size={30} /></div>
            )}
            <div className="instructor-body">
              <div className="instructor-name">{ins.name}</div>
              {ins.title && <div className="instructor-title">{ins.title}</div>}
              {ins.bio && <p className="instructor-bio">{ins.bio}</p>}
            </div>
          </div>
        ))}
      </div>

      {instructors?.length === 0 && <p className="empty-state">Chưa có thông tin giảng viên.</p>}
    </div>
  );
}
