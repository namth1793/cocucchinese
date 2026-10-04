import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowUp, ChevronDown, ChevronRight, Clock, Mail, MapPin, Menu, Phone, Search, SquarePen, CalendarCheck, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SmartLink, softCase, telHref, usePublicSite } from '../utils/publicSite';
import SocialIcon, { SOCIAL_KEYS } from './SocialIcon';

function Socials({ contact, className }) {
  const items = SOCIAL_KEYS.filter((s) => contact?.[s.key]);
  if (!items.length) return null;
  return (
    <span className={className}>
      {items.map((s) => (
        <a key={s.key} href={contact[s.key]} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}>
          <SocialIcon name={s.key} />
        </a>
      ))}
    </span>
  );
}

/** Danh sách mục menu - mục nào trang chủ chưa có nội dung (giảng viên, video...) thì ẩn luôn. */
function buildNav(content, courses) {
  const forSale = (courses || []).filter((c) => c.forSale);
  return [
    { label: 'Trang chủ', to: '/' },
    { label: 'Giới thiệu', to: '#gioi-thieu' },
    {
      label: 'Khoá học', to: '/courses',
      children: [
        ...forSale.map((c) => ({ label: c.name, to: `/courses/${c.id}` })),
        { label: 'Tất cả khoá học', to: '/courses' }
      ]
    },
    content?.teachers?.length ? { label: 'Giảng viên', to: '#giang-vien' } : null,
    content?.testimonials?.length ? { label: 'Cảm nhận học viên', to: '#cam-nhan' } : null,
    content?.videos?.length ? { label: 'Video', to: '#video' } : null,
    content?.news?.length ? { label: 'Tin tức', to: '#tin-tuc' } : null,
    { label: 'Văn hoá', to: '#van-hoa' },
    { label: 'Liên hệ', to: '#dang-ky' }
  ].filter(Boolean);
}

/** Link Zalo: ưu tiên link admin nhập, không có thì dựng từ hotline (zalo.me/09xx...). */
function zaloLink(contact) {
  if (contact.zalo) return contact.zalo;
  const digits = String(contact.hotline || '').replace(/\D/g, '').replace(/^84(?=\d{9}$)/, '0');
  return digits.length >= 9 ? `https://zalo.me/${digits}` : '';
}

/** Thanh tiến độ cuộn mảnh màu vàng + nút lên đầu trang. */
function useScrollState() {
  const [state, setState] = useState({ progress: 0, scrolled: false });
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setState({ progress: max > 0 ? Math.min(1, window.scrollY / max) : 0, scrolled: window.scrollY > 600 });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, []);
  return state;
}

/**
 * Nút Zalo + gọi điện nổi góc dưới bên trái, rung lắc theo nhịp kèm vòng sóng lan toả.
 * Chưa nhập hotline/Zalo thì cả hai nút dẫn tới form đăng ký tư vấn.
 */
function FloatingContact({ contact }) {
  const zalo = zaloLink(contact);
  const phone = contact.hotline ? telHref(contact.hotline) : '';
  return (
    <div className="fc" role="complementary" aria-label="Liên hệ nhanh">
      <SmartLink to={zalo || '#dang-ky'} className="fc-btn fc-zalo" aria-label="Chat Zalo">
        <span className="fc-circle">
          <span className="fc-wave" /><span className="fc-wave w2" />
          <span className="fc-icon fc-zalo-text">Zalo</span>
        </span>
        <span className="fc-label">Chat Zalo</span>
      </SmartLink>
      {phone ? (
        <a href={phone} className="fc-btn fc-phone" aria-label={`Gọi ${contact.hotline}`}>
          <span className="fc-circle">
            <span className="fc-wave" /><span className="fc-wave w2" />
            <span className="fc-icon"><Phone size={22} fill="currentColor" strokeWidth={0} /></span>
          </span>
          <span className="fc-label fc-label-always">{contact.hotline}</span>
        </a>
      ) : (
        <SmartLink to="#dang-ky" className="fc-btn fc-phone" aria-label="Đăng ký gọi lại">
          <span className="fc-circle">
            <span className="fc-wave" /><span className="fc-wave w2" />
            <span className="fc-icon"><Phone size={22} fill="currentColor" strokeWidth={0} /></span>
          </span>
          <span className="fc-label">Yêu cầu gọi lại</span>
        </SmartLink>
      )}
    </div>
  );
}

