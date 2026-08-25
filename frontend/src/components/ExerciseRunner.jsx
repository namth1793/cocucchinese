import { useState } from 'react';
import api from '../api/client';
import Hanzi from './Hanzi';
import { speak } from '../utils/speak';

/**
 * Bộ máy bài tập trắc nghiệm dùng chung: nhận vào 1 mảng "items" đã chuẩn hoá
 * {id, reviewId?, promptType, prompt, pinyin?, tts?, options:[{id,label,pinyin?}], answerId, explanation}
 * và tái sử dụng cho Từ vựng, Ngữ pháp, Đọc, Nghe... Sau mỗi câu hiển thị Đúng/Sai -> Đáp án -> Giải thích,
 * đồng thời lưu lại các câu/từ sai để đưa vào hệ thống Ôn tập.
 */
export default function ExerciseRunner({ items, lessonId, moduleKey, itemType, title, onFinish }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!items || items.length === 0) {
    return <p className="empty-state">Chưa có dữ liệu bài tập cho phần này.</p>;
  }

  if (finished) {
    const percent = Math.round((correctCount / items.length) * 100);
    return (
      <div className="exercise-result card">
        <h3>Kết quả: {correctCount}/{items.length} ({percent}%)</h3>
        <button
          type="button"
          className="btn-primary"
          onClick={() => { setIndex(0); setSelected(null); setCorrectCount(0); setFinished(false); }}
        >
          Làm lại
        </button>
      </div>
    );
  }

  const item = items[index];

  const choose = async (opt) => {
    if (selected) return;
    setSelected(opt);
    const correct = opt.id === item.answerId;
    if (correct) setCorrectCount((c) => c + 1);
    try {
      await api.post('/exercises/submit', {
        lessonId, module: moduleKey, itemId: item.reviewId || item.id, itemType, correct
      });
    } catch (e) { /* giữ trải nghiệm mượt dù mạng chập chờn */ }
  };

  const next = () => {
    if (index + 1 >= items.length) {
      const percent = Math.round((correctCount / items.length) * 100);
      api.post(`/progress/${lessonId}/complete-module`, { module: moduleKey }).catch(() => {});
      if (onFinish) onFinish(percent);
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setSelected(null);
    }
  };

  return (
    <div className="exercise-runner card">
      {title && <h3>{title}</h3>}
      <div className="exercise-progress-dots">
        {items.map((_, i) => (
          <span key={i} className={i < index ? 'dot-done' : i === index ? 'dot-current' : ''} />
        ))}
      </div>
      <div className="exercise-progress">Câu {index + 1}/{items.length}</div>

      <div className="exercise-prompt">
        {item.tts && (
          <button type="button" className="listen-big-btn" onClick={() => speak(item.tts)}>🔊 Nghe</button>
        )}
        {item.promptType === 'hanzi' && <Hanzi hanzi={item.prompt} pinyin={item.pinyin} showMeaning={false} size="lg" />}
        {item.promptType === 'text' && <p className="exercise-prompt-text">{item.prompt}</p>}
      </div>

      <div className="exercise-options">
        {item.options.map((opt) => {
          let cls = 'option-btn';
          if (selected) {
            if (opt.id === item.answerId) cls += ' correct';
            else if (opt.id === selected.id) cls += ' wrong';
          }
          return (
            <button key={opt.id} type="button" className={cls} disabled={!!selected} onClick={() => choose(opt)}>
              {opt.label}{opt.pinyin ? ` (${opt.pinyin})` : ''}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className={`exercise-feedback ${selected.id === item.answerId ? 'ok' : 'no'}`}>
          <div className="exercise-feedback-title">{selected.id === item.answerId ? '✅ Chính xác!' : '❌ Chưa đúng.'}</div>
          <div className="exercise-explain">{item.explanation}</div>
          <button type="button" className="btn-primary" onClick={next}>
            {index + 1 >= items.length ? 'Hoàn thành' : 'Câu tiếp theo →'}
          </button>
        </div>
      )}
    </div>
  );
}
