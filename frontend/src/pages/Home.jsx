import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, CheckCircle2, Clock, LogIn } from 'lucide-react';
import api from '../api/client';
import { formatVnd } from '../constants/enrollment';
import { COURSE_CATEGORIES } from '../constants/courseCategories';
import CourseCover from '../components/CourseCover';
import PlumBlossom from '../components/PlumBlossom';

const HERO_CARDS = [
  { hanzi: '你好', pinyin: 'nǐ hǎo', vi: 'Xin chào' },
  { hanzi: '学习', pinyin: 'xuéxí', vi: 'Học tập' },
  { hanzi: '中文', pinyin: 'zhōngwén', vi: 'Tiếng Trung' }
];

const CATEGORY_INTRO = {
  hsk_hskk: { hanzi: '考', desc: 'Lộ trình HSK 3.0 từ cấp 1 đến 6 và luyện nói HSKK theo chuẩn kỳ thi quốc tế.' },
  kids: { hanzi: '童', desc: 'YCT, flashcard, truyện và bài hát giúp trẻ làm quen tiếng Trung tự nhiên.' },
  conversation: { hanzi: '说', desc: 'Giao tiếp hằng ngày, du lịch, công việc - học xong dùng được ngay.' }
};

const REASONS = [
  { title: 'Bám sát giáo trình chuẩn HSK / YCT', desc: 'Mỗi khoá là một cấp độ, chia bài rõ ràng theo đúng lộ trình thi.' },
  { title: 'Đủ kỹ năng trong một bài học', desc: 'Bài giảng, từ vựng, ngữ pháp, hội thoại, chữ Hán, nghe, đọc, dịch và luyện nói.' },
  { title: 'Ôn tập bằng flashcard và trò chơi', desc: 'Ghép đôi, sắp xếp câu, nghe chọn, trí nhớ... được tạo tự động từ chính bài học.' },
  { title: 'Tự động ôn lại phần làm sai', desc: 'Từ và câu trả lời sai được đưa vào hàng đợi ôn tập riêng cho bạn.' },
  { title: 'Theo dõi tiến độ, học mọi lúc', desc: 'Giao diện tối ưu cho điện thoại, lưu tiến độ và chuỗi ngày học liên tục.' }
];

const STEPS = [
  { title: 'Chọn khoá học', desc: 'Xem lộ trình và học phí của từng cấp độ.' },
  { title: 'Đăng ký & chuyển khoản', desc: 'Điền email dùng để học và thanh toán theo hướng dẫn.' },
  { title: 'Nhận quyền học', desc: 'Trung tâm xác nhận và cấp quyền cho đúng email của bạn.' },
  { title: 'Đăng nhập & bắt đầu', desc: 'Vào trang học, theo dõi tiến độ trên mọi thiết bị.' }
];

const fmtNum = (n) => (typeof n === 'number' ? n.toLocaleString('vi-VN') : '—');

function SectionHead({ eyebrow, title, desc }) {
  return (
    <div className="home-section-head">
      <span className="home-eyebrow"><PlumBlossom size={13} /> {eyebrow}</span>
      <h2>{title}</h2>
      {desc && <p>{desc}</p>}
    </div>
  );
}

function CatalogCard({ course, index }) {
  const body = (
    <>
      <span className="home-course-cover">
        <CourseCover course={course} colorIndex={index} />
        <span className={`home-course-flag ${course.forSale ? 'open' : ''}`}>{course.forSale ? 'Đang mở đăng ký' : 'Sắp mở'}</span>
      </span>
      <span className="home-course-body">
        <span className="home-course-name">{course.name}</span>
        <span className="home-course-meta">
          <span><BookOpen size={13} /> {course.lessonCount} bài học</span>
          {course.duration && <span><Clock size={13} /> {course.duration}</span>}
        </span>
        <span className="home-course-foot">
          {course.forSale
            ? <><span className="home-course-price">{formatVnd(course.price)}</span><span className="home-course-go">Chi tiết <ArrowRight size={14} /></span></>
            : <span className="home-course-soon">Nội dung đang được biên soạn</span>}
        </span>
      </span>
    </>
  );
  return course.forSale
    ? <Link to={`/courses/${course.id}`} className="home-course-card">{body}</Link>
    : <div className="home-course-card is-soon">{body}</div>;
}

