import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BookText, Volume2 } from 'lucide-react';
import api from '../api/client';
import Hanzi from '../components/Hanzi';
import ExerciseRunner from '../components/ExerciseRunner';
import TokenSentenceGame from '../components/TokenSentenceGame';
import ProtectedContent from '../components/ProtectedContent';
import PageHeader from '../components/PageHeader';
import { speak } from '../utils/speak';

export default function Reading() {
  const { lessonId } = useParams();
  const [sentences, setSentences] = useState([]);
  const [tab, setTab] = useState('read');

  useEffect(() => {
    api.get('/sentences', { params: { lessonId, category: 'reading' } }).then((res) => setSentences(res.data));
  }, [lessonId]);

  const readAll = () => {
    sentences.forEach((s, i) => setTimeout(() => speak(s.hanzi), i * 1800));
  };

  const questionItems = sentences.flatMap((s) => (s.questions || []).map((q, idx) => ({
    id: `${s.id}-q${idx}`,
    reviewId: s.id,
    promptType: 'text',
    prompt: q.q,
    options: q.options.map((label, i) => ({ id: String(i), label })),
    answerId: String(q.answerIndex),
    explanation: q.explanation
  })));

  return (
    <div>
      <PageHeader
        icon={BookText}
        color="#0D9488"
        title="Luyện đọc"
        subtitle={`${sentences.length} câu trong bài đọc`}
        backTo={`/lessons/${lessonId}`}
      />

      <div className="tabs">
        <button type="button" className={`tab-btn ${tab === 'read' ? 'active' : ''}`} onClick={() => setTab('read')}>Bài đọc</button>
        <button type="button" className={`tab-btn ${tab === 'question' ? 'active' : ''}`} onClick={() => setTab('question')}>Trả lời câu hỏi</button>
        <button type="button" className={`tab-btn ${tab === 'arrange' ? 'active' : ''}`} onClick={() => setTab('arrange')}>Sắp xếp câu</button>
      </div>

      {tab === 'read' && (
        <ProtectedContent>
          {sentences.length > 0 && (
            <div className="card">
              <button type="button" className="listen-big-btn" onClick={readAll}><Volume2 size={18} /> Nghe toàn bài</button>
              {sentences.map((s, i) => (
                <div key={s.id} className="sentence-block">
                  <span className="sentence-num">{i + 1}</span>
                  <Hanzi hanzi={s.hanzi} pinyin={s.pinyin} meaning={s.vi} />
                </div>
              ))}
            </div>
          )}
          {sentences.length === 0 && <p className="empty-state">Chưa có bài đọc cho bài học này.</p>}
        </ProtectedContent>
      )}

      {tab === 'question' && <ExerciseRunner items={questionItems} lessonId={lessonId} moduleKey="reading" itemType="sentence" />}

      {tab === 'arrange' && <TokenSentenceGame lessonId={lessonId} type="arrange" moduleKey="reading" />}
    </div>
  );
}
