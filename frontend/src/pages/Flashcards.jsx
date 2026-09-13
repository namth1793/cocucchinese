import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layers, Volume2 } from 'lucide-react';
import api from '../api/client';
import { usePinyin } from '../context/PinyinContext';
import { speak } from '../utils/speak';
import PageHeader from '../components/PageHeader';

export default function Flashcards() {
  const { lessonId } = useParams();
  const { showPinyin } = usePinyin();
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState({});
  const [status, setStatus] = useState({});

  useEffect(() => {
    api.get(`/flashcards/${lessonId}`).then((res) => {
      setCards(res.data);
      const st = {};
      res.data.forEach((c) => { if (c.flashcardStatus) st[c.id] = c.flashcardStatus; });
      setStatus(st);
    });
  }, [lessonId]);

  const toggleFlip = (id) => setFlipped((f) => ({ ...f, [id]: !f[id] }));

  const mark = async (e, id, value) => {
    e.stopPropagation();
    setStatus((s) => ({ ...s, [id]: value }));
    await api.post(`/flashcards/${id}/status`, { status: value });
  };

  const knownCount = Object.values(status).filter((s) => s === 'known').length;
  const unknownCount = Object.values(status).filter((s) => s === 'unknown').length;

  if (cards.length === 0) {
    return (
      <div>
        <PageHeader icon={Layers} color="#D97706" title="Flashcard" backTo={`/lessons/${lessonId}`} />
        <p className="empty-state">Chưa có từ vựng để tạo flashcard.</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={Layers}
        color="#D97706"
        title="Flashcard"
        subtitle={`${cards.length} thẻ · 🟢 Đã nhớ ${knownCount} · 🔴 Chưa nhớ ${unknownCount}`}
        backTo={`/lessons/${lessonId}`}
      />

      <div className="flip-grid">
        {cards.map((card) => {
          const isFlipped = !!flipped[card.id];
          const st = status[card.id];
          return (
            <div
              key={card.id}
              className={`flip-tile ${st ? `flip-tile-${st}` : ''}`}
              onClick={() => toggleFlip(card.id)}
              role="button"
              tabIndex={0}
            >
              <div className={`flip-tile-inner ${isFlipped ? 'is-flipped' : ''}`}>
                <div className="flip-tile-face flip-tile-front">
                  <span className="cn flip-tile-hanzi">{card.hanzi}</span>
                  <button
                    type="button"
                    className="flip-tile-speak"
                    onClick={(e) => { e.stopPropagation(); speak(card.hanzi); }}
                  >
                    <Volume2 size={14} />
                  </button>
                </div>
                <div className="flip-tile-face flip-tile-back">
                  {showPinyin && <div className="flip-tile-pinyin">{card.pinyin}</div>}
                  <div className="flip-tile-meaning">{card.meaningVi}</div>
                  {card.type && <span className="flip-tile-type">{card.type}</span>}
                  <div className="flip-tile-marks">
                    <button type="button" className="flip-tile-mark-btn" onClick={(e) => mark(e, card.id, 'unknown')} aria-label="Chưa nhớ">✗</button>
                    <button type="button" className="flip-tile-mark-btn" onClick={(e) => mark(e, card.id, 'known')} aria-label="Đã nhớ">✓</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
