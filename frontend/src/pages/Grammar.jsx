import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import api from '../api/client';
import Hanzi from '../components/Hanzi';
import ExerciseRunner from '../components/ExerciseRunner';
import ProtectedContent from '../components/ProtectedContent';
import PageHeader from '../components/PageHeader';

export default function Grammar() {
  const { lessonId } = useParams();
  const [points, setPoints] = useState([]);
  const [tab, setTab] = useState('list');

  useEffect(() => {
    api.get('/grammar', { params: { lessonId } }).then((res) => setPoints(res.data));
  }, [lessonId]);

  const exerciseItems = points.flatMap((gp) => (gp.exercises || []).map((ex, idx) => ({
    id: `${gp.id}-${idx}`,
    reviewId: gp.id,
    promptType: 'text',
    prompt: ex.question,
    options: ex.options.map((label, i) => ({ id: String(i), label })),
    answerId: String(ex.answerIndex),
    explanation: ex.explanation
  })));

  return (
    <div>
      <PageHeader
        icon={GraduationCap}
        color="#2563EB"
        title="Ngữ pháp"
        subtitle={`${points.length} cấu trúc trong bài học này`}
        backTo={`/lessons/${lessonId}`}
      />

      <div className="tabs">
        <button type="button" className={`tab-btn ${tab === 'list' ? 'active' : ''}`} onClick={() => setTab('list')}>Bài học</button>
        <button type="button" className={`tab-btn ${tab === 'exercise' ? 'active' : ''}`} onClick={() => setTab('exercise')}>Bài tập</button>
      </div>

      {tab === 'list' && (
        <ProtectedContent>
          {points.map((gp) => (
            <div key={gp.id} className="card grammar-block">
              <div className="grammar-structure"><span className="grammar-num">1</span>Cấu trúc: {gp.structure}</div>
              <div className="grammar-usage"><span className="grammar-num">2</span>Cách dùng: {gp.usageVi}</div>
              <div className="grammar-example">
                <span className="grammar-num grammar-num-gold">3</span>Ví dụ:
                <div style={{ marginTop: 8 }}><Hanzi hanzi={gp.example.hanzi} pinyin={gp.example.pinyin} meaning={gp.example.vi} /></div>
              </div>
              {gp.notes && (
                <div className="grammar-note"><span className="grammar-num grammar-num-gold">4</span>Lưu ý: {gp.notes}</div>
              )}
            </div>
          ))}
          {points.length === 0 && <p className="empty-state">Chưa có nội dung ngữ pháp cho bài học này.</p>}
        </ProtectedContent>
      )}

      {tab === 'exercise' && (
        <ExerciseRunner items={exerciseItems} lessonId={lessonId} moduleKey="grammar" itemType="grammar" />
      )}
    </div>
  );
}
