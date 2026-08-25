import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { LayoutGrid, Timer, Repeat2 } from 'lucide-react';
import PlumBlossom from '../../components/PlumBlossom';
import PageHeader from '../../components/PageHeader';
import api from '../../api/client';

export default function MemoryGame() {
  const { lessonId } = useParams();
  const [cards, setCards] = useState(null);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get(`/exercises/${lessonId}/memory`, { params: { count: 6 } }).then((res) => setCards(res.data.items));
  }, [lessonId]);

  useEffect(() => {
    if (!cards) return;
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [cards]);

  useEffect(() => {
    if (cards && matched.length === cards.length && matched.length > 0) {
      clearInterval(timerRef.current);
      api.post(`/progress/${lessonId}/complete-module`, { module: 'game' }).catch(() => {});
    }
  }, [matched, cards, lessonId]);

  if (!cards) return <p className="empty-state">Đang tải...</p>;
  if (cards.length === 0) return <p className="empty-state">Chưa có đủ từ vựng để chơi Memory.</p>;

  const flip = (cardId) => {
    if (flipped.length === 2 || flipped.includes(cardId) || matched.includes(cardId)) return;
    const newFlipped = [...flipped, cardId];
    setFlipped(newFlipped);
    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      const [a, b] = newFlipped.map((id) => cards.find((c) => c.cardId === id));
      if (a.pairId === b.pairId) {
        setTimeout(() => { setMatched((m) => [...m, a.cardId, b.cardId]); setFlipped([]); }, 400);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  const finished = matched.length === cards.length;

  return (
    <div>
      <PageHeader
        icon={LayoutGrid}
        color="#7C3AED"
        title="Memory"
        backTo={`/lessons/${lessonId}/games`}
        backLabel="Chọn game khác"
        right={(
          <div className="badges-row" style={{ margin: 0 }}>
            <span className="timer-badge"><Timer size={13} /> {seconds}s</span>
            <span className="score-badge"><Repeat2 size={13} /> {moves} lượt lật</span>
          </div>
        )}
      />

      {finished ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <h3><PlumBlossom size={20} color="var(--primary)" style={{ verticalAlign: -4, marginRight: 6 }} />Hoàn thành trong {seconds}s với {moves} lượt lật!</h3>
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>Chơi lại</button>
        </div>
      ) : (
        <div className="memory-grid">
          {cards.map((c) => {
            const isFlipped = flipped.includes(c.cardId) || matched.includes(c.cardId);
            return (
              <button
                key={c.cardId}
                type="button"
                className={`memory-card ${isFlipped ? '' : 'hidden-face'} ${matched.includes(c.cardId) ? 'matched' : ''}`}
                onClick={() => flip(c.cardId)}
              >
                {isFlipped ? c.label : '?'}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
