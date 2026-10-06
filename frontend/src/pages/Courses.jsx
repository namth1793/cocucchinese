import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BookOpen, Clock, Gift } from 'lucide-react';
import api from '../api/client';
import { formatVnd } from '../constants/enrollment';
import CourseCover from '../components/CourseCover';

/** Danh sách khoá học công khai - học viên chọn khoá phù hợp rồi xem chi tiết/đăng ký. */
export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  // Từ khoá từ ô tìm kiếm trên header trang công khai.
  const q = (params.get('q') || '').trim();
  const norm = (t) => String(t || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase();
  const shown = q ? courses.filter((c) => norm(`${c.name} ${c.code} ${c.description}`).includes(norm(q))) : courses;

  useEffect(() => {
    api.get('/courses').then((res) => setCourses(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="pub-hero">
        <h1>Chọn khoá học HSK phù hợp với bạn</h1>
        <p>Lộ trình rõ ràng theo từng cấp độ. Đăng ký, thanh toán và được cấp quyền học ngay bằng email của bạn.</p>
      </div>

      {q && (
        <p className="empty-state" style={{ textAlign: 'left' }}>
          Kết quả tìm kiếm cho "<b>{q}</b>": {shown.length} khoá học · <Link to="/courses">Xem tất cả</Link>
        </p>
      )}

      {loading && <p className="empty-state">Đang tải...</p>}
      <div className="pub-course-grid">
        {shown.map((c, i) => (
          <Link to={`/courses/${c.id}`} key={c.id} className="pub-course-card">
            <CourseCover course={c} colorIndex={i} />
            <span className="pub-course-body">
              <span className="pub-course-name">{c.name}</span>
              <span className="pub-course-desc">{c.description || 'Xem lộ trình và nội dung chi tiết của khoá học.'}</span>
              <span className="pub-course-meta">
                <span><BookOpen size={13} /> {c.lessonCount} bài học</span>
                {c.duration && <span><Clock size={13} /> {c.duration}</span>}
              </span>
              {c.freeLessons > 0 && <span className="pub-course-free"><Gift size={13} /> Học thử miễn phí {c.freeLessons} bài đầu</span>}
              <span className="pub-course-price">{formatVnd(c.price)}</span>
            </span>
          </Link>
        ))}
      </div>
      {!loading && courses.length === 0 && <p className="empty-state">Hiện chưa có khoá học nào mở đăng ký.</p>}
    </div>
  );
}
