import { Eye, EyeOff } from 'lucide-react';
import { usePinyin } from '../context/PinyinContext';

export default function PinyinToggle() {
  const { showPinyin, toggle } = usePinyin();
  return (
    <button type="button" className={`pinyin-toggle ${showPinyin ? 'on' : ''}`} onClick={toggle}>
      {showPinyin ? <Eye size={14} /> : <EyeOff size={14} />}
      Pinyin
      <span className="pinyin-switch" />
    </button>
  );
}
