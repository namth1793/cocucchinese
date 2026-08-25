import { useEffect, useState } from 'react';
import api from '../api/client';

/**
 * Dùng chung cho "Sắp xếp câu" và "Xây câu": lấy dữ liệu câu đã sinh sẵn từ
 * /exercises/:lessonId/:type (arrange | build-sentence) và cho học sinh chạm chọn
 * từng chữ theo đúng thứ tự để ghép thành câu hoàn chỉnh.
 */
export default function TokenSentenceGame({ lessonId, type, moduleKey, title }) {
  const [items, setItems] = useState(null);
  const [index, setIndex] = useState(0);
  const [pickedIdx, setPickedIdx] = useState([]);
  const [checked, setChecked] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    api.get(`/exercises/${lessonId}/${type}`, { params: { count: 8 } }).then((res) => setItems(res.data.items));
  }, [lessonId, type]);

  if (!items) return <p className="empty-state">Đang tải...</p>;
  if (items.length === 0) return <p className="empty-state">Chưa có dữ liệu câu cho bài học này.</p>;

  if (finished) {
    const percent = Math.round((correctCount / items.length) * 100);
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h3>Kết quả: {correctCount}/{items.length} ({percent}%)</h3>
        <button
          type="button"
          className="btn-primary"
          onClick={() => { setIndex(0); setPickedIdx([]); setChecked(null); setCorrectCount(0); setFinished(false); }}
        >
          Chơi lại
        </button>
      </div>
    );
  }

  const item = items[index];

  const pick = (i) => { if (checked === null) setPickedIdx((p) => [...p, i]); };
  const unpick = (pos) => { if (checked === null) setPickedIdx((p) => p.filter((_, idx2) => idx2 !== pos)); };

  const check = async () => {
    const answer = pickedIdx.map((i) => item.tokens[i]);
    const isCorrect = answer.length === item.answerTokens.length && answer.every((t, i) => t === item.answerTokens[i]);
    setChecked(isCorrect);
    if (isCorrect) setCorrectCount((c) => c + 1);
    try {
      await api.post('/exercises/submit', { lessonId, module: moduleKey, itemId: item.id, itemType: 'sentence', correct: isCorrect });
    } catch (e) { /* ignore */ }
  };

  const next = () => {
    if (index + 1 >= items.length) {
      api.post(`/progress/${lessonId}/complete-module`, { module: moduleKey }).catch(() => {});
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setPickedIdx([]);
      setChecked(null);
    }
  };

  const available = item.tokens.map((t, i) => ({ t, i })).filter(({ i }) => !pickedIdx.includes(i));

  return (
    <div className="card">
      {title && <h3>{title}</h3>}
      <div className="exercise-progress-dots">
        {items.map((_, i) => (
          <span key={i} className={i < index ? 'dot-done' : i === index ? 'dot-current' : ''} />
        ))}
      </div>
      <div className="exercise-progress">Câu {index + 1}/{items.length}</div>
      <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Xây câu có nghĩa: <strong>{item.meaningVi}</strong></p>

      <div className="arrange-answer-row">
        {pickedIdx.length === 0 && <span style={{ color: 'var(--muted)', fontSize: 13 }}>Chạm vào các chữ bên dưới theo đúng thứ tự</span>}
        {pickedIdx.map((i, pos) => (
          <button key={pos} type="button" className="token-chip picked" onClick={() => unpick(pos)}>{item.tokens[i]}</button>
        ))}
      </div>

      <div className="arrange-tokens">
        {available.map(({ t, i }) => (
          <button key={i} type="button" className="token-chip" onClick={() => pick(i)}>{t}</button>
        ))}
      </div>

      {checked === null ? (
        <button type="button" className="btn-primary btn-block" disabled={pickedIdx.length === 0} onClick={check}>Kiểm tra</button>
      ) : (
        <div className={`exercise-feedback ${checked ? 'ok' : 'no'}`}>
          <div className="exercise-feedback-title">{checked ? '✅ Chính xác!' : '❌ Chưa đúng.'}</div>
          <div className="exercise-explain">
            Đáp án: {item.answerTokens.join('')} {item.pinyin ? `(${item.pinyin})` : ''} = {item.meaningVi}
          </div>
          <button type="button" className="btn-primary" onClick={next}>
            {index + 1 >= items.length ? 'Hoàn thành' : 'Câu tiếp theo →'}
          </button>
        </div>
      )}
    </div>
  );
}
