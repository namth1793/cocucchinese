import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PenLine, Volume2 } from 'lucide-react';
import api from '../api/client';
import Hanzi from '../components/Hanzi';
import TokenSentenceGame from '../components/TokenSentenceGame';
import PageHeader from '../components/PageHeader';
import { speak } from '../utils/speak';

function TranslatePractice({ lessonId, direction }) {
  const [sentences, setSentences] = useState(null);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get('/sentences', { params: { lessonId } }).then((res) => setSentences(res.data));
  }, [lessonId]);

  if (!sentences) return <p className="empty-state">Đang tải...</p>;
  if (sentences.length === 0) return <p className="empty-state">Chưa có câu để luyện dịch.</p>;

  const sentence = sentences[index];

  const selfAssess = async (correct) => {
    await api.post('/exercises/submit', { lessonId, module: 'writing', itemId: sentence.id, itemType: 'sentence', correct });
    if (index + 1 >= sentences.length) {
      await api.post(`/progress/${lessonId}/complete-module`, { module: 'writing' });
    } else {
      setIndex((i) => i + 1);
    }
    setAnswer('');
    setSubmitted(false);
  };

  return (
    <div className="card translate-box">
      <div className="exercise-progress-dots">
        {sentences.map((_, i) => (
          <span key={i} className={i < index ? 'dot-done' : i === index ? 'dot-current' : ''} />
        ))}
      </div>
      <div className="exercise-progress">Câu {index + 1}/{sentences.length}</div>

      {direction === 'vi-cn' ? (
        <p className="exercise-prompt-text" style={{ textAlign: 'center' }}>“{sentence.vi}”</p>
      ) : (
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <Hanzi hanzi={sentence.hanzi} pinyin={sentence.pinyin} showMeaning={false} size="lg" />
        </div>
      )}

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder={direction === 'vi-cn' ? 'Nhập bản dịch tiếng Trung...' : 'Nhập bản dịch tiếng Việt...'}
      />

      {!submitted ? (
        <button type="button" className="btn-primary btn-block" style={{ marginTop: 10 }} disabled={!answer.trim()} onClick={() => setSubmitted(true)}>
          Xem đáp án tham khảo
        </button>
      ) : (
        <div className="translate-answer">
          <p style={{ fontWeight: 700, marginBottom: 6 }}>Đáp án tham khảo:</p>
          <Hanzi hanzi={sentence.hanzi} pinyin={sentence.pinyin} meaning={sentence.vi} />
          <button type="button" className="btn-secondary" style={{ marginTop: 8 }} onClick={() => speak(sentence.hanzi)}><Volume2 size={14} /> Nghe</button>
          <p style={{ marginTop: 12, fontSize: 13, color: 'var(--ink-soft)' }}>
            Không cần giống 100% đáp án mẫu — hãy tự so sánh ý nghĩa với bản dịch của bạn.
          </p>
          <div className="flashcard-actions" style={{ marginTop: 12 }}>
            <button type="button" className="fc-btn fc-unknown" onClick={() => selfAssess(false)}>Tôi dịch chưa đúng</button>
            <button type="button" className="fc-btn fc-known" onClick={() => selfAssess(true)}>Tôi dịch đúng</button>
          </div>
        </div>
      )}
    </div>
  );
}

function FillPractice({ lessonId }) {
  const [items, setItems] = useState(null);
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [checked, setChecked] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    api.get('/fill', { params: { lessonId } }).then((res) => setItems(res.data));
  }, [lessonId]);

  if (!items) return <p className="empty-state">Đang tải...</p>;
  if (items.length === 0) return <p className="empty-state">Chưa có bài điền từ cho bài học này.</p>;

  if (finished) {
    const percent = Math.round((correctCount / items.length) * 100);
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h3>Kết quả: {correctCount}/{items.length} ({percent}%)</h3>
        <button
          type="button"
          className="btn-primary"
          onClick={() => { setIndex(0); setValue(''); setChecked(null); setCorrectCount(0); setFinished(false); }}
        >
          Làm lại
        </button>
      </div>
    );
  }

  const item = items[index];

  const check = async () => {
    if (!value.trim() || checked !== null) return;
    const isCorrect = (item.alts || [item.blank]).includes(value.trim());
    setChecked(isCorrect);
    if (isCorrect) setCorrectCount((c) => c + 1);
    try {
      await api.post('/exercises/submit', { lessonId, module: 'writing', itemId: item.id, itemType: 'word', correct: isCorrect });
    } catch (e) { /* ignore */ }
  };

  const next = async () => {
    if (index + 1 >= items.length) {
      await api.post(`/progress/${lessonId}/complete-module`, { module: 'writing' });
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setValue('');
      setChecked(null);
    }
  };

  return (
    <div className="card">
      <div className="exercise-progress-dots">
        {items.map((_, i) => (
          <span key={i} className={i < index ? 'dot-done' : i === index ? 'dot-current' : ''} />
        ))}
      </div>
      <div className="exercise-progress">Câu {index + 1}/{items.length}</div>
      {item.hint && <p style={{ textAlign: 'center', color: 'var(--ink-soft)', fontSize: 13 }}>Điền từ: {item.hint}</p>}

      <div className="cn" style={{ fontSize: 20, textAlign: 'center', margin: '14px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span>{item.pre}</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={checked !== null}
          maxLength={6}
          style={{
            width: 70, textAlign: 'center', fontFamily: 'var(--font-cn)', fontSize: 20,
            border: `1.5px solid ${checked === null ? 'var(--line-strong)' : checked ? 'var(--correct)' : 'var(--wrong)'}`,
            borderRadius: 8, padding: '4px 6px'
          }}
        />
        <span>{item.post}</span>
      </div>

      {checked === null ? (
        <button type="button" className="btn-primary btn-block" disabled={!value.trim()} onClick={check}>Kiểm tra</button>
      ) : (
        <div className={`exercise-feedback ${checked ? 'ok' : 'no'}`}>
          <div className="exercise-feedback-title">{checked ? '✅ Đúng!' : '❌ Sai.'}</div>
          <div className="exercise-explain">Đáp án: <span className="cn" style={{ fontWeight: 700 }}>{item.blank}</span></div>
          <button type="button" className="btn-primary" onClick={next}>
            {index + 1 >= items.length ? 'Hoàn thành' : 'Câu tiếp theo →'}
          </button>
        </div>
      )}
    </div>
  );
}

const TABS = [
  { key: 'arrange', label: 'Sắp xếp câu' },
  { key: 'vi-cn', label: 'Dịch Việt → Trung' },
  { key: 'cn-vi', label: 'Dịch Trung → Việt' },
  { key: 'fill', label: 'Điền từ' }
];

export default function Writing() {
  const { lessonId } = useParams();
  const [tab, setTab] = useState('arrange');

  return (
    <div>
      <PageHeader icon={PenLine} color="#DB2777" title="Luyện viết" subtitle="Sắp xếp câu, dịch và điền từ" backTo={`/lessons/${lessonId}`} />

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'arrange' && <TokenSentenceGame key="arrange" lessonId={lessonId} type="arrange" moduleKey="writing" />}
      {tab === 'vi-cn' && <TranslatePractice key="vi-cn" lessonId={lessonId} direction="vi-cn" />}
      {tab === 'cn-vi' && <TranslatePractice key="cn-vi" lessonId={lessonId} direction="cn-vi" />}
      {tab === 'fill' && <FillPractice key="fill" lessonId={lessonId} />}
    </div>
  );
}
