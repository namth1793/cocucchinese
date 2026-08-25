import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Presentation, BookOpen, Layers, GraduationCap, Gamepad2, Headphones,
  BookText, Mic2, Repeat, Clapperboard, Music4, ChevronRight, Trophy
} from 'lucide-react';
import api from '../api/client';
import ProgressBar from '../components/ProgressBar';

const MODULES = [
  { key: 'ppt', icon: Presentation, label: 'PPT / Bài giảng', path: 'ppt', color: '#B91C1C' },
  { key: 'vocab', icon: BookOpen, label: 'Từ vựng', path: 'vocab', color: '#DC2626' },
  { key: 'flashcard', icon: Layers, label: 'Flashcard', path: 'flashcards', color: '#D97706' },
  { key: 'grammar', icon: GraduationCap, label: 'Ngữ pháp', path: 'grammar', color: '#2563EB' },
  { key: 'games', icon: Gamepad2, label: 'Game ôn tập', path: 'games', color: '#7C3AED' },
  { key: 'listening', icon: Headphones, label: 'Luyện nghe', path: 'listening', color: '#059669' },
  { key: 'reading', icon: BookText, label: 'Luyện đọc', path: 'reading', color: '#0D9488' },
  { key: 'shadowing', icon: Mic2, label: 'Shadowing', path: 'shadowing', color: '#EA580C' },
  { key: 'translate', icon: Repeat, label: 'Luyện dịch', path: 'translate', color: '#DB2777' },
  { key: 'video', icon: Clapperboard, label: 'Video tình huống', path: 'video', color: '#B91C1C' },
  { key: 'song', icon: Music4, label: 'Học qua bài hát', path: 'song', color: '#D97706' }
];

export default function LessonHome() {
  const { lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get(`/lessons/${lessonId}/full`).then((res) => setLesson(res.data.lesson));
    api.get(`/progress/${lessonId}/summary`).then((res) => setSummary(res.data));
  }, [lessonId]);

  return (
    <div>
      <Link to={lesson ? `/levels/${lesson.levelId}` : '/'} className="top-back-link">← Danh sách bài học</Link>
      <h1 className="page-title">{lesson ? lesson.title : '...'}</h1>
      {summary && <ProgressBar percent={summary.overallPercent} label="Tiến độ tổng" />}

      <div className="module-list" style={{ marginTop: 18 }}>
        {MODULES.map((m) => {
          const Icon = m.icon;
          return (
            <Link to={`/lessons/${lessonId}/${m.path}`} key={m.key} className="module-row">
              <span className="module-row-icon" style={{ background: m.color }}><Icon size={20} /></span>
              <span className="module-row-body">
                <span className="module-row-label">{m.label}</span>
              </span>
              <ChevronRight size={18} className="module-row-chevron" />
            </Link>
          );
        })}
      </div>

      <Link to={`/lessons/${lessonId}/result`} className="btn-primary btn-block" style={{ display: 'flex', textAlign: 'center', marginTop: 18 }}>
        <Trophy size={17} />
        Xem kết quả cuối bài
      </Link>
    </div>
  );
}
