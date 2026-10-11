import { Fragment, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, Check, Lightbulb, X } from 'lucide-react';
import { ADMIN_GUIDES } from '../constants/adminGuides';

const HIDDEN_KEY = 'hsk360.adminGuide.hidden';

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

/** Pop-up hướng dẫn từng bước: Bước 1 → ... → Hoàn tất. */
export default function GuidePopup({ guideKey, onClose }) {
  const guide = ADMIN_GUIDES[guideKey];
  const [step, setStep] = useState(0);
  const [hidden, setHidden] = useState(() => getHiddenGuides().has(guideKey));

  useEffect(() => { setStep(0); setHidden(getHiddenGuides().has(guideKey)); }, [guideKey]);

  const total = guide ? guide.steps.length + 1 : 0; // + màn Hoàn tất
  const isDone = step === total - 1;

  useEffect(() => {
    if (!guide) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') setStep((s) => Math.min(s + 1, total - 1));
      else if (e.key === 'ArrowLeft') setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [guide, total, onClose]);

  if (!guide) return null;

  const toggleHidden = (e) => { setHidden(e.target.checked); setGuideHidden(guideKey, e.target.checked); };
  const current = guide.steps[step];

  // Gắn thẳng vào body: phần tử cha có transform/animation sẽ làm position: fixed lệch khỏi màn hình.
  return createPortal(
    <div className="guide-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="guide-modal" role="dialog" aria-modal="true" aria-labelledby="guide-title">
        <header className="guide-head">
          <div>
            <span className="guide-eyebrow">Hướng dẫn sử dụng</span>
            <h3 id="guide-title">{guide.title}</h3>
          </div>
          <button type="button" className="guide-close" onClick={onClose} aria-label="Đóng"><X size={18} /></button>
        </header>

        {step === 0 && <p className="guide-intro">{guide.intro}</p>}

        <div className="guide-progress" aria-label={`Bước ${step + 1} trên ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              className={`guide-dot ${i === step ? 'active' : ''} ${i < step ? 'passed' : ''} ${i === total - 1 ? 'finish' : ''}`}
              onClick={() => setStep(i)}
              title={i === total - 1 ? 'Hoàn tất' : `Bước ${i + 1}: ${guide.steps[i].title}`}
            >
              {i === total - 1 ? <Check size={12} /> : i + 1}
            </button>
          ))}
        </div>

        <div className="guide-body" key={step}>
          {isDone ? (
            <div className="guide-finish">
              <span className="guide-finish-icon"><Check size={26} /></span>
              <h4>Hoàn tất!</h4>
              <p><RichText text={guide.done} /></p>
            </div>
          ) : (
            <>
              <div className="guide-step-label">Bước {step + 1} / {guide.steps.length}</div>
              <h4>{current.title}</h4>
              <p><RichText text={current.body} /></p>
              {current.tip && (
                <div className="guide-tip"><Lightbulb size={15} /><span><RichText text={current.tip} /></span></div>
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
