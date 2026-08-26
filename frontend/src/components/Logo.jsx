export default function Logo({ size = 'md', showText = true }) {
  return (
    <span className={`brand-logo brand-logo-${size}`}>
      <img src="/logo.png" alt="HSK 360" className="brand-mark" />
      {showText && size === 'lg' && (
        <span className="brand-word">
          <span className="brand-word-sub">中文馆 · HSK / YCT</span>
        </span>
      )}
    </span>
  );
}
