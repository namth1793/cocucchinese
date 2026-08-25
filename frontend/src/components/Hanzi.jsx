import { usePinyin } from '../context/PinyinContext';
import SpeakButton from './SpeakButton';

/**
 * Hiển thị chuẩn: 汉字 -> Pinyin -> Nghĩa tiếng Việt, đồng bộ theo trạng thái ẩn/hiện Pinyin toàn site.
 */
export default function Hanzi({ hanzi, pinyin, meaning, size = 'md', showSpeak = true, showMeaning = true }) {
  const { showPinyin } = usePinyin();
  return (
    <span className={`hanzi-block hanzi-${size}`}>
      <span className="hanzi-row">
        <span className="hanzi-text">{hanzi}</span>
        {showSpeak && <SpeakButton text={hanzi} />}
      </span>
      {showPinyin && pinyin && <span className="pinyin-text">{pinyin}</span>}
      {showMeaning && meaning && <span className="meaning-text">{meaning}</span>}
    </span>
  );
}
