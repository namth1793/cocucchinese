import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, BookOpen, Layers3, ListChecks, GraduationCap, RotateCcw, ArrowRight } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const BAND_COLORS = ['#DC2626', '#059669', '#D97706', '#2563EB', '#7C3AED', '#DB2777'];
const bandFor = (index) => BAND_COLORS[index % BAND_COLORS.length];
const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const SAMPLE_CARDS = [
  { hanzi: '你好', pinyin: 'nǐ hǎo' },
  { hanzi: '谢谢', pinyin: 'xièxiè' },
  { hanzi: '学习', pinyin: 'xuéxí' }
];

export default function Dashboard() {
  const { user } = useAuth();
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(null);
  const [stats, setStats] = useState(null);
  const [reviewCounts, setReviewCounts] = useState(null);

  useEffect(() => {
    api.get('/levels').then((res) => {
      const sorted = [...res.data].sort((a, b) => (a.type === b.type ? a.order - b.order : a.type.localeCompare(b.type)));
      setLevels(sorted);
    }).finally(() => setLoading(false));
    api.get('/progress/streak').then((res) => setStreak(res.data));
    api.get('/stats/overview').then((res) => setStats(res.data));
    api.get('/progress/review/all').then((res) => setReviewCounts({ words: res.data.words.length, sentences: res.data.sentences.length }));
  }, []);

  const todayIndex = (new Date().getDay() + 6) % 7;
  const firstLevel = levels[0];
  const reviewTotal = reviewCounts ? reviewCounts.words + reviewCounts.sentences : 0;

  return (
    <div>
      <h2 className="page-title" style={{ fontSize: 17 }}>Các cấp độ</h2>
      <p className="page-sub">HSK / YCT → Bài → Chủ đề → Dạng bài</p>

      {loading && <p className="empty-state">Đang tải...</p>}
      <div className="level-grid" style={{ marginBottom: 24 }}>
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

      <div className="hero-grid">
        <div className="hero-banner">
          <div className="hero-banner-text">
            <h1>Kiên trì mỗi ngày,<br /><em>giỏi tiếng Trung nhanh hơn</em></h1>
            <p>Chọn một cấp độ bên dưới và tiếp tục hành trình chinh phục HSK/YCT của bạn.</p>
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
