import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Repeat, Volume2 } from 'lucide-react';
import api from '../api/client';
import Hanzi from '../components/Hanzi';
import PageHeader from '../components/PageHeader';
import { speak } from '../utils/speak';

export default function Translate() {
  const { lessonId } = useParams();
  const [sentences, setSentences] = useState([]);
  const [direction, setDirection] = useState('vi-cn');
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get('/sentences', { params: { lessonId } }).then((res) => setSentences(res.data));
  }, [lessonId]);

  if (sentences.length === 0) {
    return (
      <div>
        <PageHeader icon={Repeat} color="#DB2777" title="Luyện dịch" backTo={`/lessons/${lessonId}`} />
        <p className="empty-state">Chưa có câu để luyện dịch.</p>
      </div>
    );
  }

  const sentence = sentences[index];

  const submit = () => setSubmitted(true);

  const selfAssess = async (correct) => {
    await api.post('/exercises/submit', { lessonId, module: 'translate', itemId: sentence.id, itemType: 'sentence', correct });
    if (index + 1 >= sentences.length) {
      await api.post(`/progress/${lessonId}/complete-module`, { module: 'translate' });
    } else {
      setIndex((i) => i + 1);
    }
    setAnswer('');
    setSubmitted(false);
  };

  return (
    <div>
      <PageHeader
        icon={Repeat}
        color="#DB2777"
        title="Luyện dịch"
        subtitle="Không cần dịch giống 100% mẫu — hiểu đúng nghĩa là được"
        backTo={`/lessons/${lessonId}`}
      />

      <div className="tabs">
        <button type="button" className={`tab-btn ${direction === 'vi-cn' ? 'active' : ''}`} onClick={() => { setDirection('vi-cn'); setSubmitted(false); setAnswer(''); }}>Việt → Trung</button>
        <button type="button" className={`tab-btn ${direction === 'cn-vi' ? 'active' : ''}`} onClick={() => { setDirection('cn-vi'); setSubmitted(false); setAnswer(''); }}>Trung → Việt</button>
      </div>

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
          <button type="button" className="btn-primary btn-block" style={{ marginTop: 10 }} disabled={!answer.trim()} onClick={submit}>
            Xem đáp án tham khảo
          </button>
        ) : (
          <div className="translate-answer">
            <p style={{ fontWeight: 700, marginBottom: 6 }}>Đáp án tham khảo:</p>
            <Hanzi hanzi={sentence.hanzi} pinyin={sentence.pinyin} meaning={sentence.vi} />
            <button type="button" className="btn-secondary" style={{ marginTop: 8 }} onClick={() => speak(sentence.hanzi)}><Volume2 size={14} /> Nghe</button>
            <p style={{ marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>
              Không cần giống 100% đáp án mẫu — hãy tự so sánh ý nghĩa với bản dịch của bạn.
            </p>
            <div className="flashcard-actions" style={{ marginTop: 12 }}>
              <button type="button" className="fc-btn fc-unknown" onClick={() => selfAssess(false)}>Tôi dịch chưa đúng</button>
              <button type="button" className="fc-btn fc-known" onClick={() => selfAssess(true)}>Tôi dịch đúng</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
