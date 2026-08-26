import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CircleHelp, Layers } from 'lucide-react';
import api from '../api/client';
import { usePinyin } from '../context/PinyinContext';
import { speak } from '../utils/speak';
import PlumBlossom from '../components/PlumBlossom';
import PageHeader from '../components/PageHeader';

export default function Flashcards() {
  const { lessonId } = useParams();
  const { showPinyin } = usePinyin();
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [tally, setTally] = useState({ known: 0, unknown: 0 });
  const [done, setDone] = useState(false);
  const [fly, setFly] = useState(null); // null | 'right' | 'left'
  const [noAnim, setNoAnim] = useState(false);

  useEffect(() => {
    api.get(`/flashcards/${lessonId}`).then((res) => setCards(res.data));
  }, [lessonId]);

  if (cards.length === 0) {
    return (
      <div>
        <PageHeader icon={Layers} color="#D97706" title="Flashcard" backTo={`/lessons/${lessonId}`} />
        <p className="empty-state">Chưa có từ vựng để tạo flashcard.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div>
        <PageHeader icon={Layers} color="#D97706" title="Flashcard" backTo={`/lessons/${lessonId}`} />
        <div className="card" style={{ textAlign: 'center' }}>
          <h3><PlumBlossom size={20} color="var(--primary)" style={{ verticalAlign: -4, marginRight: 6 }} />Hoàn thành Flashcard!</h3>
          <p style={{ color: 'var(--ink-soft)', margin: '8px 0 16px' }}>
            🟢 Đã nhớ: {tally.known} · 🔴 Chưa nhớ: {tally.unknown}
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => { setIndex(0); setFlipped(false); setDone(false); setTally({ known: 0, unknown: 0 }); }}
          >
            Học lại
          </button>
        </div>
      </div>
    );
  }

  const card = cards[index];

  const choose = (status) => {
    if (fly) return;
    setFly(status === 'known' ? 'right' : 'left');
    setTimeout(async () => {
      await api.post(`/flashcards/${card.id}/status`, { status });
      setTally((t) => ({ ...t, [status]: t[status] + 1 }));
      setNoAnim(true);
      if (index + 1 >= cards.length) {
        setDone(true);
      } else {
        setIndex((i) => i + 1);
        setFlipped(false);
      }
      setFly(null);
      requestAnimationFrame(() => requestAnimationFrame(() => setNoAnim(false)));
    }, 320);
  };

  return (
    <div>
      <PageHeader
        icon={Layers}
        color="#D97706"
        title="Flashcard"
        subtitle={`Thẻ ${index + 1}/${cards.length}`}
        backTo={`/lessons/${lessonId}`}
      />

      <div className="exercise-progress-dots" style={{ maxWidth: 320, margin: '0 auto 18px' }}>
        {cards.map((_, i) => (
          <span key={i} className={i < index ? 'dot-done' : i === index ? 'dot-current' : ''} />
        ))}
      </div>

      <div className="flashcard-wrap">
        <div className={`flashcard-scene ${fly === 'right' ? 'fly-right' : fly === 'left' ? 'fly-left' : ''} ${noAnim ? 'no-anim' : ''}`}>
          <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => !fly && setFlipped((f) => !f)} role="button" tabIndex={0}>
            <div className="flashcard-face flashcard-front">
              <div className="flashcard-hanzi">{card.hanzi}</div>
              <button type="button" className="speak-btn" onClick={(e) => { e.stopPropagation(); speak(card.hanzi); }}>🔊</button>
              <div className="flashcard-hint"><CircleHelp size={12} style={{ verticalAlign: -2, marginRight: 4 }} />Chạm để lật thẻ</div>
            </div>
            <div className="flashcard-face flashcard-back">
              <div className="flashcard-hanzi">{card.hanzi}</div>
              {showPinyin && <div className="flashcard-pinyin">{card.pinyin}</div>}
              <div className="flashcard-meaning">{card.meaningVi}</div>
              {card.example && <div className="flashcard-example">{card.example.hanzi} · {card.example.vi}</div>}
            </div>
          </div>
        </div>

        <div className="flashcard-actions">
          <button type="button" className="fc-btn fc-unknown" disabled={!!fly} onClick={() => choose('unknown')}>🔴 Chưa nhớ</button>
          <button type="button" className="fc-btn fc-known" disabled={!!fly} onClick={() => choose('known')}>🟢 Đã nhớ</button>
        </div>
      </div>
    </div>
  );
}
