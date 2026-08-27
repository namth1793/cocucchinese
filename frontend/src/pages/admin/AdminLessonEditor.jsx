import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import api from '../../api/client';
import AdminWords from './AdminWords';
import AdminGrammar from './AdminGrammar';
import AdminSentences from './AdminSentences';
import AdminSlides from './AdminSlides';
import AdminVideos from './AdminVideos';
import AdminSongs from './AdminSongs';

const TABS = [
  { key: 'words', label: 'Từ vựng', Component: AdminWords },
  { key: 'grammar', label: 'Ngữ pháp', Component: AdminGrammar },
  { key: 'sentences', label: 'Câu (đọc/nghe)', Component: AdminSentences },
  { key: 'slides', label: 'PPT', Component: AdminSlides },
  { key: 'videos', label: 'Video', Component: AdminVideos },
  { key: 'songs', label: 'Bài hát', Component: AdminSongs }
];

export default function AdminLessonEditor() {
  const { levelId, lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [tab, setTab] = useState('words');

  useEffect(() => {
    api.get(`/lessons/${lessonId}`).then((res) => setLesson(res.data));
  }, [lessonId]);

  const ActiveComponent = TABS.find((t) => t.key === tab).Component;

  return (
    <div>
      <Link to={`/admin/levels/${levelId}`} className="top-back-link"><ArrowLeft size={14} style={{ verticalAlign: -2, marginRight: 4 }} />Danh sách bài học</Link>
      <h2 style={{ marginTop: 6, marginBottom: 14 }}>{lesson ? lesson.title : 'Đang tải...'}</h2>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <ActiveComponent lessonId={lessonId} />
    </div>
  );
}
