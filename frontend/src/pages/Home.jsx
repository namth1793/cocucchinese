import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  CalendarDays, Check, ChevronRight, Clock, GraduationCap, Heart, Lightbulb, MapPin, Phone, Play, Star,
  Tag, Trophy, X
} from 'lucide-react';
import api from '../api/client';
import { assetUrl } from '../utils/assetUrl';
import { COURSE_CATEGORIES } from '../constants/courseCategories';
import CourseCover from '../components/CourseCover';
import SocialIcon from '../components/SocialIcon';
import { SmartLink, scrollToId, telHref, usePublicSite, useReveal, youtubeId } from '../utils/publicSite';

const TILE_ICONS = [CalendarDays, GraduationCap, Tag];
const CATEGORY_LABEL = Object.fromEntries(COURSE_CATEGORIES.map((c) => [c.key, c.label]));

function Eyebrow({ children, heart = false, muted = false }) {
  return (
    <div className={`hp-eyebrow ${muted ? 'muted' : ''}`} data-reveal="fade-up">
      <span className="hp-eyebrow-line" />
      {heart && <Heart size={14} fill="currentColor" />}
      <span>{children}</span>
      <span className="hp-eyebrow-line" />
    </div>
  );
}

function Stars() {
  return <span className="hp-stars">{[0, 1, 2, 3, 4].map((i) => <Star key={i} size={14} fill="currentColor" />)}</span>;
}

function HeroVisual({ hero, courses }) {
  if (hero.imageUrl) {
    return <div className="hp-hero-img"><img src={assetUrl(hero.imageUrl)} alt="" /></div>;
  }
  // Chưa có ảnh: ghép bìa các khoá học thật thay cho ảnh minh hoạ.
  const covers = courses.filter((c) => c.coverUrl).slice(0, 3);
  return (
    <div className="hp-hero-img hp-hero-collage">
      <span className="hp-hero-collage-hanzi" aria-hidden="true">汉语</span>
      <div className="hp-hero-books">
        {covers.map((c, i) => (
          <span key={c.id} className={`hp-hero-book hp-hero-book-${i}`}><CourseCover course={c} colorIndex={i} /></span>
        ))}
      </div>
    </div>
  );
}

