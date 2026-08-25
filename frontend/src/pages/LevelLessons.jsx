import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';
import ProgressBar from '../components/ProgressBar';

export default function LevelLessons() {
  const { levelId } = useParams();
  const [level, setLevel] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [summaries, setSummaries] = useState({});

  useEffect(() => {
    api.get(`/levels/${levelId}`).then((res) => setLevel(res.data));
    api.get('/lessons', { params: { levelId } }).then(async (res) => {
      const sorted = [...res.data].sort((a, b) => a.order - b.order);
      setLessons(sorted);
      const entries = await Promise.all(sorted.map(async (l) => {
        try {
          const r = await api.get(`/progress/${l.id}/summary`);
          return [l.id, r.data.overallPercent];
        } catch (e) {
          return [l.id, 0];
        }
      }));
      setSummaries(Object.fromEntries(entries));
    });
  }, [levelId]);

  return (
    <div>
      <Link to="/" className="top-back-link">← Chọn cấp độ khác</Link>
      <h1 className="page-title">{level ? level.name : '...'}</h1>
      {lessons.map((lesson) => (
        <Link to={`/lessons/${lesson.id}`} key={lesson.id} className="lesson-row">
          <span className="lesson-row-num">{String(lesson.order).padStart(2, '0')}</span>
          <div className="lesson-row-main">
            <div className="lesson-row-title">{lesson.title}</div>
            <div className="lesson-row-desc">{lesson.description}</div>
          </div>
          <div style={{ width: 84, flexShrink: 0 }}>
            <ProgressBar percent={summaries[lesson.id] || 0} />
          </div>
        </Link>
      ))}
      {lessons.length === 0 && <p className="empty-state">Chưa có bài học trong cấp độ này.</p>}
    </div>
  );
}
