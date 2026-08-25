import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Zap, Timer, Star, Trophy } from 'lucide-react';
import api from '../../api/client';
import PageHeader from '../../components/PageHeader';

const TIME_LIMIT = 10;

export default function QuizGame() {
  const { lessonId } = useParams();
  const [items, setItems] = useState(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [finished, setFinished] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get(`/exercises/${lessonId}/vocab-cn-vi`, { params: { count: 10 } }).then((res) => setItems(res.data.items));
  }, [lessonId]);

  useEffect(() => {
    if (!items || finished || selected) return undefined;
    setTimeLeft(TIME_LIMIT);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          answer(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, items]);

  if (!items) return <p className="empty-state">Đang tải...</p>;
  if (items.length === 0) return <p className="empty-state">Chưa có đủ từ vựng để chơi.</p>;

  const item = items[index];

  const answer = async (opt) => {
    if (selected) return;
    clearInterval(timerRef.current);
    setSelected(opt || { id: '__timeout__' });
    const correct = opt && opt.id === item.answerId;
    if (correct) {
      setScore((s) => s + 10 + timeLeft);
      setCorrectCount((c) => c + 1);
    }
    try {
      await api.post('/exercises/submit', { lessonId, module: 'game', itemId: item.id, itemType: 'word', correct: !!correct });
    } catch (e) { /* ignore */ }
  };

  const next = () => {
    if (index + 1 >= items.length) {
      api.post(`/progress/${lessonId}/complete-module`, { module: 'game' }).catch(() => {});
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  if (finished) {
    return (
      <div>
        <PageHeader icon={Zap} color="#D97706" title="Chọn nhanh" backTo={`/lessons/${lessonId}/games`} backLabel="Chọn game khác" />
        <div className="card" style={{ textAlign: 'center' }}>
          <h3><Trophy size={20} style={{ verticalAlign: -4, marginRight: 6 }} />Điểm: {score}</h3>
          <p>Đúng {correctCount}/{items.length} câu</p>
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>Chơi lại</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={Zap}
        color="#D97706"
        title="Chọn nhanh"
        backTo={`/lessons/${lessonId}/games`}
        backLabel="Chọn game khác"
        right={(
          <div className="badges-row" style={{ margin: 0 }}>
            <span className="timer-badge"><Timer size={13} /> {timeLeft}s</span>
            <span className="score-badge"><Star size={13} /> {score} điểm</span>
          </div>
        )}
      />
      <div className="card">
        <div className="exercise-progress">Câu {index + 1}/{items.length}</div>
        <p className="exercise-prompt-text" style={{ textAlign: 'center' }}>{item.prompt}</p>
        <div className="exercise-options">
          {item.options.map((opt) => {
            let cls = 'option-btn';
            if (selected) {
              if (opt.id === item.answerId) cls += ' correct';
              else if (selected.id === opt.id) cls += ' wrong';
            }
            return (
              <button key={opt.id} type="button" className={cls} disabled={!!selected} onClick={() => answer(opt)}>
                {opt.label}
              </button>
            );
          })}
        </div>
        {selected && (
          <div className={`exercise-feedback ${selected.id === item.answerId ? 'ok' : 'no'}`}>
            <div className="exercise-feedback-title">
              {selected.id === '__timeout__' ? '⏰ Hết giờ!' : (selected.id === item.answerId ? '✅ Chính xác!' : '❌ Chưa đúng.')}
            </div>
            <div className="exercise-explain">{item.explanation}</div>
            <button type="button" className="btn-primary" onClick={next}>
              {index + 1 >= items.length ? 'Hoàn thành' : 'Câu tiếp theo →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