/** Khung cho các trang công khai (trang chủ, danh sách khoá học, chi tiết, đơn đăng ký) - không cần đăng nhập. */
export default function PublicLayout() {
  const { user } = useAuth();
  const { content, catalog } = usePublicSite();
  const location = useLocation();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [drawer, setDrawer] = useState(false);
  const isHome = location.pathname === '/';
  const isStaff = user && (user.role === 'admin' || user.role === 'teacher');
  const contact = content?.contact || {};
  const brand = content?.why?.brandName || 'HSK 360';
  const nav = buildNav(content, catalog?.courses);
  const allCourses = catalog?.courses || [];
  const footerCourses = [...allCourses.filter((c) => c.forSale), ...allCourses.filter((c) => !c.forSale)].slice(0, 6);

  useEffect(() => { setDrawer(false); }, [location.pathname, location.hash]);

  const onSearch = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/courses?q=${encodeURIComponent(term)}` : '/courses');
  };

  const isActive = (item) => (item.to === '/' ? isHome && !location.hash : location.pathname.startsWith(item.to) && item.to !== '/');
  const { progress, scrolled } = useScrollState();

  return (
    <div className="pub-shell site">
      <span className="site-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <div className="site-topbar">
        <div className="site-wrap site-topbar-inner">
          <span className="site-topbar-slogan">{softCase(content?.topbar?.slogan, [brand])}</span>
          <span className="site-topbar-right">
            <Link to="/">Trang chủ</Link>
            <Link to="/courses">Khoá học</Link>
            {user
              ? <Link to={isStaff ? '/admin' : '/'}>{isStaff ? 'Quản trị' : 'Vào học'}</Link>
              : <Link to="/login">Đăng nhập</Link>}
            <Socials contact={contact} className="site-topbar-social" />
          </span>
        </div>
      </div>

      <header className="site-header">
        <div className="site-wrap site-header-inner">
          <Link to="/" className="site-logo" aria-label={brand}><img src="/logo.png" alt={brand} /></Link>
          <form className="site-search" onSubmit={onSearch} role="search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm khoá học..." aria-label="Tìm khoá học" />
            <button type="submit" aria-label="Tìm kiếm"><Search size={16} /></button>
          </form>
          <div className="site-header-cta">
            <SmartLink to="#dang-ky" className="site-pill-btn"><CalendarCheck size={16} /> Đăng ký tư vấn</SmartLink>
            {contact.hotline && (
              <a href={telHref(contact.hotline)} className="site-pill-btn site-pill-ghost"><Phone size={15} /> {contact.hotline}</a>
            )}
          </div>
          <button type="button" className="site-burger" aria-label="Mở menu" onClick={() => setDrawer(true)}><Menu size={24} /></button>
        </div>
      </header>

      <nav className="site-nav">
        <div className="site-wrap">
          <ul className="site-menu">
            {nav.map((item) => (
              <li key={item.label} className={item.children ? 'has-sub' : ''}>
                <SmartLink to={item.to} className={isActive(item) ? 'active' : ''}>
                  {item.label}{item.children && <ChevronDown size={14} />}
                </SmartLink>
                {item.children && (
                  <ul className="site-submenu">
                    {item.children.map((c) => <li key={c.to + c.label}><SmartLink to={c.to}>{c.label}</SmartLink></li>)}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className={`site-drawer ${drawer ? 'open' : ''}`} aria-hidden={!drawer}>
        <button type="button" className="site-drawer-backdrop" aria-label="Đóng menu" onClick={() => setDrawer(false)} tabIndex={-1} />
        <div className="site-drawer-panel">
          <div className="site-drawer-head">
            <img src="/logo.png" alt={brand} />
            <button type="button" aria-label="Đóng menu" onClick={() => setDrawer(false)}><X size={22} /></button>
          </div>
          <form className="site-search" onSubmit={onSearch} role="search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm khoá học..." aria-label="Tìm khoá học" />
            <button type="submit" aria-label="Tìm kiếm"><Search size={16} /></button>
          </form>
          <ul>
            {nav.map((item) => (
              <li key={item.label}>
                <SmartLink to={item.to} onClick={() => setDrawer(false)}>{item.label}</SmartLink>
                {item.children && (
                  <ul>
                    {item.children.map((c) => (
                      <li key={c.to + c.label}><SmartLink to={c.to} onClick={() => setDrawer(false)}>{c.label}</SmartLink></li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            <li>
              {user
                ? <Link to={isStaff ? '/admin' : '/'}>{isStaff ? 'Quản trị' : 'Vào học'}</Link>
                : <Link to="/login">Đăng nhập</Link>}
            </li>
          </ul>
        </div>
      </div>

      <main className={isHome ? 'pub-main-home' : 'pub-main'}>
        <Outlet />
      </main>

      <footer className="site-footer">
        <span className="cn-fret" aria-hidden="true" />
        <span className="site-footer-hanzi" aria-hidden="true">学无止境</span>
        <div className="site-wrap site-footer-grid">
          <div className="site-footer-brand">
            <img src="/logo.png" alt={brand} className="site-footer-logo" />
            {content?.footer?.about && <p>{content.footer.about}</p>}
            <Socials contact={contact} className="site-footer-social" />
          </div>
          <div>
            <h4>Khóa học</h4>
            <ul className="site-footer-links">
              {footerCourses.map((c) => (
                <li key={c.id}><Link to={c.forSale ? `/courses/${c.id}` : '/courses'}><ChevronRight size={13} />{c.name}</Link></li>
              ))}
              {footerCourses.length === 0 && <li><Link to="/courses"><ChevronRight size={13} />Tất cả khoá học</Link></li>}
            </ul>
          </div>
          <div>
            <h4>Liên kết nhanh</h4>
            <ul className="site-footer-links">
              <li><Link to="/"><ChevronRight size={13} />Trang chủ</Link></li>
              <li><SmartLink to="#gioi-thieu"><ChevronRight size={13} />Giới thiệu</SmartLink></li>
              <li><Link to="/courses"><ChevronRight size={13} />Khoá học</Link></li>
              {content?.teachers?.length > 0 && <li><SmartLink to="#giang-vien"><ChevronRight size={13} />Đội ngũ giảng viên</SmartLink></li>}
              {content?.news?.length > 0 && <li><SmartLink to="#tin-tuc"><ChevronRight size={13} />Tin tức</SmartLink></li>}
              <li><SmartLink to="#dang-ky"><ChevronRight size={13} />Đăng ký tư vấn</SmartLink></li>
            </ul>
          </div>
          <div>
            <h4>Liên hệ</h4>
            <ul className="site-footer-contact">
              {contact.address && <li><MapPin size={17} /><span>{contact.address}</span></li>}
              {contact.hotline && <li><Phone size={17} /><a href={telHref(contact.hotline)}>{contact.hotline}</a></li>}
              {contact.email && <li><Mail size={17} /><a href={`mailto:${contact.email}`}>{contact.email}</a></li>}
              {contact.hours && <li><Clock size={17} /><span>{contact.hours}</span></li>}
              {!contact.address && !contact.hotline && !contact.email && (
                <li><SquarePen size={17} /><SmartLink to="#dang-ky">Để lại thông tin để được tư vấn</SmartLink></li>
              )}
            </ul>
          </div>
        </div>
        <div className="site-wrap site-footer-bottom">
          <span>© {new Date().getFullYear()} {brand}. All rights reserved.</span>
          <span className="site-footer-bottom-links">
            <Link to="/courses">Khoá học</Link>
            <Link to="/login">Đăng nhập</Link>
          </span>
        </div>
      </footer>

      <FloatingContact contact={contact} />
      <button
        type="button" className={`site-totop ${scrolled ? 'show' : ''}`} aria-label="Lên đầu trang"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
}
