import { useEffect, useRef, useState } from 'react';
import { Check, Monitor, RotateCcw, Smartphone } from 'lucide-react';
import api from '../../api/client';
import Hanzi from '../../components/Hanzi';
import { useTypography } from '../../context/TypographyContext';
import { CN_FONTS, TYPOGRAPHY_DEFAULTS, VI_FONTS, applyTypography } from '../../constants/typography';

function Slider({ label, value, min, max, step, unit = '', onChange, format }) {
  return (
    <div className="form-field typo-slider">
      <label>
        {label}
        <b>{format ? format(value) : `${value}${unit}`}</b>
      </label>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <label className="typo-color">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <span>{label}</span>
      <code>{value.toUpperCase()}</code>
    </label>
  );
}

const pct = (v) => `${Math.round(v * 100)}%`;
const WEIGHTS = [[400, 'Thường'], [500, 'Vừa'], [700, 'Đậm'], [900, 'Rất đậm']];

/** Mẫu hiển thị dùng đúng component/lớp CSS của trang học thật. */
function Preview({ settings, mode }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) applyTypography(settings, ref.current, mode); }, [settings, mode]);
  return (
    <div ref={ref} className={`typo-preview ${mode}`}>
      <div className="typo-preview-body">
        <p className="typo-preview-text">Bài 1: Chào hỏi - học cách chào và giới thiệu bản thân bằng tiếng Trung.</p>
        <div className="card" style={{ maxWidth: 'none', marginBottom: 12 }}>
          <Hanzi hanzi="你好" pinyin="nǐ hǎo" meaning="Xin chào" size="lg" showSpeak={false} />
        </div>
        <div className="card" style={{ maxWidth: 'none', marginBottom: 12 }}>
          <Hanzi hanzi="我是越南人。" pinyin="Wǒ shì Yuènán rén." meaning="Tôi là người Việt Nam." showSpeak={false} />
        </div>
        <div className="dialogue-line-preview">
          <div className="dialogue-hanzi">你叫什么名字？</div>
          <div className="dialogue-pinyin">Nǐ jiào shénme míngzi?</div>
          <div className="dialogue-vi">Bạn tên là gì?</div>
        </div>
      </div>
    </div>
  );
}

/** Admin chỉnh font chữ, cỡ chữ, màu... cho toàn bộ trang học, xem trước ngay trước khi lưu. */
export default function AdminTypography() {
  const { settings: saved, setSettings: setGlobal } = useTypography();
  const [t, setT] = useState(saved);
  const [mode, setMode] = useState('desktop');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { setT(saved); }, [saved]);

  const set = (key) => (value) => { setT((x) => ({ ...x, [key]: value })); setMessage(''); };
  const dirty = JSON.stringify(t) !== JSON.stringify(saved);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const { data } = await api.put('/settings/typography', t);
      setGlobal(data);
      setMessage('Đã lưu - toàn bộ trang học đã áp dụng kiểu chữ mới.');
    } catch (err) {
      setError(err?.response?.data?.error || 'Lưu thất bại, vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Font chữ &amp; hiển thị</h2>
      <p className="page-sub">Áp dụng cho toàn bộ trang học của học viên (từ vựng, bài khoá, flashcard, ngữ pháp, bài tập...). Xem trước bên phải, bấm <b>Lưu</b> để áp dụng.</p>

      <div className="typo-layout">
        <div className="admin-form typo-controls">
          <h3>Font chữ</h3>
          <div className="form-field">
            <label>Font chữ Hán (tiếng Trung)</label>
            <select value={t.cnFont} onChange={(e) => set('cnFont')(e.target.value)}>
              {CN_FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Font tiếng Việt</label>
            <select value={t.viFont} onChange={(e) => set('viFont')(e.target.value)}>
              {VI_FONTS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Độ đậm chữ Hán</label>
            <div className="typo-segment">
              {WEIGHTS.map(([w, label]) => (
                <button key={w} type="button" className={t.hanziWeight === w ? 'active' : ''} onClick={() => set('hanziWeight')(w)}>{label}</button>
              ))}
            </div>
          </div>

          <h3>Cỡ chữ</h3>
          <Slider label="Cỡ chữ Hán (máy tính)" value={t.hanziScale} min={0.7} max={2} step={0.05} format={pct} onChange={set('hanziScale')} />
          <Slider label="Cỡ chữ Hán trên điện thoại (so với máy tính)" value={t.mobileHanziScale} min={0.7} max={1.6} step={0.05} format={pct} onChange={set('mobileHanziScale')} />
          <Slider label="Cỡ pinyin" value={t.pinyinScale} min={0.7} max={2} step={0.05} format={pct} onChange={set('pinyinScale')} />
          <Slider label="Cỡ phần dịch nghĩa" value={t.meaningScale} min={0.7} max={2} step={0.05} format={pct} onChange={set('meaningScale')} />
          <Slider label="Cỡ chữ tiếng Việt chung" value={t.baseSize} min={12} max={20} step={0.5} unit="px" onChange={set('baseSize')} />
          <Slider label="Khoảng cách dòng" value={t.lineHeight} min={1.2} max={2.2} step={0.05} format={(v) => v.toFixed(2)} onChange={set('lineHeight')} />

          <h3>Màu chữ</h3>
          <div className="typo-colors">
            <ColorField label="Chữ thường" value={t.textColor} onChange={set('textColor')} />
            <ColorField label="Chữ Hán" value={t.hanziColor} onChange={set('hanziColor')} />
            <ColorField label="Pinyin" value={t.pinyinColor} onChange={set('pinyinColor')} />
            <ColorField label="Dịch nghĩa" value={t.meaningColor} onChange={set('meaningColor')} />
          </div>
        </div>

        <div className="typo-preview-col">
          <div className="typo-preview-switch">
            <button type="button" className={mode === 'desktop' ? 'active' : ''} onClick={() => setMode('desktop')}><Monitor size={15} /> Máy tính</button>
            <button type="button" className={mode === 'mobile' ? 'active' : ''} onClick={() => setMode('mobile')}><Smartphone size={15} /> Điện thoại</button>
          </div>
          <Preview settings={t} mode={mode} />
          <div className="typo-actions">
            {error && <div className="form-error">{error}</div>}
            {message && <span className="save-ok"><Check size={15} /> {message}</span>}
            <button type="button" className="btn-secondary" onClick={() => { setT({ ...TYPOGRAPHY_DEFAULTS }); setMessage(''); }}><RotateCcw size={14} /> Khôi phục mặc định</button>
            <button type="button" className="btn-primary" onClick={save} disabled={saving || !dirty}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
