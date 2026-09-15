import { useEffect, useRef, useState } from 'react';
import { X, Play, PenTool } from 'lucide-react';
import HanziWriter from 'hanzi-writer';
import api from '../api/client';
import SpeakButton from './SpeakButton';

const WRITER_SIZE = 180;

// Lấy dữ liệu thứ tự nét từ chính backend (gói hanzi-writer-data) thay vì để
// trình duyệt gọi thẳng ra CDN jsdelivr mặc định của hanzi-writer — tránh lỗi
// "không tải được hoạt hình" khi máy/mạng không ra được Internet.
function charDataLoader(char, onLoad, onError) {
  api.get(`/hanzi-data/${encodeURIComponent(char)}`)
    .then((res) => onLoad(res.data))
    .catch((err) => onError(err));
}

export default function CharacterCard({ character, onClose }) {
  const targetRef = useRef(null);
  const writerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setReady(false);
    setError(false);
    writerRef.current = null;
    targetRef.current.innerHTML = '';

    const writer = HanziWriter.create(targetRef.current, character.char, {
      width: WRITER_SIZE,
      height: WRITER_SIZE,
      padding: 8,
      strokeColor: '#6B21A8',
      radicalColor: '#DC2626',
      outlineColor: '#E5E7EB',
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 250,
      showCharacter: true,
      showOutline: true,
      charDataLoader,
      onLoadCharDataError: () => setError(true),
      onLoadCharDataSuccess: () => setReady(true)
    });
    writerRef.current = writer;

    return () => {
      writerRef.current = null;
      if (targetRef.current) targetRef.current.innerHTML = '';
    };
  }, [character.id]);

  const c = character;

  const handlePlay = () => {
    if (!writerRef.current) return;
    writerRef.current.hideCharacter();
    writerRef.current.animateCharacter();
  };

  const handlePractice = () => {
    if (!writerRef.current) return;
    writerRef.current.quiz();
  };

  return (
    <div className="card char-expanded">
      <button type="button" className="char-modal-close" onClick={onClose} aria-label="Đóng">
        <X size={18} />
      </button>

      <div className="char-hanzi-row">
        <span className="cn char-hanzi-big">{c.char}</span>
        <SpeakButton text={c.char} />
      </div>
      <div className="char-meta">
        {c.pinyin && <span className="pinyin-text">{c.pinyin}</span>}
        {c.meaningVi && <span className="meaning-text">{c.meaningVi}</span>}
      </div>
      <div className="char-tags">
        {c.strokes != null && <span className="char-tag">{c.strokes} nét</span>}
        {c.structure && <span className="char-tag cn">{c.structure}</span>}
      </div>

      {c.radical && (
        <div className="char-row">
          <span className="char-row-label">Bộ thủ</span>
          <span className="cn char-radical">{c.radical}</span>
          <span className="char-row-text">— {c.radicalMeaningVi}</span>
        </div>
      )}
      {c.build && (
        <div className="char-row">
          <span className="char-row-label">Cấu tạo</span>
          <span className="char-row-text cn">{c.build}</span>
        </div>
      )}
      {c.rule && (
        <div className="char-row">
          <span className="char-row-label">Quy tắc</span>
          <span className="char-tag cn">{c.rule}</span>
        </div>
      )}
      {c.memo && (
        <div className="char-row">
          <span className="char-row-label">Mẹo nhớ</span>
          <span className="char-row-text cn">{c.memo}</span>
        </div>
      )}

      <div className="char-writer-section">
        <span className="char-row-label">Chạy chữ</span>
        <div className="char-writer-box" ref={targetRef} />
        <div className="char-writer-actions">
          <button type="button" className="btn-secondary" onClick={handlePlay} disabled={!ready}>
            <Play size={14} /> Xem viết
          </button>
          <button type="button" className="btn-primary" onClick={handlePractice} disabled={!ready}>
            <PenTool size={14} /> Tự luyện viết
          </button>
        </div>
        {!ready && !error && <p className="char-writer-hint">Đang tải dữ liệu nét chữ...</p>}
        {error && <p className="char-writer-hint">Không tải được hoạt hình cho chữ này — dùng thứ tự nét dự phòng bên dưới.</p>}
        {ready && <p className="char-writer-hint">Nhấn "Xem viết" để bắt đầu hoạt hình.</p>}
      </div>

      {c.strokeSeq && c.strokeSeq.length > 0 && (
        <div className="char-row" style={{ marginTop: 10 }}>
          <span className="char-row-label">Thứ tự nét (dự phòng)</span>
        </div>
      )}
      {c.strokeSeq && c.strokeSeq.length > 0 && (
        <div className="char-stroke-seq">
          {c.strokeSeq.map((s, i) => <span key={i} className="char-stroke-chip cn">{s}</span>)}
        </div>
      )}
    </div>
  );
}
