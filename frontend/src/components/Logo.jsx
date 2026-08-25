export default function Logo({ size = 'md', showText = true }) {
  return (
    <span className={`brand-logo brand-logo-${size}`}>
      <span className="brand-seal" aria-hidden="true">菊</span>
      {showText && (
        <span className="brand-word">
          <span className="brand-word-main">Cô Cúc Chinese</span>
          <span className="brand-word-sub">中文馆 · HSK / YCT</span>
        </span>
      )}
    </span>
  );
}
