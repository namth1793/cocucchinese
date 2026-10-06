import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Clock, MapPin, Phone, Play, Trophy, X } from 'lucide-react';
import api from '../api/client';
import { assetUrl } from '../utils/assetUrl';
import { COURSE_CATEGORIES } from '../constants/courseCategories';
import CourseCover from '../components/CourseCover';
import SocialIcon from '../components/SocialIcon';
import { Cloud, CountUp, Lantern, Petals, Seal, useParallax } from '../components/ChineseDecor';
import { SmartLink, scrollToId, softCase, telHref, usePublicSite, useReveal, youtubeId } from '../utils/publicSite';

const CATEGORY_LABEL = Object.fromEntries(COURSE_CATEGORIES.map((c) => [c.key, c.label]));
const pad2 = (n) => String(n).padStart(2, '0');
const CN_NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

/** Ảnh mặc định (CC0, xem public/images/home/CREDITS.txt) - admin upload ảnh riêng sẽ thay thế. */
const IMG = (name) => `/images/home/${name}.jpg`;

/** Câu tiếng Trung thông dụng chạy ngang dưới banner. */
const PHRASES = [
  ['你好', 'nǐ hǎo', 'Xin chào'],
  ['谢谢', 'xièxie', 'Cảm ơn'],
  ['加油', 'jiāyóu', 'Cố lên'],
  ['学习', 'xuéxí', 'Học tập'],
  ['朋友', 'péngyou', 'Bạn bè'],
  ['中文', 'Zhōngwén', 'Tiếng Trung'],
  ['老师', 'lǎoshī', 'Thầy cô'],
  ['欢迎', 'huānyíng', 'Chào mừng'],
  ['学无止境', 'xué wú zhǐ jìng', 'Học không có điểm dừng']
];

const CULTURE = [
  { img: 'great-wall', hanzi: '长城', pinyin: 'Chángchéng', name: 'Vạn Lý Trường Thành', cls: 'tall' },
  { img: 'palace', hanzi: '故宫', pinyin: 'Gùgōng', name: 'Tử Cấm Thành', cls: 'wide' },
  { img: 'calligraphy', hanzi: '书法', pinyin: 'shūfǎ', name: 'Thư pháp' },
  { img: 'tea', hanzi: '茶道', pinyin: 'chádào', name: 'Trà đạo' },
  { img: 'lanterns-night', hanzi: '灯笼', pinyin: 'dēnglong', name: 'Đèn lồng' },
  { img: 'knots', hanzi: '中国结', pinyin: 'Zhōngguó jié', name: 'Nút thắt may mắn' }
];

const TILE_HANZI = ['课', '询', '学', '书'];

function Eyebrow({ children, hanzi, align = 'left', light = false }) {
  return (
    <p className={`hp-eyebrow hp-eyebrow-${align} ${light ? 'is-light' : ''}`} data-reveal="fade-up">
      {hanzi && <span className="hp-eyebrow-hanzi">{hanzi}</span>}
      <span className="hp-eyebrow-rule" aria-hidden="true" />
      {children}
    </p>
  );
}

/** Khung cửa trăng (月洞门) chứa bìa các khoá học thật. */
function MoonGate({ courses }) {
  const covers = courses.filter((c) => c.coverUrl).slice(0, 3);
  return (
    <div className="hp-moon-wrap" data-reveal="zoom-in" style={{ '--d': '200ms' }}>
      <div className="hp-moon">
        <span className="hp-moon-hanzi" aria-hidden="true">学</span>
        {covers.length > 0 && (
          <div className="hp-hero-books">
            {covers.map((c, i) => (
              <span key={c.id} className={`hp-hero-book hp-hero-book-${i}`}><CourseCover course={c} colorIndex={i} /></span>
            ))}
          </div>
        )}
      </div>
      <Seal text="汉语" className="hp-moon-seal" size={74} />
      <Cloud className="hp-moon-cloud" />
    </div>
  );
}

