/**
 * Hoa mai (梅花) — biểu tượng may mắn, kiên cường trong văn hoá Trung Hoa.
 * Dùng thay cho icon ăn mừng chung chung ở các màn hoàn thành bài/game.
 */
export default function PlumBlossom({ size = 22, color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={style} aria-hidden="true">
      <g transform="translate(20,20)">
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse key={deg} cx="0" cy="-9" rx="6.2" ry="9.4" transform={`rotate(${deg})`} fill={color} opacity="0.92" />
        ))}
        <circle r="3" fill="#fff" opacity="0.9" />
      </g>
    </svg>
  );
}
