import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Check, Lightbulb, MousePointerClick, X } from 'lucide-react';
import { ADMIN_GUIDES } from '../constants/adminGuides';

const HIDDEN_KEY = 'hsk360.adminGuide.hidden';
const PAD = 6; // khoảng hở quanh vùng khoanh
const GAP = 14; // khoảng cách khung hướng dẫn với vùng khoanh
const EDGE = 12; // lề tối thiểu với mép màn hình

/** Tập các mục người dùng đã chọn "Không tự mở lại" - chỉ lưu trên trình duyệt này. */
export function getHiddenGuides() {
  try { return new Set(JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]')); } catch { return new Set(); }
}

function setGuideHidden(key, hidden) {
  try {
    const s = getHiddenGuides();
    if (hidden) s.add(key); else s.delete(key);
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...s]));
  } catch { /* trình duyệt chặn lưu trữ - bỏ qua */ }
}

/** Hiển thị **chữ** thành in đậm. */
export function RichText({ text }) {
  return String(text).split(/\*\*(.+?)\*\*/g).map((part, i) => (
    i % 2 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>
  ));
}

const isVisible = (el) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
};

/** Tìm phần tử theo cú pháp target trong adminGuides.js ('sel', 'sel::chữ', '*sel'). */
function matchTargets(spec) {
  if (!spec) return [];
  const all = spec.startsWith('*');
  const [sel, text] = (all ? spec.slice(1) : spec).split('::');
  let els;
  try { els = [...document.querySelectorAll(sel)]; } catch { return []; }
  els = els.filter((e) => !e.closest('.tour-layer'));
  if (text) {
    els = els.filter((e) => e.textContent.includes(text));
    // Chỉ giữ phần tử trong cùng (bỏ các khung cha cũng chứa đoạn chữ đó).
    els = els.filter((e) => !els.some((o) => o !== e && e.contains(o)));
  }
  return { els, all };
}

function findTargets(spec) {
  const { els = [], all } = matchTargets(spec) || {};
  const vis = els.filter(isVisible);
  return all ? vis : vis.slice(0, 1);
}

function unionRect(els) {
  if (!els.length) return null;
  const rs = els.map((e) => e.getBoundingClientRect());
  const top = Math.min(...rs.map((r) => r.top)) - PAD;
  const left = Math.min(...rs.map((r) => r.left)) - PAD;
  const bottom = Math.max(...rs.map((r) => r.bottom)) + PAD;
  const right = Math.max(...rs.map((r) => r.right)) + PAD;
  return { top: Math.round(top), left: Math.round(left), width: Math.round(right - left), height: Math.round(bottom - top) };
}

const sameRect = (a, b) => (a === b) || (a && b && a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height);

const overlapArea = (a, b) => Math.max(0, Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left))
  * Math.max(0, Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top));

/**
 * Vị trí khung hướng dẫn: ưu tiên dưới → trên → phải → trái vùng khoanh. Vùng khoanh quá lớn
 * (VD: cả form) thì chọn góc màn hình che ít nhất.
 */
function placeCard(rect, w, h) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const clampX = (x) => Math.max(EDGE, Math.min(x, vw - w - EDGE));
  const clampY = (y) => Math.max(EDGE, Math.min(y, vh - h - EDGE));
  const cx = clampX(rect.left + rect.width / 2 - w / 2);
  if (rect.top + rect.height + GAP + h <= vh - EDGE) return { top: rect.top + rect.height + GAP, left: cx, side: 'below' };
  if (rect.top - GAP - h >= EDGE) return { top: rect.top - GAP - h, left: cx, side: 'above' };
  if (rect.left + rect.width + GAP + w <= vw - EDGE) return { top: clampY(rect.top), left: rect.left + rect.width + GAP, side: 'right' };
  if (rect.left - GAP - w >= EDGE) return { top: clampY(rect.top), left: rect.left - GAP - w, side: 'left' };
  const corners = [
    { top: vh - h - EDGE, left: vw - w - EDGE }, { top: EDGE, left: vw - w - EDGE },
    { top: vh - h - EDGE, left: EDGE }, { top: EDGE, left: EDGE }
  ];
  const best = corners.reduce((a, b) => (overlapArea({ ...b, width: w, height: h }, rect) < overlapArea({ ...a, width: w, height: h }, rect) ? b : a));
  return { ...best, side: 'dock' };
}

/**
 * Hướng dẫn từng bước dạng khoanh vùng: mỗi bước làm tối màn hình, khoanh đúng nút/ô cần thao tác
 * và đặt khung giải thích ngay cạnh. Vùng khoanh vẫn bấm được để người dùng làm theo luôn.
 */