function CourseTile({ course, index }) {
  const subtitle = [course.group || CATEGORY_LABEL[course.category], `${course.lessonCount} bài học`].filter(Boolean).join(' · ');
  const inner = (
    <>
      <span className="hp-course-media">
        {course.coverUrl
          ? <img src={assetUrl(course.coverUrl)} alt="" loading="lazy" className="hp-course-bg" />
          : <span className="hp-course-bg hp-course-bg-empty" aria-hidden="true">{course.code}</span>}
        <span className={`hp-course-badge ${course.forSale ? '' : 'soon'}`}>
          {!course.forSale ? 'Sắp mở' : course.freeLessons > 0 ? `Học thử ${course.freeLessons} bài miễn phí` : 'Đang mở đăng ký'}
        </span>
        <span className="hp-course-shine" aria-hidden="true" />
      </span>
      <span className="hp-course-text">
        <span className="hp-course-index">{CN_NUM[index] || pad2(index + 1)}</span>
        <span className="hp-course-name">{course.name}</span>
        <span className="hp-course-sub">{subtitle}</span>
      </span>
    </>
  );
  const props = { className: `hp-course ${course.forSale ? '' : 'is-soon'}`, 'data-reveal': 'fade-up', style: { '--d': `${(index % 4) * 90}ms` } };
  return course.forSale
    ? <Link to={`/courses/${course.id}`} {...props}>{inner}</Link>
    : <div {...props}>{inner}</div>;
}

