/** Phải khớp TYPOGRAPHY_DEFAULTS ở backend/src/routes/settings.js. */
export const TYPOGRAPHY_DEFAULTS = {
  cnFont: 'Noto Serif SC', viFont: 'Be Vietnam Pro', baseSize: 15, lineHeight: 1.5,
  textColor: '#1F2937', hanziColor: '#1F2937', pinyinColor: '#D97706', meaningColor: '#6B7280',
  hanziWeight: 700, hanziScale: 1, pinyinScale: 1, meaningScale: 1, mobileHanziScale: 1
};

const google = (family, weights) => `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weights}&display=swap`;

/** Font chữ Hán: chỉ chọn các font hiển thị đầy đủ chữ giản thể, rõ nét trên điện thoại. */
export const CN_FONTS = [
  { value: 'Noto Serif SC', label: 'Song (Tống) - có chân, rõ nét, mặc định', stack: "'Noto Serif SC', 'Songti SC', serif" },
  { value: 'Noto Sans SC', label: 'Hei (Hắc) - không chân, hiện đại', stack: "'Noto Sans SC', 'Microsoft YaHei', sans-serif", href: google('Noto Sans SC', '400;500;700;900') },
  { value: 'LXGW WenKai', label: 'Kai (Khải) - giống nét viết tay sách giáo khoa', stack: "'LXGW WenKai', 'KaiTi', 'STKaiti', serif", href: 'https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css' },
  { value: 'ZCOOL XiaoWei', label: 'XiaoWei - mảnh, thanh thoát', stack: "'ZCOOL XiaoWei', 'Noto Serif SC', serif", href: google('ZCOOL XiaoWei', '400') }
];

/** Font tiếng Việt: đều hỗ trợ đầy đủ dấu tiếng Việt. */
export const VI_FONTS = [
  { value: 'Be Vietnam Pro', label: 'Be Vietnam Pro (mặc định)', stack: "'Be Vietnam Pro', 'Segoe UI', system-ui, sans-serif" },
  { value: 'Inter', label: 'Inter', stack: "'Inter', 'Segoe UI', system-ui, sans-serif", href: google('Inter', '400;500;600;700;800') },
  { value: 'Roboto', label: 'Roboto', stack: "'Roboto', 'Segoe UI', system-ui, sans-serif", href: google('Roboto', '400;500;700;900') },
  { value: 'Nunito', label: 'Nunito (bo tròn, thân thiện)', stack: "'Nunito', 'Segoe UI', system-ui, sans-serif", href: google('Nunito', '400;600;700;800') },
  { value: 'Lexend', label: 'Lexend (dễ đọc)', stack: "'Lexend', 'Segoe UI', system-ui, sans-serif", href: google('Lexend', '400;500;600;700;800') },
  { value: 'Noto Sans', label: 'Noto Sans', stack: "'Noto Sans', 'Segoe UI', system-ui, sans-serif", href: google('Noto Sans', '400;500;600;700;800') }
];

const loaded = new Set();
function ensureFontLoaded(font) {
  if (!font?.href || loaded.has(font.href)) return;
  loaded.add(font.href);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = font.href;
  document.head.appendChild(link);
}

/** Đặt biến CSS lên :root (hoặc 1 phần tử, dùng cho khung xem trước của trang cài đặt). */
export function applyTypography(settings, target = document.documentElement, previewMode = null) {
  const t = { ...TYPOGRAPHY_DEFAULTS, ...(settings || {}) };
  const cn = CN_FONTS.find((f) => f.value === t.cnFont) || CN_FONTS[0];
  const vi = VI_FONTS.find((f) => f.value === t.viFont) || VI_FONTS[0];
  ensureFontLoaded(cn);
  ensureFontLoaded(vi);
  const vars = {
    '--font-cn': cn.stack,
    '--font-cn-serif': cn.stack,
    '--font-ui': vi.stack,
    '--ink': t.textColor,
    '--hanzi-color': t.hanziColor,
    '--pinyin-color': t.pinyinColor,
    '--meaning-color': t.meaningColor,
    '--hanzi-weight': String(t.hanziWeight),
    '--hanzi-scale-desktop': String(t.hanziScale),
    '--hanzi-scale-mobile': String(t.hanziScale * t.mobileHanziScale),
    '--pinyin-scale': String(t.pinyinScale),
    '--meaning-scale': String(t.meaningScale),
    '--base-size': `${t.baseSize}px`,
    '--base-line-height': String(t.lineHeight)
  };
  // Khung xem trước: --hanzi-scale ở :root đã được tính sẵn theo màn hình thật, nên phải đặt trực tiếp.
  if (previewMode) vars['--hanzi-scale'] = previewMode === 'mobile' ? vars['--hanzi-scale-mobile'] : vars['--hanzi-scale-desktop'];
  Object.entries(vars).forEach(([k, v]) => target.style.setProperty(k, v));
}