export default function GuidePopup({ guideKey, onClose }) {
  const guide = ADMIN_GUIDES[guideKey];
  const [step, setStep] = useState(0);
  const [hidden, setHidden] = useState(() => getHiddenGuides().has(guideKey));
  const [rect, setRect] = useState(null);
  const [cardSize, setCardSize] = useState({ w: 360, h: 220 });
  const cardRef = useRef(null);

  useEffect(() => { setStep(0); setHidden(getHiddenGuides().has(guideKey)); }, [guideKey]);

  const total = guide ? guide.steps.length + 1 : 0; // + màn Hoàn tất
  const isDone = step === total - 1;
  const target = guide && !isDone ? guide.steps[step].target : null;

  const measure = useCallback(() => {
    const next = target ? unionRect(findTargets(target)) : null;
    setRect((prev) => (sameRect(prev, next) ? prev : next));
  }, [target]);

  // Đổi bước: mở <details> đang đóng chứa đích, cuộn đích vào giữa màn hình.
  useEffect(() => {
    if (!target) { setRect(null); return; }
    const { els = [] } = matchTargets(target) || {};
    els.forEach((e) => {
      const d = e.closest('details:not([open])');
      if (d && e.tagName !== 'SUMMARY') d.open = true;
    });
    const first = findTargets(target)[0];
    if (first) {
      const r = first.getBoundingClientRect();
      const offY = r.top < 70 || r.bottom > window.innerHeight - 40;
      // Thanh tab dài có thể tràn ngang - cuộn ngang để tab được khoanh nằm trong khung nhìn.
      const scroller = first.closest('.tabs, .admin-tabs');
      const offX = scroller && (r.left < scroller.getBoundingClientRect().left || r.right > scroller.getBoundingClientRect().right);
      // Khung hướng dẫn không vừa trên/dưới vùng khoanh nhưng sẽ vừa nếu vùng khoanh nằm sát đầu màn hình → cuộn lên đầu.
      const h = cardRef.current ? cardRef.current.offsetHeight : 300;
      const vh = window.innerHeight;
      const fitsNow = r.bottom + PAD + GAP + h <= vh - EDGE || r.top - PAD - GAP - h >= EDGE;
      const fitsAtTop = 80 + r.height + PAD * 2 + GAP + h <= vh - EDGE;
      if (!fitsNow && fitsAtTop) {
        first.style.scrollMarginTop = '80px';
        first.scrollIntoView({ block: 'start', inline: offX ? 'center' : 'nearest', behavior: 'smooth' });
      } else if (offY || offX) {
        first.scrollIntoView({ block: offY ? 'center' : 'nearest', inline: offX ? 'center' : 'nearest', behavior: 'smooth' });
      }
    }
    measure();
  }, [target, measure]);

  // Đích có thể xuất hiện/dịch chuyển bất cứ lúc nào (mở form, tải dữ liệu, cuộn) - đo lại liên tục.
  useEffect(() => {
    if (!guide) return undefined;
    const id = setInterval(measure, 250);
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => { clearInterval(id); window.removeEventListener('scroll', measure, true); window.removeEventListener('resize', measure); };
  }, [guide, measure]);

  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const { offsetWidth: w, offsetHeight: h } = cardRef.current;
    setCardSize((s) => (s.w === w && s.h === h ? s : { w, h }));
  });

  useEffect(() => {
    if (!guide) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;
      if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, total - 1));
      else if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [guide, total, onClose]);

  if (!guide) return null;

  const toggleHidden = (e) => { setHidden(e.target.checked); setGuideHidden(guideKey, e.target.checked); };
  const current = guide.steps[step];
  const missing = !!target && !rect;
  const pos = rect ? placeCard(rect, cardSize.w, cardSize.h) : null;

  return createPortal(
    <div className="tour-layer">
      {rect
        ? <div className="tour-spot" style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }} />
        : <div className="tour-dim" />}

      <div
        ref={cardRef}
        className={`tour-card ${pos ? `tour-card-${pos.side}` : 'tour-card-center'}`}
        style={pos ? { top: pos.top, left: pos.left } : undefined}
        role="dialog"
        aria-modal="false"
        aria-labelledby="guide-title"
      >
        <header className="guide-head">
          <div>
            <span className="guide-eyebrow">Hướng dẫn · {guide.title}</span>
            <h3 id="guide-title">{isDone ? 'Hoàn tất!' : current.title}</h3>
          </div>
          <button type="button" className="guide-close" onClick={onClose} aria-label="Đóng hướng dẫn"><X size={17} /></button>
        </header>

        <div className="guide-progress" aria-label={`Bước ${step + 1} trên ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`guide-dot ${i === step ? 'active' : ''} ${i < step ? 'passed' : ''} ${i === total - 1 ? 'finish' : ''}`}
              onClick={() => setStep(i)}
              title={i === total - 1 ? 'Hoàn tất' : `Bước ${i + 1}: ${guide.steps[i].title}`}
            >
              {i === total - 1 ? <Check size={11} /> : i + 1}
            </button>
          ))}
        </div>

        <div className="guide-body" key={step}>
          {isDone ? (
            <div className="guide-finish">
              <span className="guide-finish-icon"><Check size={24} /></span>
              <p><RichText text={guide.done} /></p>
            </div>
          ) : (
            <>
              {step === 0 && <p className="guide-intro">{guide.intro}</p>}
              <p><RichText text={current.body} /></p>
              {current.tip && <div className="guide-tip"><Lightbulb size={15} /><span><RichText text={current.tip} /></span></div>}
              {missing && (
                <div className="guide-missing">
                  <MousePointerClick size={15} />
                  <span>
                    Phần này chưa hiện trên màn hình. {current.needs || <>Hãy làm bước trước (VD: bấm <b>+ Thêm mới</b>, <b>Sửa</b> hoặc chuyển đúng tab).</>}
                    {' '}Khung sẽ tự khoanh vào khi phần đó hiện ra.
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        <footer className="guide-foot">
          <label className="guide-hide">
            <input type="checkbox" checked={hidden} onChange={toggleHidden} /> Không tự mở lại ở mục này
          </label>
          <div className="guide-nav">
            {step > 0 && (
              <button type="button" className="btn-secondary" onClick={() => setStep(step - 1)}><ArrowLeft size={14} /> Quay lại</button>
            )}
            {isDone ? (
              <button type="button" className="btn-primary" onClick={onClose}><Check size={15} /> Đóng</button>
            ) : (
              <button type="button" className="btn-primary" onClick={() => setStep(step + 1)}>
                {step === total - 2 ? <>Hoàn tất <Check size={15} /></> : <>Tiếp theo <ArrowRight size={14} /></>}
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
