import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import api from '../api/client';
import Hanzi from '../components/Hanzi';
import ExerciseRunner from '../components/ExerciseRunner';
import ProtectedContent from '../components/ProtectedContent';
import AuthImage from '../components/AuthImage';
import PageHeader from '../components/PageHeader';

const EXERCISE_TYPES = [
  { key: 'vocab-cn-vi', label: 'Trung → Việt' },
  { key: 'vocab-vi-cn', label: 'Việt → Trung' },
  { key: 'pinyin-hanzi', label: 'Pinyin → Hán tự' },
  { key: 'listen-choose', label: 'Nghe → chọn từ' }
];

export default function Vocabulary() {
  const { lessonId } = useParams();
  const [words, setWords] = useState([]);
  const [tab, setTab] = useState('list');
  const [exerciseItems, setExerciseItems] = useState(null);

  useEffect(() => {
    api.get('/words', { params: { lessonId } }).then((res) => setWords(res.data));
  }, [lessonId]);

  const loadExercise = (type) => {
    setTab(type);
    setExerciseItems(null);
    api.get(`/exercises/${lessonId}/${type}`, { params: { count: 10 } }).then((res) => {
      const normalized = res.data.items.map((it) => ({
        ...it,
        promptType: type === 'vocab-cn-vi' ? 'hanzi' : (type === 'listen-choose' ? 'listen' : 'text'),
        reviewId: it.id
      }));
      setExerciseItems(normalized);
    });
  };

  return (
    <div>
      <PageHeader
        icon={BookOpen}
        color="#DC2626"
        title="Từ vựng"
        subtitle={`${words.length} từ trong bài học này`}
        backTo={`/lessons/${lessonId}`}
      />

      <div className="tabs">
        <button type="button" className={`tab-btn ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>Danh sách từ</button>
        {EXERCISE_TYPES.map((t) => (
          <button key={t.key} type="button" className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => loadExercise(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'list' && (
        <ProtectedContent>
          <div className="word-grid">
            {words.map((w) => (
              <div key={w.id} className="card word-card">
                {w.imageUrl && <AuthImage className="word-card-img" src={w.imageUrl} alt={w.meaningVi} />}
                <div className="word-card-body">
                  <Hanzi hanzi={w.hanzi} pinyin={w.pinyin} meaning={w.meaningVi} />
                  <div className="word-card-type">{w.type}</div>
                  {w.example && (
                    <div className="word-card-example">
                      <Hanzi hanzi={w.example.hanzi} pinyin={w.example.pinyin} meaning={w.example.vi} size="sm" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {words.length === 0 && <p className="empty-state">Chưa có từ vựng cho bài học này.</p>}
        </ProtectedContent>
      )}

      {tab !== 'list' && (
        exerciseItems ? (
          <ExerciseRunner items={exerciseItems} lessonId={lessonId} moduleKey="vocab" itemType="word" />
        ) : <p className="empty-state">Đang tải bài tập...</p>
      )}
    </div>
  );
}
