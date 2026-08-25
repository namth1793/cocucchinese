import { speak } from '../utils/speak';

export default function SpeakButton({ text, label }) {
  return (
    <button
      type="button"
      className="speak-btn"
      aria-label={label || `Nghe phát âm ${text}`}
      onClick={(e) => { e.stopPropagation(); speak(text); }}
    >
      🔊
    </button>
  );
}
