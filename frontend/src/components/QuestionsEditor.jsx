import { ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';

/**
 * Soạn câu hỏi trắc nghiệm bằng form thay cho gõ JSON. Dữ liệu vẫn lưu đúng định dạng cũ:
 * [{ [questionKey]: '...', options: [...], answerIndex, explanation }] (+ extra cố định,
 * vd. { type: 'mcq' } cho bài tập ngữ pháp) nên các trang học không cần đổi.
 */
export default function QuestionsEditor({ value, onChange, questionKey = 'q', extra = {} }) {
  const items = Array.isArray(value) ? value : [];
  const set = (next) => onChange(next);
  const update = (i, patch) => set(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    set(next);
  };
  const add = () => set([...items, { ...extra, [questionKey]: '', options: ['', ''], answerIndex: 0, explanation: '' }]);

  const setOption = (i, oi, text) => {
    const options = [...(items[i].options || [])];
    options[oi] = text;
    update(i, { options });
  };
  const addOption = (i) => update(i, { options: [...(items[i].options || []), ''] });
  const removeOption = (i, oi) => {
    const it = items[i];
    const options = it.options.filter((_, idx) => idx !== oi);
    let answerIndex = it.answerIndex ?? 0;
    if (oi === answerIndex) answerIndex = 0;
    else if (oi < answerIndex) answerIndex -= 1;
    update(i, { options, answerIndex });
  };

  return (
    <div className="q-editor">
      {items.length === 0 && <p className="q-editor-empty">Chưa có câu hỏi nào.</p>}
      {items.map((it, i) => (
        <div key={i} className="q-editor-item">
          <div className="q-editor-head">
            <b>Câu {i + 1}</b>
            <span className="q-editor-tools">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Lên"><ArrowUp size={14} /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} title="Xuống"><ArrowDown size={14} /></button>
              <button type="button" className="danger" onClick={() => set(items.filter((_, idx) => idx !== i))} title="Xoá câu hỏi"><Trash2 size={14} /></button>
            </span>
          </div>
          <input
            className="q-editor-question"
            value={it[questionKey] || ''}
            onChange={(e) => update(i, { [questionKey]: e.target.value })}
            placeholder="Nội dung câu hỏi"
          />
          <div className="q-editor-options">
            {(it.options || []).map((opt, oi) => (
              <label key={oi} className={`q-editor-option ${it.answerIndex === oi ? 'correct' : ''}`}>
                <input type="radio" name={`q-${i}-answer`} checked={it.answerIndex === oi} onChange={() => update(i, { answerIndex: oi })} title="Đánh dấu là đáp án đúng" />
                <input value={opt} onChange={(e) => setOption(i, oi, e.target.value)} placeholder={`Đáp án ${String.fromCharCode(65 + oi)}`} />
                {(it.options || []).length > 2 && (
                  <button type="button" onClick={() => removeOption(i, oi)} title="Bỏ đáp án"><X size={14} /></button>
                )}
              </label>
            ))}
            <button type="button" className="q-editor-add-option" onClick={() => addOption(i)}><Plus size={13} /> Thêm đáp án</button>
          </div>
          <input
            value={it.explanation || ''}
            onChange={(e) => update(i, { explanation: e.target.value })}
            placeholder="Giải thích (hiện sau khi trả lời, không bắt buộc)"
          />
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={add}><Plus size={14} /> Thêm câu hỏi</button>
      <span className="q-editor-hint">Chọn nút tròn bên trái để đánh dấu đáp án đúng.</span>
    </div>
  );
}
