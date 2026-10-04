import { useEffect, useId, useMemo, useRef, useState } from 'react';

/**
 * Hoạ tiết trang trí phong cách Trung Hoa cho trang công khai: đèn lồng, mây cát tường (祥云),
 * cánh hoa mai rơi, con dấu đỏ, số đếm chạy. Toàn bộ là SVG/CSS nội tuyến - không tải thêm ảnh.
 */

const svgId = (id) => id.replace(/[^a-zA-Z0-9_-]/g, '');

/** Đèn lồng đỏ có chữ, lắc nhẹ theo nhịp (animation ở CSS .cn-lantern). */
export function Lantern({ hanzi = '福', size = 72, className = '', style }) {
  const id = svgId(useId());
  return (
    <span className={`cn-lantern ${className}`} style={{ width: size, ...style }} aria-hidden="true">
      <svg viewBox="0 0 100 200" width="100%">
        <defs>
          <radialGradient id={`lg${id}`} cx="40%" cy="38%" r="70%">
            <stop offset="0" stopColor="#FF6B4A" />
            <stop offset=".55" stopColor="#D42A1E" />
            <stop offset="1" stopColor="#8E130C" />
          </radialGradient>
          <linearGradient id={`lgo${id}`} x1="0" x2="1">
            <stop offset="0" stopColor="#B07A22" />
            <stop offset=".5" stopColor="#F6D27A" />
            <stop offset="1" stopColor="#B07A22" />
          </linearGradient>
        </defs>
        <line x1="50" y1="0" x2="50" y2="24" stroke="#C99A3E" strokeWidth="2" />
        <rect x="32" y="22" width="36" height="11" rx="3" fill={`url(#lgo${id})`} />
        <ellipse cx="50" cy="80" rx="46" ry="48" fill={`url(#lg${id})`} />
        <g fill="none" stroke="rgba(90,10,6,.35)" strokeWidth="1.4">
          <ellipse cx="50" cy="80" rx="31" ry="48" />
          <ellipse cx="50" cy="80" rx="14" ry="48" />
        </g>
        <text x="50" y="96" textAnchor="middle" fontSize="40" fill="#FFD98A" fontFamily="'Ma Shan Zheng','Noto Serif SC',serif">{hanzi}</text>
        <rect x="32" y="126" width="36" height="11" rx="3" fill={`url(#lgo${id})`} />
        <g stroke="#E8B54E" strokeWidth="2" strokeLinecap="round">
          {[38, 43, 48, 52, 57, 62].map((x, i) => <line key={x} x1={x} y1="137" x2={x + (i - 2.5) * .8} y2={186 + (i % 2) * 6} />)}
        </g>
        <circle cx="50" cy="141" r="4.5" fill="#D42A1E" />
      </svg>
    </span>
  );
}

/** Mây cát tường (祥云) - nét viền, dùng làm hoạ tiết trôi nhẹ. */
export function Cloud({ className = '', style, color = 'currentColor' }) {
  return (
    <svg viewBox="0 0 160 64" className={`cn-cloud ${className}`} style={style} aria-hidden="true" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round">
      <path d="M8 56 H132 a18 18 0 0 0 4-35.5 a16 16 0 0 0-27-9 a22 22 0 0 0-40 4 a15 15 0 0 0-24 12 a14 14 0 0 0-37 28.5" />
      <path d="M118 44 a9 9 0 1 0-9-11 a5 5 0 1 0 6 4" />
      <path d="M72 42 a10 10 0 1 1 10-12 a5 5 0 1 1-6 5" />
      <path d="M34 48 a7 7 0 1 1 8-9" />
    </svg>
  );
}

/** Con dấu đỏ (印章) với 1-4 chữ Hán. */
export function Seal({ text = '汉语', className = '', size = 64 }) {
  const chars = Array.from(text).slice(0, 4);
  return (
    <span className={`cn-seal ${chars.length > 2 ? 'cn-seal-4' : ''} ${className}`} style={{ width: size, height: size, fontSize: size * (chars.length > 2 ? .34 : chars.length === 2 ? .38 : .62) }} aria-hidden="true">
      {chars.map((c, i) => <span key={i}>{c}</span>)}
    </span>
  );
}

/** Cánh hoa mai rơi lả tả - chỉ là các span có biến CSS ngẫu nhiên, chạy bằng keyframes. */
export function Petals({ count = 14, className = '' }) {
  const petals = useMemo(() => Array.from({ length: count }, (_, i) => {
    const r = (n) => {
      const x = Math.sin((i + 1) * 9301 + n * 49297) * 233280;
      return x - Math.floor(x);
    };
    return {
      '--x': `${(r(1) * 100).toFixed(1)}%`,
      '--size': `${(8 + r(2) * 10).toFixed(1)}px`,
      '--dur': `${(9 + r(3) * 9).toFixed(1)}s`,
      '--delay': `${(-r(4) * 18).toFixed(1)}s`,
      '--drift': `${((r(5) - .5) * 220).toFixed(0)}px`,
      '--spin': `${(r(6) > .5 ? 1 : -1) * (240 + r(7) * 360).toFixed(0)}deg`
    };
  }), [count]);
  return (
    <span className={`cn-petals ${className}`} aria-hidden="true">
      {petals.map((s, i) => <span key={i} className="cn-petal" style={s} />)}
    </span>
  );
}

/** Số chạy từ 0 đến `value` khi lần đầu lọt vào màn hình. */
export function CountUp({ value, duration = 1600, format = (n) => n.toLocaleString('vi-VN') }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    const target = Number(value) || 0;
    if (!el || !target) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
      setN(target);
      return undefined;
    }
    let raf = 0;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - start) / duration);
        setN(Math.round(target * (1 - Math.pow(1 - t, 3))));
        if (t < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: .4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value, duration]);
  return <span ref={ref}>{format(n)}</span>;
}

/**
 * Hiệu ứng chiều sâu khi cuộn: phần tử có data-parallax="0.15" trôi chậm hơn trang.
 * Ghi vào biến CSS --py để không đè transform/animation riêng của phần tử con.
 */
export function useParallax(deps = []) {
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const els = Array.from(document.querySelectorAll('[data-parallax]'));
    if (!els.length) return undefined;
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      els.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        const f = parseFloat(el.dataset.parallax) || .1;
        el.style.setProperty('--py', `${((rect.top + rect.height / 2 - vh / 2) * -f).toFixed(1)}px`);
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
