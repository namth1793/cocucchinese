import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Clock } from 'lucide-react';
import api from '../api/client';
import { formatVnd } from '../constants/enrollment';
import CourseCover from '../components/CourseCover';

/** Danh sách khoá học công khai - học viên chọn khoá phù hợp rồi xem chi tiết/đăng ký. */
export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses').then((res) => setCourses(res.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="pub-hero">
        <h1>Chọn khoá học HSK phù hợp với bạn</h1>
        <p>Lộ trình rõ ràng theo từng cấp độ. Đăng ký, thanh toán và được cấp quyền học ngay bằng email của bạn.</p>
      </div>

      {loading && <p className="empty-state">Đang tải...</p>}
      <div className="pub-course-grid">
        {courses.map((c, i) => (
          <Link to={`/courses/${c.id}`} key={c.id} className="pub-course-card">
            <CourseCover course={c} colorIndex={i} />
            <span className="pub-course-body">
              <span className="pub-course-name">{c.name}</span>
              <span className="pub-course-desc">{c.description || 'Xem lộ trình và nội dung chi tiết của khoá học.'}</span>
              <span className="pub-course-meta">
                <span><BookOpen size={13} /> {c.lessonCount} bài học</span>
                {c.duration && <span><Clock size={13} /> {c.duration}</span>}
              </span>
              <span className="pub-course-price">{formatVnd(c.price)}</span>
            </span>
          </Link>
        ))}
      </div>
      {!loading && courses.length === 0 && <p className="empty-state">Hiện chưa có khoá học nào mở đăng ký.</p>}
    </div>
  );
}
