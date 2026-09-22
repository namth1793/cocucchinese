import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, CheckCircle2, Clock, Layers3, ListChecks, ShoppingCart, Users } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatVnd } from '../constants/enrollment';
import CourseCover from '../components/CourseCover';

function OrderForm({ course }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user?.name || '', email: user?.email || '', phone: '', password: '', note: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/orders', { ...form, levelId: course.id });
      navigate(`/order/${data.code}`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Không gửi được đăng ký, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card pub-order-card" onSubmit={submit}>
      <div className="pub-order-price">{formatVnd(course.price)}</div>
      <p className="pub-order-hint">Đăng ký → chuyển khoản → nhận quyền học bằng email bạn nhập bên dưới.</p>
      {error && <div className="form-error">{error}</div>}
      <div className="form-field">
        <label>Họ và tên</label>
        <input value={form.name} onChange={set('name')} required />
      </div>
      <div className="form-field">
        <label>Email dùng để đăng nhập học</label>
        <input type="email" value={form.email} onChange={set('email')} required />
      </div>
      <div className="form-field">
        <label>Số điện thoại (không bắt buộc)</label>
        <input value={form.phone} onChange={set('phone')} inputMode="tel" />
      </div>
      <div className="form-field">
        <label>Mật khẩu đăng nhập (tối thiểu 6 ký tự)</label>
        <input type="password" value={form.password} onChange={set('password')} minLength={6} autoComplete="new-password" />
        <span className="pub-field-note">Nếu email này đã có tài khoản, bạn vẫn dùng mật khẩu cũ để đăng nhập.</span>
      </div>
      <div className="form-field">
        <label>Ghi chú (không bắt buộc)</label>
        <textarea rows={2} value={form.note} onChange={set('note')} />
      </div>
      <button type="submit" className="btn-primary btn-block" disabled={loading}>
        <ShoppingCart size={17} /> {loading ? 'Đang gửi...' : 'Đăng ký khoá học'}
      </button>
    </form>
  );
}

export default function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [owned, setOwned] = useState(false);

  useEffect(() => {
    setCourse(null);
    setNotFound(false);
    api.get(`/courses/${courseId}`).then((res) => setCourse(res.data)).catch(() => setNotFound(true));
  }, [courseId]);

  useEffect(() => {
    if (!user) { setOwned(false); return; }
    api.get('/courses/mine/list')
      .then((res) => setOwned(res.data.some((x) => x.course.id === courseId)))
      .catch(() => setOwned(false));
  }, [user, courseId]);

  if (notFound) return <p className="empty-state">Không tìm thấy khoá học. <Link to="/courses">Xem tất cả khoá học</Link></p>;
  if (!course) return <p className="empty-state">Đang tải...</p>;

  const isStaff = user && (user.role === 'admin' || user.role === 'teacher');

  return (
    <div>
      <Link to="/courses" className="top-back-link">← Tất cả khoá học</Link>
      <div className="pub-detail-grid">
        <div>
          <span className="pub-detail-code">{course.code}</span>
          <h1 className="pub-detail-title">{course.name}</h1>
          <div className="pub-course-meta" style={{ marginBottom: 14 }}>
            <span><BookOpen size={14} /> {course.lessonCount} bài học</span>
            {course.duration && <span><Clock size={14} /> {course.duration}</span>}
            {course.audience && <span><Users size={14} /> {course.audience}</span>}
          </div>
          {course.description && <p className="pub-detail-desc">{course.description}</p>}

          <div className="pub-stat-row">
            <div className="pub-stat"><Layers3 size={16} /><b>{course.stats.words}</b> từ vựng</div>
            <div className="pub-stat"><BookOpen size={16} /><b>{course.stats.grammarPoints}</b> điểm ngữ pháp</div>
            <div className="pub-stat"><ListChecks size={16} /><b>{course.stats.sentences}</b> câu ví dụ</div>
          </div>

          {course.outcomes.length > 0 && (
            <>
              <h2 className="pub-section-title">Bạn sẽ đạt được</h2>
              <ul className="pub-outcomes">
                {course.outcomes.map((o, i) => <li key={i}><CheckCircle2 size={16} /> {o}</li>)}
              </ul>
            </>
          )}

          <h2 className="pub-section-title">Lộ trình học</h2>
          <ol className="pub-roadmap">
            {course.roadmap.map((l) => (
              <li key={l.id}>
                <span className="pub-roadmap-num">{String(l.order).padStart(2, '0')}</span>
                <span>
                  <span className="pub-roadmap-title">{l.title}</span>
                  {l.description && <span className="pub-roadmap-desc">{l.description}</span>}
                </span>
              </li>
            ))}
          </ol>
          {course.roadmap.length === 0 && <p className="empty-state" style={{ textAlign: 'left' }}>Lộ trình đang được cập nhật.</p>}
          <p className="pub-field-note">Nội dung chi tiết từng bài (từ vựng, bài tập, bài giảng...) chỉ hiển thị sau khi bạn được cấp quyền học.</p>
        </div>

        <aside>
          <CourseCover course={course} className="cover-detail" />
          {isStaff ? (
            <div className="card pub-order-card">
              <div className="pub-order-price">{formatVnd(course.price)}</div>
              <Link to={`/admin/levels/${course.id}`} className="btn-secondary btn-block">Mở trong trang quản trị</Link>
            </div>
          ) : owned ? (
            <div className="card pub-order-card">
              <div className="pub-order-price" style={{ fontSize: 18 }}>Bạn đã có quyền học khoá này</div>
              <Link to={`/levels/${course.id}`} className="btn-primary btn-block">Vào học ngay</Link>
            </div>
          ) : (
            <OrderForm course={course} />
          )}
        </aside>
      </div>
    </div>
  );
}
