import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, BookOpen, Layers3, ListChecks, GraduationCap, RotateCcw, ArrowRight } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import ProgressBar from '../components/ProgressBar';
import CourseCover from '../components/CourseCover';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const SAMPLE_CARDS = [
  { hanzi: '你好', pinyin: 'nǐ hǎo' },
  { hanzi: '谢谢', pinyin: 'xièxiè' },
  { hanzi: '学习', pinyin: 'xuéxí' }
];

export default function Dashboard() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(null);
  const [stats, setStats] = useState(null);
  const [reviewCounts, setReviewCounts] = useState(null);

  useEffect(() => {
    api.get('/courses/mine/list').then((res) => {
      const order = { learning: 0, purchased: 1, completed: 2 };
      setCourses([...res.data].sort((x, y) => (order[x.status] ?? 9) - (order[y.status] ?? 9) || (x.course.name > y.course.name ? 1 : -1)));
    }).finally(() => setLoading(false));
    api.get('/progress/streak').then((res) => setStreak(res.data));
    api.get('/stats/overview').then((res) => setStats(res.data));
    api.get('/progress/review/all').then((res) => setReviewCounts({ words: res.data.words.length, sentences: res.data.sentences.length }));
  }, []);

  const todayIndex = (new Date().getDay() + 6) % 7;
  const firstLevel = courses[0]?.course;
  const reviewTotal = reviewCounts ? reviewCounts.words + reviewCounts.sentences : 0;

  return (
    <div>
      <div className="hero-grid">
        <div className="hero-banner">
          <div className="hero-banner-text">
            <h1>Kiên trì mỗi ngày,<br /><em>giỏi tiếng Trung nhanh hơn</em></h1>
            <p>Chọn một khoá học bên dưới và tiếp tục hành trình chinh phục HSK/YCT của bạn.</p>
            {firstLevel && (
              <Link to={`/levels/${firstLevel.id}`} className="btn-primary">
                Bắt đầu học ngay <ArrowRight size={16} />
              </Link>
            )}
          </div>
          <div className="hero-illustration">
            <div className="hero-card-fan">
              {SAMPLE_CARDS.map((c, i) => (
                <div key={c.hanzi} className="hero-mini-card" style={{ transform: `rotate(${(i - 1) * 10}deg) translateX(${(i - 1) * 6}px)`, zIndex: i === 1 ? 2 : 1 }}>
                  <span className="mc-hanzi">{c.hanzi}</span>
                  <span className="mc-pinyin">{c.pinyin}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="streak-card">
          <div className="streak-header"><Flame size={17} color="var(--gold)" /> Chuỗi ngày học</div>
          <div className="streak-body">
            <span className="streak-flame"><Flame size={22} /></span>
            <div>
              <div className="streak-count-num">{streak ? streak.currentStreak : 0} ngày</div>
              <div className="streak-count-label">liên tiếp</div>
            </div>
          </div>
          <div className="streak-days">
            {WEEKDAY_LABELS.map((label, i) => (
              <div key={label} className={`streak-day ${streak?.activeDays?.[i] ? 'active' : ''} ${i === todayIndex ? 'today' : ''}`}>
                <span className="streak-day-label">{label}</span>
                <span className="streak-day-dot" />
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-soft)', marginBottom: 12 }}>
            Học ít nhất một bài mỗi ngày để giữ chuỗi và ghi nhớ lâu hơn.
          </p>
          {firstLevel && <Link to={`/levels/${firstLevel.id}`} className="btn-primary btn-block">Học ngay hôm nay</Link>}
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-tile">
          <span className="stat-tile-icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary-dark)' }}><GraduationCap size={17} /></span>
          <div><div className="stat-tile-num">{stats ? stats.levels : '—'}</div><div className="stat-tile-label">Cấp độ</div></div>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-icon" style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}><BookOpen size={17} /></span>
          <div><div className="stat-tile-num">{stats ? stats.lessons : '—'}</div><div className="stat-tile-label">Bài học</div></div>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-icon" style={{ background: 'var(--jade-soft)', color: 'var(--jade-dark)' }}><Layers3 size={17} /></span>
          <div><div className="stat-tile-num">{stats ? stats.words : '—'}</div><div className="stat-tile-label">Từ vựng</div></div>
        </div>
        <div className="stat-tile">
          <span className="stat-tile-icon" style={{ background: '#EDE9FE', color: '#7C3AED' }}><ListChecks size={17} /></span>
          <div><div className="stat-tile-num">{stats ? stats.sentences : '—'}</div><div className="stat-tile-label">Câu ví dụ</div></div>
        </div>
      </div>

      <h2 className="page-title" style={{ fontSize: 17 }}>Khoá học của tôi</h2>
      <p className="page-sub">Chỉ hiển thị các khoá học email của bạn đã được cấp quyền.</p>

      {loading && <p className="empty-state">Đang tải...</p>}
      <div className="level-grid" style={{ marginBottom: 12 }}>
        {courses.map((c, i) => (
          <Link to={`/levels/${c.course.id}`} key={c.enrollmentId} className="level-card">
            <CourseCover course={c.course} colorIndex={i} />
            <span className="level-card-body">
              <span className="level-card-name">{c.course.name}</span>
              <span style={{ display: 'flex' }}><StatusBadge status={c.status} /></span>
              <ProgressBar percent={c.progressPercent} />
            </span>
          </Link>
        ))}
      </div>
      {!loading && courses.length === 0 && <p className="empty-state">Bạn chưa có khoá học nào.</p>}
      <p style={{ marginBottom: 24 }}><Link to="/courses" className="btn-secondary">Khám phá thêm khoá học</Link></p>

      {reviewCounts && reviewTotal > 0 && (
        <div className="card suggest-card">
          <h3 style={{ marginTop: 0, marginBottom: 4 }}>Gợi ý cho bạn</h3>
          <div className="suggest-item">
            <span className="suggest-icon"><RotateCcw size={16} /></span>
            <div className="suggest-body">
              <div className="suggest-title">Ôn lại {reviewTotal} từ/câu đã làm sai</div>
              <div className="suggest-desc">{reviewCounts.words} từ · {reviewCounts.sentences} câu cần ôn tập</div>
            </div>
            <Link to="/review" className="btn-secondary">Ôn ngay</Link>
          </div>
        </div>
      )}
    </div>
  );
}
