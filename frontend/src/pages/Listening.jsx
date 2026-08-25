import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Headphones } from 'lucide-react';
import api from '../api/client';
import ExerciseRunner from '../components/ExerciseRunner';
import PageHeader from '../components/PageHeader';

function sentencesToItems(sentences) {
  return sentences.flatMap((s) => (s.questions || []).map((q, idx) => ({
    id: `${s.id}-q${idx}`,
    reviewId: s.id,
    promptType: 'listen',
    tts: s.hanzi,
    options: q.options.map((label, i) => ({ id: String(i), label })),
    answerId: String(q.answerIndex),
    explanation: q.explanation
  })));
}

export default function Listening() {
  const { lessonId } = useParams();
  const [tab, setTab] = useState('meaning');
  const [meaningItems, setMeaningItems] = useState(null);
  const [dialogueItems, setDialogueItems] = useState(null);
  const [wordItems, setWordItems] = useState(null);

  useEffect(() => {
    api.get('/sentences', { params: { lessonId, category: 'listening' } }).then((res) => setMeaningItems(sentencesToItems(res.data)));
    api.get('/sentences', { params: { lessonId, category: 'dialogue' } }).then((res) => setDialogueItems(sentencesToItems(res.data)));
    api.get(`/exercises/${lessonId}/listen-choose`, { params: { count: 8 } }).then((res) => {
      setWordItems(res.data.items.map((it) => ({ ...it, promptType: 'listen', reviewId: it.id })));
    });
  }, [lessonId]);

  return (
    <div>
      <PageHeader icon={Headphones} color="#059669" title="Luyện nghe" subtitle="Nghe và chọn đáp án đúng" backTo={`/lessons/${lessonId}`} />

      <div className="tabs">
        <button type="button" className={`tab-btn ${tab === 'meaning' ? 'active' : ''}`} onClick={() => setTab('meaning')}>Nghe → chọn nghĩa</button>
        <button type="button" className={`tab-btn ${tab === 'word' ? 'active' : ''}`} onClick={() => setTab('word')}>Nghe → chọn chữ Hán</button>
        <button type="button" className={`tab-btn ${tab === 'dialogue' ? 'active' : ''}`} onClick={() => setTab('dialogue')}>Nghe hội thoại</button>
      </div>

      {tab === 'meaning' && (meaningItems
        ? <ExerciseRunner items={meaningItems} lessonId={lessonId} moduleKey="listening" itemType="sentence" />
        : <p className="empty-state">Đang tải...</p>)}

      {tab === 'word' && (wordItems
        ? <ExerciseRunner items={wordItems} lessonId={lessonId} moduleKey="listening" itemType="word" />
        : <p className="empty-state">Đang tải...</p>)}

      {tab === 'dialogue' && (dialogueItems
        ? <ExerciseRunner items={dialogueItems} lessonId={lessonId} moduleKey="listening" itemType="sentence" title="Nghe hội thoại rồi trả lời câu hỏi" />
        : <p className="empty-state">Đang tải...</p>)}
    </div>
  );
}