function VideoModal({ id, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="hp-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="hp-modal-box" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="hp-modal-close" aria-label="Đóng" onClick={onClose}><X size={22} /></button>
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0`}
          title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
        />
      </div>
    </div>
  );
}

function ConsultForm() {
  const empty = { name: '', email: '', phone: '', contactVia: 'zalo', interest: COURSE_CATEGORIES[0].label, message: '' };
  const [form, setForm] = useState(empty);
  const [state, setState] = useState({ sending: false, done: false, error: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const interests = [...COURSE_CATEGORIES.map((c) => c.label), 'Chưa rõ, cần tư vấn'];

  const submit = async (e) => {
    e.preventDefault();
    setState({ sending: true, done: false, error: '' });
    try {
      await api.post('/consultations', form);
      setState({ sending: false, done: true, error: '' });
      setForm(empty);
    } catch (err) {
      setState({ sending: false, done: false, error: err.response?.data?.error || 'Gửi không thành công, vui lòng thử lại.' });
    }
  };

  return (
    <form className="hp-form" onSubmit={submit} data-reveal="fade-left">
      <div className="hp-form-head">
        <Seal text="咨询" size={52} />
        <div>
          <h3>Để lại thông tin</h3>
          <p>Tư vấn viên sẽ gọi lại cho bạn trong giờ làm việc.</p>
        </div>
      </div>
      <div className="hp-form-row">
        <label className="hp-field">
          <span>Họ và tên</span>
          <input required value={form.name} onChange={set('name')} placeholder="Nguyễn Văn A" maxLength={100} />
        </label>
        <label className="hp-field">
          <span>Số điện thoại</span>
          <input required type="tel" value={form.phone} onChange={set('phone')} placeholder="09xx xxx xxx" maxLength={20} />
        </label>
      </div>
      <label className="hp-field">
        <span>Email <small>(không bắt buộc)</small></span>
        <input type="email" value={form.email} onChange={set('email')} placeholder="ban@email.com" maxLength={120} />
      </label>
      <fieldset>
        <legend>Liên lạc với bạn qua</legend>
        {[['zalo', 'Zalo'], ['facebook', 'Facebook'], ['phone', 'Gọi điện']].map(([v, l]) => (
          <label key={v} className="hp-chip">
            <input type="radio" name="contactVia" value={v} checked={form.contactVia === v} onChange={set('contactVia')} />
            <span>{l}</span>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Khoá học quan tâm</legend>
        {interests.map((l) => (
          <label key={l} className="hp-chip">
            <input type="radio" name="interest" value={l} checked={form.interest === l} onChange={set('interest')} />
            <span>{l}</span>
          </label>
        ))}
      </fieldset>
      <label className="hp-field">
        <span>Bạn muốn hỏi thêm điều gì?</span>
        <textarea value={form.message} onChange={set('message')} placeholder="Mục tiêu học, thời gian rảnh, trình độ hiện tại…" rows={3} maxLength={1000} />
      </label>
      {state.error && <p className="hp-form-msg error">{state.error}</p>}
      {state.done && <p className="hp-form-msg ok">Đã gửi thành công. Chúng tôi sẽ liên hệ với bạn sớm nhất.</p>}
      <button type="submit" className="hp-form-submit" disabled={state.sending}>
        {state.sending ? 'Đang gửi…' : <>Gửi yêu cầu tư vấn <ArrowRight size={18} /></>}
      </button>
    </form>
  );
}

/** Trang chủ công khai cho khách - học viên đăng nhập sẽ vào thẳng Dashboard thay vì trang này. */
export default function Home() {
  const { content, catalog } = usePublicSite();
  const location = useLocation();
  const [video, setVideo] = useState('');

  const courses = useMemo(() => {
    const list = catalog?.courses || [];
    return [...list.filter((c) => c.forSale), ...list.filter((c) => !c.forSale)];
  }, [catalog]);

  useReveal([content, catalog]);
  useParallax([content, catalog]);

  // Đến từ trang khác bằng link "/#dang-ky"... thì cuộn tới mục sau khi nội dung đã hiện.
  useEffect(() => {
    if (content && location.hash) {
      const t = setTimeout(() => scrollToId(location.hash.slice(1)), 60);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [content, location.hash]);

  if (!content) return <div className="hp-loading"><span /></div>;

  const { hero, activity, quickLinks, why, contact, consult } = content;
  const sc = (t) => softCase(t, [why.brandName]);
  const stats = catalog?.stats || {};
  const heroStats = [
    [stats.courses, 'khoá học'], [stats.lessons, 'bài học'], [stats.words, 'từ vựng có phát âm']
  ].filter(([n]) => n > 0);
  // Các dải nội dung phía sau xen kẽ nền giấy/trắng, tính theo mục thực sự hiển thị.
  const bands = [content.news.length && 'news', content.videos.length && 'videos',
    content.teachers.length && 'teachers', content.testimonials.length && 'testimonials'].filter(Boolean);
  const bandClass = (key) => (bands.indexOf(key) % 2 === 0 ? 'hp-band' : 'hp-band hp-band-paper');
  const heroImg = hero.imageUrl ? assetUrl(hero.imageUrl) : IMG('hero');
  const consultImg = consult.imageUrl ? assetUrl(consult.imageUrl) : IMG('roofs');

  return (
    <div className="hp">
      {/* ---------- Banner ---------- */}
      <section className="hp-hero">
        <span className="hp-hero-bg" data-parallax="-0.18" aria-hidden="true">
          <span style={{ backgroundImage: `url("${heroImg}")` }} />
        </span>
        <span className="hp-hero-shade" aria-hidden="true" />
        <Petals count={18} />
        <span className="hp-hero-lanterns" aria-hidden="true">
          <Lantern hanzi="福" size={78} className="l1" />
          <Lantern hanzi="学" size={58} className="l2" />
          <Lantern hanzi="春" size={46} className="l3" />
        </span>
        <Cloud className="hp-hero-cloud c1" />
        <Cloud className="hp-hero-cloud c2" />

        <div className="site-wrap hp-hero-grid">
          <div className="hp-hero-text">
            {hero.subtitle && <p className="hp-kicker" data-reveal="fade-up"><span className="hp-kicker-dot" />{sc(hero.subtitle)}</p>}
            <h1>
              <span className="hp-rise" data-reveal="rise" style={{ '--d': '120ms' }}><span>{sc(hero.title1)}</span></span>
              {hero.title2 && <span className="hp-rise" data-reveal="rise" style={{ '--d': '300ms' }}><em>{sc(hero.title2)}</em></span>}
            </h1>
            {hero.promo && <p className="hp-hero-lead" data-reveal="fade-up" style={{ '--d': '480ms' }}>{sc(hero.promo)}</p>}
            <div className="hp-hero-actions" data-reveal="fade-up" style={{ '--d': '600ms' }}>
              <SmartLink to="#dang-ky" className="hp-btn hp-btn-gold">Đăng ký tư vấn <ArrowRight size={18} /></SmartLink>
              <SmartLink to="#khoa-hoc" className="hp-btn hp-btn-glass">Xem khoá học</SmartLink>
            </div>
            {heroStats.length > 0 && (
              <dl className="hp-hero-stats" data-reveal="fade-up" style={{ '--d': '720ms' }}>
                {heroStats.map(([n, label]) => (
                  <div key={label}><dt><CountUp value={n} />+</dt><dd>{label}</dd></div>
                ))}
              </dl>
            )}
          </div>
          <div className="hp-hero-visual">
            <MoonGate courses={courses} />
          </div>
        </div>

        <svg className="hp-hero-mountains" viewBox="0 0 1440 140" preserveAspectRatio="none" aria-hidden="true">
          <path className="m1" d="M0 140 V92 L90 60 L170 84 L260 38 L340 76 L430 50 L520 88 L610 44 L700 70 L790 30 L880 72 L960 52 L1050 86 L1140 40 L1230 74 L1320 54 L1440 80 V140Z" />
          <path className="m2" d="M0 140 V112 C120 96 200 120 320 104 S520 84 640 108 S860 126 980 100 S1220 92 1320 110 S1420 116 1440 112 V140Z" />
        </svg>
      </section>

      {/* ---------- Dải câu tiếng Trung chạy ngang ---------- */}
      <div className="hp-marquee" aria-label="Một số câu tiếng Trung thông dụng">
        <div className="hp-marquee-track">
          {[0, 1].map((k) => (
            <span key={k} className="hp-marquee-group" aria-hidden={k === 1}>
              {PHRASES.map(([h, p, v]) => (
                <span key={h} className="hp-marquee-item">
                  <b>{h}</b><i>{p}</i><span>{v}</span><span className="hp-marquee-sep">✿</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ---------- Hoạt động + lối tắt ---------- */}
      <section className="site-wrap hp-intro">
        <SmartLink to="#khoa-hoc" className="hp-activity" data-reveal="wipe">
          <img src={activity.imageUrl ? assetUrl(activity.imageUrl) : IMG('study')} alt="" loading="lazy" />
          <span className="hp-activity-cap">
            <span className="hp-activity-hanzi" aria-hidden="true">学而时习之</span>
            {sc(activity.caption)}
          </span>
          <span className="hp-corner tl" aria-hidden="true" /><span className="hp-corner br" aria-hidden="true" />
        </SmartLink>
        <nav className="hp-tiles" aria-label="Lối tắt">
          {quickLinks.map((l, i) => (
            <SmartLink key={i} to={l.url} className="hp-tile" data-reveal="fade-left" style={{ '--d': `${i * 120}ms` }}>
              <span className="hp-tile-hanzi" aria-hidden="true">{TILE_HANZI[i % TILE_HANZI.length]}</span>
              <span className="hp-tile-num">{CN_NUM[i]}</span>
              <span className="hp-tile-label">{sc(l.label)}</span>
              <ArrowUpRight size={22} strokeWidth={1.6} className="hp-tile-arrow" />
            </SmartLink>
          ))}
        </nav>
      </section>

      {/* ---------- Vì sao chọn ---------- */}
      <section className="hp-why-band" id="gioi-thieu">
        <Cloud className="hp-why-cloud" />
        <div className="site-wrap hp-why">
          <div className="hp-why-left">
            <Eyebrow hanzi="为什么">Giới thiệu</Eyebrow>
            <h2 className="hp-why-title" data-reveal="fade-up">{sc(why.title)}</h2>
            <ol className="hp-why-list">
              {why.items.map((t, i) => (
                <li key={i} data-reveal="fade-up" style={{ '--d': `${i * 90}ms` }}>
                  <span className="hp-why-num">{CN_NUM[i] || i + 1}</span>
                  <p>{t}</p>
                </li>
              ))}
            </ol>
          </div>
          <aside className="hp-why-media">
            <span className="hp-why-photo p1" data-reveal="wipe" data-parallax="0.06"><img src={IMG('palace')} alt="Tử Cấm Thành, Bắc Kinh" loading="lazy" /></span>
            <span className="hp-why-photo p2" data-reveal="wipe" style={{ '--d': '200ms' }} data-parallax="-0.08"><img src={IMG('calligraphy')} alt="Thư pháp Trung Hoa" loading="lazy" /></span>
            <div className="hp-why-card" data-reveal="zoom-in" style={{ '--d': '350ms' }}>
              <span className="hp-why-seal"><img src="/logo.png" alt={why.brandName} /></span>
              <div>
                <h3>{why.brandName}</h3>
                <p>{why.brandTagline}</p>
                {why.buttonLabel && <SmartLink to={why.buttonUrl || '/courses'} className="hp-link-btn">{why.buttonLabel} <ArrowRight size={16} /></SmartLink>}
              </div>
            </div>
          </aside>
        </div>
      </section>

      {/* ---------- Khoá học ---------- */}
      <section className="hp-courses-band" id="khoa-hoc">
        <span className="cn-fret" aria-hidden="true" />
        <span className="hp-courses-hanzi" aria-hidden="true" data-parallax="0.12">课程</span>
        <Lantern hanzi="课" size={54} className="hp-courses-lantern" />
        <div className="site-wrap">
          <div className="hp-head">
            <Eyebrow hanzi="课程" light>Khoá học</Eyebrow>
            <h2 className="hp-title" data-reveal="fade-up">{sc(content.courses.title)}</h2>
            {content.courses.desc && <p className="hp-head-desc" data-reveal="fade-up" style={{ '--d': '120ms' }}>{content.courses.desc}</p>}
          </div>
          <div className="hp-course-grid">
            {courses.slice(0, 8).map((c, i) => <CourseTile key={c.id} course={c} index={i} />)}
          </div>
          {catalog && courses.length === 0 && <p className="empty-state">Chưa có khoá học nào.</p>}
          <div className="hp-center" data-reveal="fade-up">
            <SmartLink to="#dang-ky" className="hp-btn hp-btn-gold">Nhận tư vấn lộ trình miễn phí <ArrowRight size={18} /></SmartLink>
          </div>
        </div>
        <span className="cn-fret cn-fret-bottom" aria-hidden="true" />
      </section>

      {/* ---------- Văn hoá ---------- */}
      <section className="hp-culture" id="van-hoa">
        <div className="site-wrap">
          <div className="hp-head">
            <Eyebrow hanzi="文化">Văn hoá Trung Hoa</Eyebrow>
            <h2 className="hp-title" data-reveal="fade-up">Học ngôn ngữ, <em>chạm vào văn hoá</em></h2>
            <p className="hp-head-desc" data-reveal="fade-up" style={{ '--d': '120ms' }}>
              Mỗi chữ Hán là một câu chuyện. Hiểu văn hoá giúp bạn nhớ từ lâu hơn và nói tự nhiên hơn.
            </p>
          </div>
          <div className="hp-culture-grid">
            {CULTURE.map((c, i) => (
              <figure key={c.img} className={`hp-culture-item ${c.cls || ''}`} data-reveal="zoom-in" style={{ '--d': `${(i % 3) * 110}ms` }}>
                <img src={IMG(c.img)} alt={c.name} loading="lazy" />
                <figcaption>
                  <b>{c.hanzi}</b>
                  <span><i>{c.pinyin}</i>{c.name}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Tin tức ---------- */}
      {content.news.length > 0 && (
        <section className={bandClass('news')} id="tin-tuc">
          <div className="site-wrap">
            <div className="hp-head">
              <Eyebrow hanzi="新闻">Thông tin hữu ích</Eyebrow>
              <h2 className="hp-title" data-reveal="fade-up">Tin tức &amp; bài viết</h2>
            </div>
            <div className="hp-grid-3">
              {content.news.map((n, i) => (
                <article key={i} className="hp-card hp-news" data-reveal="fade-up" style={{ '--d': `${(i % 3) * 110}ms` }}>
                  <SmartLink to={n.link} className="hp-news-img">
                    {n.imageUrl ? <img src={assetUrl(n.imageUrl)} alt="" loading="lazy" /> : <span className="hp-img-empty">文</span>}
                  </SmartLink>
                  <div className="hp-news-body">
                    {n.date && <span className="hp-news-date">{n.date}</span>}
                    <h3><SmartLink to={n.link}>{n.title}</SmartLink></h3>
                    {n.excerpt && <p>{n.excerpt}</p>}
                    {n.link && <SmartLink to={n.link} className="hp-link-btn">Đọc tiếp <ArrowRight size={15} /></SmartLink>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Video ---------- */}
      {content.videos.length > 0 && (
        <section className={bandClass('videos')} id="video">
          <div className="site-wrap">
            <div className="hp-head">
              <Eyebrow hanzi="视频">Bài giảng miễn phí</Eyebrow>
              <h2 className="hp-title" data-reveal="fade-up">Video học tiếng Trung</h2>
            </div>
            <div className="hp-grid-3">
              {content.videos.map((v, i) => {
                const id = youtubeId(v.youtubeUrl);
                if (!id) return null;
                return (
                  <button key={i} type="button" className="hp-card hp-video" onClick={() => setVideo(id)} data-reveal="fade-up" style={{ '--d': `${(i % 3) * 110}ms` }}>
                    <span className="hp-video-thumb">
                      <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
                      <span className="hp-play"><Play size={20} fill="currentColor" /></span>
                    </span>
                    <span className="hp-video-body">
                      <span className="hp-video-title">{v.title}</span>
                      {v.desc && <span className="hp-video-desc">{v.desc}</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Giảng viên ---------- */}
      {content.teachers.length > 0 && (
        <section className={bandClass('teachers')} id="giang-vien">
          <div className="site-wrap">
            <div className="hp-head">
              <Eyebrow hanzi="老师">Đội ngũ</Eyebrow>
              <h2 className="hp-title" data-reveal="fade-up">Giảng viên tại {why.brandName}</h2>
            </div>
            <div className="hp-grid-3 hp-teachers">
              {content.teachers.map((t, i) => {
                const rows = [['Đơn vị công tác', t.workplace], ['Học vị', t.degree], ['Chuyên ngành', t.major], ['Đơn vị đào tạo', t.school]]
                  .filter(([, v]) => v);
                return (
                  <article key={i} className="hp-card hp-teacher" data-reveal="fade-up" style={{ '--d': `${(i % 3) * 110}ms` }}>
                    <div className="hp-teacher-img">
                      {t.imageUrl ? <img src={assetUrl(t.imageUrl)} alt={t.name} loading="lazy" /> : <span className="hp-img-empty">{t.name?.[0] || '师'}</span>}
                    </div>
                    <div className="hp-teacher-body">
                      <h3>{t.name}</h3>
                      {t.title && <p className="hp-teacher-role">{t.title}</p>}
                      {rows.length > 0 && (
                        <dl>{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
                      )}
                      {t.experience && <span className="hp-teacher-exp"><Clock size={14} /> {t.experience}</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Cảm nhận học viên ---------- */}
      {content.testimonials.length > 0 && (
        <section className={bandClass('testimonials')} id="cam-nhan">
          <div className="site-wrap">
            <div className="hp-head">
              <Eyebrow hanzi="评价">Cảm nhận của học viên</Eyebrow>
              <h2 className="hp-title" data-reveal="fade-up">Học viên nói gì về chúng tôi</h2>
            </div>
            <div className="hp-grid-3">
              {content.testimonials.map((t, i) => (
                <figure key={i} className="hp-card hp-review" data-reveal="fade-up" style={{ '--d': `${(i % 3) * 110}ms` }}>
                  <blockquote className="hp-review-quote">{t.content}</blockquote>
                  {t.achievement && <p className="hp-review-award"><Trophy size={15} /> <span>{t.achievement}</span></p>}
                  <figcaption className="hp-review-head">
                    {t.avatarUrl
                      ? <img src={assetUrl(t.avatarUrl)} alt="" className="hp-review-avatar" loading="lazy" />
                      : <span className="hp-review-avatar hp-review-avatar-empty">{t.name?.[0] || '?'}</span>}
                    <span className="hp-review-who">
                      <b>{t.name}</b>
                      {t.course && <span>{t.course}</span>}
                    </span>
                    {t.link && (
                      <a href={t.link} target="_blank" rel="noopener noreferrer" className="hp-review-fb" aria-label="Xem đánh giá gốc">
                        <SocialIcon name="facebook" size={18} />
                      </a>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Đăng ký tư vấn ---------- */}
      <section className="hp-consult" id="dang-ky">
        <div className="site-wrap hp-consult-grid">
          <div className="hp-consult-panel" data-reveal="fade-right" style={{ '--hp-photo': `url("${consultImg}")` }}>
            <Petals count={10} />
            <Lantern hanzi="福" size={60} className="hp-consult-lantern" />
            <p className="hp-kicker hp-kicker-light"><span className="hp-kicker-dot" />{sc(consult.eyebrow)}</p>
            <h2>
              {consult.title}
              {consult.highlight && <em>{consult.highlight}</em>}
            </h2>
            {consult.desc && <p className="hp-consult-desc">{consult.desc}</p>}
            {(contact.hotline || contact.address) && (
              <div className="hp-consult-contact">
                {contact.hotline && <a href={telHref(contact.hotline)} className="hp-consult-line hp-consult-phone"><Phone size={17} /> {contact.hotline}</a>}
                {contact.address && <span className="hp-consult-line"><MapPin size={17} /> {contact.address}</span>}
              </div>
            )}
          </div>
          <ConsultForm />
        </div>
      </section>

      {video && <VideoModal id={video} onClose={() => setVideo('')} />}
    </div>
  );
}
