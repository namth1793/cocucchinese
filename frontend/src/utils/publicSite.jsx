import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api/client';

/**
 * Dữ liệu dùng chung cho các trang công khai: nội dung trang chủ (admin sửa ở /admin/homepage)
 * và danh mục khoá học. Header, footer và trang chủ cùng đọc nên chỉ tải 1 lần mỗi lượt vào trang.
 */
let cache = null;
let pending = null;
const listeners = new Set();

function fetchSite() {
  if (!pending) {
    pending = Promise.all([
      api.get('/homepage').then((r) => r.data).catch(() => null),
      api.get('/courses/catalog').then((r) => r.data).catch(() => ({ courses: [], stats: {} }))
    ]).then(([content, catalog]) => {
      cache = { content, catalog };
      listeners.forEach((fn) => fn(cache));
      return cache;
    });
  }
  return pending;
}

/** Gọi sau khi admin lưu nội dung để header/footer cập nhật ngay không cần tải lại trang. */
export function setHomepageContent(content) {
  cache = { ...(cache || { catalog: { courses: [], stats: {} } }), content };
  listeners.forEach((fn) => fn(cache));
}

export function usePublicSite() {
  const [site, setSite] = useState(cache);
  useEffect(() => {
    listeners.add(setSite);
    if (!cache) fetchSite();
    return () => listeners.delete(setSite);
  }, []);
  return site || { content: null, catalog: null };
}

export function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return Boolean(el);
}

/**
 * Link nhận cả 3 dạng admin nhập: "#muc" (neo trên trang chủ), "/duong-dan" (trang nội bộ),
 * "https://..." (mở tab mới).
 */
export function SmartLink({ to, children, onClick, ...rest }) {
  const { pathname } = useLocation();
  if (!to) return <span {...rest}>{children}</span>;
  if (/^https?:\/\//i.test(to)) {
    return <a href={to} target="_blank" rel="noopener noreferrer" onClick={onClick} {...rest}>{children}</a>;
  }
  if (to.startsWith('#')) {
    const handle = (e) => {
      onClick?.(e);
      if (pathname === '/' && scrollToId(to.slice(1))) e.preventDefault();
    };
    return <Link to={`/${to}`} onClick={handle} {...rest}>{children}</Link>;
  }
  return <Link to={to} onClick={onClick} {...rest}>{children}</Link>;
}

/** Số điện thoại hiển thị → dạng gọi được trên link tel:. */
export const telHref = (phone) => `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;

/**
 * Hiệu ứng hiện dần khi cuộn tới (kiểu AOS): phần tử có data-reveal="fade-up|fade-left|zoom-in..."
 * được thêm class is-revealed lần đầu lọt vào màn hình. Chạy lại khi `deps` đổi (dữ liệu tải xong).
 */
export function useReveal(deps = []) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-reveal]:not(.is-revealed)'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-revealed'));
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Lấy mã video YouTube từ mọi dạng link (watch?v=, youtu.be/, shorts/, embed/). */
export function youtubeId(url) {
  const m = String(url || '').match(/(?:youtu\.be\/|v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/);
  return m ? m[1] : '';
}