/** Trang chủ công khai cho khách - học viên đăng nhập sẽ vào thẳng Dashboard thay vì trang này. */
export default function Home() {
  const [catalog, setCatalog] = useState(null);
  const [activeCat, setActiveCat] = useState(COURSE_CATEGORIES[0].key);

  useEffect(() => {
    api.get('/courses/catalog').then((res) => setCatalog(res.data)).catch(() => setCatalog({ courses: [], stats: {} }));
  }, []);

  const courses = catalog?.courses || [];
  const stats = catalog?.stats || {};
  const countByCat = useMemo(() => Object.fromEntries(
    COURSE_CATEGORIES.map((c) => [c.key, courses.filter((x) => x.category === c.key).length])
  ), [courses]);
  // "HSK & HSKK" có 2 nhóm con cùng thứ tự 1,2,3... nên xếp theo nhóm trước để HSK và HSKK không xen kẽ.
  const shown = courses.filter((c) => c.category === activeCat)
    .sort((a, b) => a.group.localeCompare(b.group) || 0);
  const featured = courses.filter((c) => c.forSale).slice(0, 3);

  const openCategory = (key) => {
    setActiveCat(key);
    document.getElementById('khoa-hoc')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="home">
      {/* ---------- Hero ---------- */}
      <section className="home-hero">
        <div className="home-container home-hero-grid">
          <div className="home-hero-text">
            <span className="home-pill">中文 · HSK 3.0 · YCT · HSKK</span>
            <h1>Học tiếng Trung<br /><em>bài bản, học là nhớ</em></h1>
            <p>Lộ trình từ cơ bản đến nâng cao theo chuẩn HSK / YCT. Đăng ký một lần, học trên mọi thiết bị bằng chính email của bạn.</p>
            <div className="home-hero-actions">
              <a href="#khoa-hoc" className="btn-primary">Xem khoá học <ArrowRight size={16} /></a>
              <Link to="/login" className="btn-secondary"><LogIn size={16} /> Đăng nhập học</Link>
            </div>
            <ul className="home-hero-checks">
              <li><CheckCircle2 size={15} /> Xem trước lộ trình từng khoá</li>
              <li><CheckCircle2 size={15} /> Cấp quyền học theo email</li>
            </ul>
          </div>

          <div className="home-hero-visual" aria-hidden="true">
            <div className="home-hero-panel">
              <span className="home-hero-seal">汉语</span>
              <div className="home-hero-cards">
                {HERO_CARDS.map((c, i) => (
                  <div key={c.hanzi} className={`home-hero-card home-hero-card-${i}`}>
                    <span className="hc-hanzi">{c.hanzi}</span>
                    <span className="hc-pinyin">{c.pinyin}</span>
                    <span className="hc-vi">{c.vi}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="home-hero-chip home-hero-chip-a"><b>{fmtNum(stats.lessons)}</b> bài học</div>
            <div className="home-hero-chip home-hero-chip-b"><b>{fmtNum(stats.words)}</b> từ vựng</div>
          </div>
        </div>
      </section>

      {/* ---------- Danh mục nhanh + số liệu ---------- */}
      <section className="home-container home-quick">
        <div className="home-quick-grid">
          {COURSE_CATEGORIES.map((cat) => (
            <button type="button" key={cat.key} className="home-quick-tile" onClick={() => openCategory(cat.key)}>
              <span className="home-quick-hanzi">{CATEGORY_INTRO[cat.key]?.hanzi}</span>
              <span className="home-quick-body">
                <span className="home-quick-title">{cat.label}</span>
                <span className="home-quick-desc">{CATEGORY_INTRO[cat.key]?.desc}</span>
                <span className="home-quick-count">{countByCat[cat.key] || 0} khoá học <ArrowRight size={13} /></span>
              </span>
            </button>
          ))}
        </div>
        <div className="home-stats">
          <div><b>{fmtNum(stats.courses)}</b><span>Khoá học</span></div>
          <div><b>{fmtNum(stats.lessons)}</b><span>Bài học</span></div>
          <div><b>{fmtNum(stats.words)}</b><span>Từ vựng</span></div>
          <div><b>{fmtNum(stats.sentences)}</b><span>Câu ví dụ</span></div>
        </div>
      </section>

      {/* ---------- Vì sao chọn ---------- */}
      <section className="home-container home-why">
        <div>
          <SectionHead eyebrow="Vì sao chọn HSK 360" title="Một nơi học đủ mọi kỹ năng tiếng Trung" />
          <ol className="home-reasons">
            {REASONS.map((r, i) => (
              <li key={r.title}>
                <span className="home-reason-num">{i + 1}</span>
                <span>
                  <span className="home-reason-title">{r.title}</span>
                  <span className="home-reason-desc">{r.desc}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div className="home-why-card">
          <span className="home-why-seal">学</span>
          <h3>Học mỗi ngày một chút</h3>
          <p>Mỗi bài học được thiết kế để hoàn thành trong một buổi, có bài tập và trò chơi ôn tập ngay sau đó.</p>
          {featured.length > 0 ? (
            <ul className="home-why-list">
              {featured.map((c) => (
                <li key={c.id}>
                  <Link to={`/courses/${c.id}`}>
                    <span>{c.name}</span>
                    <b>{formatVnd(c.price)}</b>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
          <a href="#khoa-hoc" className="btn-primary btn-block">Chọn khoá học phù hợp</a>
        </div>
      </section>

      {/* ---------- Khoá học ---------- */}
      <section className="home-band" id="khoa-hoc">
        <div className="home-container">
          <SectionHead
            eyebrow="Khoá học & lộ trình"
            title="Chọn khoá học phù hợp với bạn"
            desc="Mỗi cấp độ là một khoá học riêng. Bấm vào khoá đang mở đăng ký để xem lộ trình chi tiết và học phí."
          />
          <div className="home-tabs" role="tablist">
            {COURSE_CATEGORIES.map((cat) => (
              <button
                key={cat.key} type="button" role="tab" aria-selected={activeCat === cat.key}
                className={`home-tab ${activeCat === cat.key ? 'active' : ''}`}
                onClick={() => setActiveCat(cat.key)}
              >
                {cat.label} <span className="home-tab-count">{countByCat[cat.key] || 0}</span>
              </button>
            ))}
          </div>
          {catalog === null && <p className="empty-state">Đang tải...</p>}
          <div className="home-course-grid">
            {shown.map((c, i) => <CatalogCard key={c.id} course={c} index={i} />)}
          </div>
          {catalog !== null && shown.length === 0 && <p className="empty-state">Danh mục này chưa có khoá học.</p>}
        </div>
      </section>

      {/* ---------- Quy trình ---------- */}
      <section className="home-container home-steps-wrap">
        <SectionHead eyebrow="Bắt đầu thế nào" title="4 bước để vào học" />
        <ol className="home-steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <span className="home-step-num">{String(i + 1).padStart(2, '0')}</span>
              <span className="home-step-title">{s.title}</span>
              <span className="home-step-desc">{s.desc}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- Kêu gọi hành động ---------- */}
      <section className="home-container">
        <div className="home-cta">
          <span className="home-cta-hanzi" aria-hidden="true">加油</span>
          <div className="home-cta-text">
            <h2>Sẵn sàng chinh phục tiếng Trung?</h2>
            <p>Đã được cấp quyền? Đăng nhập để tiếp tục học. Chưa có khoá học? Chọn một cấp độ phù hợp và đăng ký ngay.</p>
          </div>
          <div className="home-cta-actions">
            <a href="#khoa-hoc" className="btn-primary">Đăng ký khoá học</a>
            <Link to="/login" className="btn-secondary"><LogIn size={16} /> Đăng nhập</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