function CourseTile({ course, index }) {
  const subtitle = [course.group || CATEGORY_LABEL[course.category], `${course.lessonCount} bài học`].filter(Boolean).join(' · ');
  const inner = (
    <>
      {course.coverUrl
        ? <img src={assetUrl(course.coverUrl)} alt="" loading="lazy" className="hp-course-bg" />
        : <span className="hp-course-bg hp-course-bg-empty" aria-hidden="true">{course.code}</span>}
      <span className="hp-course-shade" />
      <span className={`hp-course-badge ${course.forSale ? '' : 'soon'}`}>{course.forSale ? 'ĐANG MỞ ĐĂNG KÝ' : 'SẮP MỞ'}</span>
      <span className="hp-course-text">
        <span className="hp-course-name">{course.name}</span>
        <span className="hp-course-sub">{subtitle}</span>
      </span>
    </>
  );
  const props = { className: 'hp-course', 'data-reveal': 'zoom-in', style: { '--d': `${(index % 4) * 80}ms` } };
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
      <input required value={form.name} onChange={set('name')} placeholder="Tên bạn" maxLength={100} />
      <input type="email" value={form.email} onChange={set('email')} placeholder="Email" maxLength={120} />
      <input required type="tel" value={form.phone} onChange={set('phone')} placeholder="Số điện thoại" maxLength={20} />
      <fieldset>
        <legend>Phương thức liên lạc qua (Zalo, Facebook)</legend>
        {[['zalo', 'Zalo'], ['facebook', 'Facebook'], ['phone', 'Gọi điện']].map(([v, l]) => (
          <label key={v} className="hp-radio">
            <input type="radio" name="contactVia" value={v} checked={form.contactVia === v} onChange={set('contactVia')} />
            <span>{l}</span>
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Khoá học quan tâm</legend>
        {interests.map((l) => (
          <label key={l} className="hp-radio">
            <input type="radio" name="interest" value={l} checked={form.interest === l} onChange={set('interest')} />
            <span>{l}</span>
          </label>
        ))}
      </fieldset>
      <textarea value={form.message} onChange={set('message')} placeholder="Nội dung yêu cầu" rows={4} maxLength={1000} />
      {state.error && <p className="hp-form-msg error">{state.error}</p>}
      {state.done && <p className="hp-form-msg ok">Đã gửi thành công! Chúng tôi sẽ liên hệ với bạn sớm nhất.</p>}
      <button type="submit" className="hp-form-submit" disabled={state.sending}>
        {state.sending ? 'ĐANG GỬI...' : 'GỬI YÊU CẦU TƯ VẤN'}
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
  // Các dải nội dung sau phần giới thiệu xen kẽ nền xám/trắng, tính theo mục thực sự hiển thị.
  const bands = ['courses', content.news.length && 'news', content.videos.length && 'videos',
    content.teachers.length && 'teachers', content.testimonials.length && 'testimonials'].filter(Boolean);
  const bandClass = (key) => (bands.indexOf(key) % 2 === 0 ? 'hp-band hp-band-gray' : 'hp-band');

  return (
    <div className="hp">
      {/* ---------- Hero ---------- */}
      <section className="hp-hero">
        <span className="hp-deco hp-deco-ring" aria-hidden="true" />
        <span className="hp-deco hp-deco-pct hp-deco-pct-a" aria-hidden="true">%</span>
        <span className="hp-deco hp-deco-pct hp-deco-pct-b" aria-hidden="true">%</span>
        <span className="hp-deco hp-deco-ring-sm" aria-hidden="true" />
        <div className="site-wrap hp-hero-grid">
          <div className="hp-hero-text">
            <h1 data-reveal="fade-right">
              <span className="hp-hero-dot" aria-hidden="true" />
              <span>{hero.title1}</span>
              <span>{hero.title2}</span>
            </h1>
            {hero.subtitle && <p className="hp-hero-sub" data-reveal="fade-right" style={{ '--d': '120ms' }}>{hero.subtitle}</p>}
            {hero.promo && <div className="hp-hero-promo" data-reveal="fade-right" style={{ '--d': '200ms' }}><span>{hero.promo}</span></div>}
            <div className="hp-hero-dots" aria-hidden="true"><i /><i /><i /></div>
            {hero.tagline && <p className="hp-hero-tag" data-reveal="fade-right" style={{ '--d': '280ms' }}>{hero.tagline}</p>}
            <div className="hp-hero-actions" data-reveal="fade-up" style={{ '--d': '340ms' }}>
              <SmartLink to="#dang-ky" className="hp-btn hp-btn-solid">ĐĂNG KÝ TƯ VẤN</SmartLink>
              <SmartLink to="#khoa-hoc" className="hp-btn hp-btn-outline">XEM KHÓA HỌC</SmartLink>
            </div>
          </div>
          <div className="hp-hero-visual" data-reveal="fade-left">
            <HeroVisual hero={hero} courses={courses} />
          </div>
        </div>
      </section>

      {/* ---------- Hoạt động + lối tắt ---------- */}
      <section className="site-wrap hp-intro">
        <SmartLink to="#khoa-hoc" className="hp-activity" data-reveal="fade-up">
          {activity.imageUrl
            ? <img src={assetUrl(activity.imageUrl)} alt="" loading="lazy" />
            : <span className="hp-activity-empty" aria-hidden="true">学而时习之</span>}
          <span className="hp-activity-cap">{activity.caption}</span>
        </SmartLink>
        <div className="hp-tiles">
          {quickLinks.map((l, i) => {
            const Icon = TILE_ICONS[i] || Tag;
            return (
              <SmartLink key={i} to={l.url} className={`hp-tile hp-tile-${i}`} data-reveal="zoom-in" style={{ '--d': `${i * 120}ms` }}>
                <Icon size={30} strokeWidth={1.6} />
                <span>{l.label}</span>
              </SmartLink>
            );
          })}
        </div>
      </section>

      {/* ---------- Vì sao chọn ---------- */}
      <section className="site-wrap hp-why" id="gioi-thieu">
        <div className="hp-why-left">
          <h2 className="hp-why-title" data-reveal="fade-right"><span className="hp-why-check"><Check size={14} strokeWidth={3} /></span>{why.title}</h2>
          <ol className="hp-why-list">
            {why.items.map((t, i) => (
              <li key={i} data-reveal="fade-right" style={{ '--d': `${i * 90}ms` }}><span>{i + 1}</span>{t}</li>
            ))}
          </ol>
        </div>
        <div className="hp-why-card" data-reveal="fade-up">
          <div className="hp-seal">
            <span className="hp-seal-tab" />
            <span className="hp-seal-box"><img src="/logo.png" alt={why.brandName} /></span>
          </div>
          <h3>{why.brandName}</h3>
          <p>{why.brandTagline}</p>
          {why.buttonLabel && <SmartLink to={why.buttonUrl || '/courses'} className="hp-why-btn">{why.buttonLabel} <ChevronRight size={16} /></SmartLink>}
        </div>
      </section>

      {/* ---------- Khoá học ---------- */}
      <section className={bandClass('courses')} id="khoa-hoc">
        <div className="site-wrap">
          <div className="hp-pill-head" data-reveal="fade-up"><Lightbulb size={16} fill="currentColor" /> {content.courses.title}</div>
          {content.courses.desc && <p className="hp-courses-desc" data-reveal="fade-up">{content.courses.desc}</p>}
          <div className="hp-course-grid">
            {courses.slice(0, 8).map((c, i) => <CourseTile key={c.id} course={c} index={i} />)}
          </div>
          {catalog && courses.length === 0 && <p className="empty-state">Chưa có khoá học nào.</p>}
          <div className="hp-center" data-reveal="fade-up">
            <SmartLink to="#dang-ky" className="hp-btn hp-btn-solid hp-btn-wide">ĐĂNG KÝ TƯ VẤN MIỄN PHÍ →</SmartLink>
          </div>
        </div>
      </section>

      {/* ---------- Tin tức ---------- */}
      {content.news.length > 0 && (
        <section className={bandClass('news')} id="tin-tuc">
          <div className="site-wrap">
            <Eyebrow heart>THÔNG TIN HỮU ÍCH</Eyebrow>
            <h2 className="hp-title" data-reveal="fade-up">TIN TỨC &amp; BÀI VIẾT</h2>
            <div className="hp-grid-3">
              {content.news.map((n, i) => (
                <article key={i} className="hp-card hp-news" data-reveal="fade-up" style={{ '--d': `${(i % 3) * 100}ms` }}>
                  <SmartLink to={n.link} className="hp-news-img">
                    {n.imageUrl ? <img src={assetUrl(n.imageUrl)} alt="" loading="lazy" /> : <span className="hp-img-empty">文</span>}
                  </SmartLink>
                  <div className="hp-news-body">
                    {n.date && <span className="hp-news-date">{n.date}</span>}
                    <h3><SmartLink to={n.link}>{n.title}</SmartLink></h3>
                    {n.excerpt && <p>{n.excerpt}</p>}
                    {n.link && <SmartLink to={n.link} className="hp-more">XEM THÊM <ChevronRight size={15} /></SmartLink>}
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
            <Eyebrow muted>BÀI GIẢNG THỰC TUYẾN</Eyebrow>
            <h2 className="hp-title hp-title-soft" data-reveal="fade-up">VIDEO HỌC TIẾNG TRUNG MIỄN PHÍ</h2>
            <div className="hp-grid-3">
              {content.videos.map((v, i) => {
                const id = youtubeId(v.youtubeUrl);
                if (!id) return null;
                return (
                  <button key={i} type="button" className="hp-card hp-video" onClick={() => setVideo(id)} data-reveal="fade-up" style={{ '--d': `${(i % 3) * 100}ms` }}>
                    <span className="hp-video-thumb">
                      <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
                      <span className="hp-play"><Play size={26} fill="currentColor" /></span>
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
            <Eyebrow>ĐỘI NGŨ GIẢNG VIÊN TẠI {why.brandName.toUpperCase()}</Eyebrow>
            <div className="hp-grid-3 hp-teachers">
              {content.teachers.map((t, i) => {
                const rows = [['Đơn vị công tác', t.workplace], ['Học vị', t.degree], ['Chuyên ngành', t.major], ['Đơn vị đào tạo', t.school]]
                  .filter(([, v]) => v);
                return (
                  <article key={i} className="hp-card hp-teacher" data-reveal="fade-up" style={{ '--d': `${(i % 3) * 100}ms` }}>
                    <div className="hp-teacher-img">
                      {t.imageUrl ? <img src={assetUrl(t.imageUrl)} alt={t.name} loading="lazy" /> : <span className="hp-img-empty">{t.name?.[0] || '师'}</span>}
                      <Stars />
                    </div>
                    <div className="hp-teacher-body">
                      <h3>{t.name}</h3>
                      {t.title && <p className="hp-teacher-role">{t.title}</p>}
                      {rows.length > 0 && (
                        <ul>{rows.map(([k, v]) => <li key={k}><b>{k}:</b> {v}</li>)}</ul>
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
            <Eyebrow heart>CẢM NHẬN CỦA HỌC VIÊN</Eyebrow>
            <h2 className="hp-title" data-reveal="fade-up">HỌC VIÊN NÓI GÌ VỀ CHÚNG TÔI?</h2>
            <div className="hp-grid-3">
              {content.testimonials.map((t, i) => (
                <article key={i} className="hp-card hp-review" data-reveal="fade-up" style={{ '--d': `${(i % 3) * 100}ms` }}>
                  <div className="hp-review-main">
                    <div className="hp-review-head">
                      {t.avatarUrl
                        ? <img src={assetUrl(t.avatarUrl)} alt="" className="hp-review-avatar" loading="lazy" />
                        : <span className="hp-review-avatar hp-review-avatar-empty">{t.name?.[0] || '?'}</span>}
                      <span className="hp-review-who">
                        <b>{t.name}</b>
                        <span><Stars /> đã đánh giá</span>
                      </span>
                      {t.link && (
                        <a href={t.link} target="_blank" rel="noopener noreferrer" className="hp-review-fb" aria-label="Xem đánh giá gốc">
                          <SocialIcon name="facebook" size={20} />
                        </a>
                      )}
                    </div>
                    <p className="hp-review-quote">"{t.content}"</p>
                    {t.achievement && <p className="hp-review-award"><Trophy size={15} /> <span>{t.achievement}</span></p>}
                  </div>
                  {t.course && <div className="hp-review-course">Khóa học: <b>{t.course}</b></div>}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Đăng ký tư vấn ---------- */}
      <section className="hp-consult" id="dang-ky">
        <Eyebrow muted>{consult.eyebrow}</Eyebrow>
        <div className="hp-consult-grid">
          <div className="hp-consult-visual" data-reveal="fade-right">
            <span className="hp-consult-back" />
            <div className="hp-consult-panel" style={consult.imageUrl ? { '--hp-photo': `url("${assetUrl(consult.imageUrl)}")` } : undefined}>
              <h2>{consult.title}</h2>
              {consult.highlight && <p className="hp-consult-hl">{consult.highlight}</p>}
              {consult.desc && <p className="hp-consult-desc">{consult.desc}</p>}
              {contact.hotline && <a href={telHref(contact.hotline)} className="hp-consult-line hp-consult-phone"><Phone size={18} /> {contact.hotline}</a>}
              {contact.address && <span className="hp-consult-line"><MapPin size={18} /> {contact.address}</span>}
            </div>
          </div>
          <ConsultForm />
        </div>
      </section>

      {video && <VideoModal id={video} onClose={() => setVideo('')} />}
    </div>
  );
}
