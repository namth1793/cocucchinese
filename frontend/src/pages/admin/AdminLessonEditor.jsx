import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import api from '../../api/client';
import AdminWords from './AdminWords';
import AdminCharacters from './AdminCharacters';
import AdminGrammar from './AdminGrammar';
import AdminDialogues from './AdminDialogues';
import AdminSentences from './AdminSentences';
import AdminSpeaking from './AdminSpeaking';
import AdminFill from './AdminFill';
import AdminSlides from './AdminSlides';
import AdminVideos from './AdminVideos';
import AdminSongs from './AdminSongs';
import AdminLessonLayout from './AdminLessonLayout';
import AdminHtmlPages from './AdminHtmlPages';
import AdminDocuments from './AdminDocuments';

const TABS = [
  { key: 'layout', label: 'Thông tin & bố cục', Component: AdminLessonLayout },
  { key: 'html', label: 'Bài học HTML', Component: AdminHtmlPages },
  { key: 'words', label: 'Từ vựng', Component: AdminWords },
  { key: 'characters', label: 'Chữ Hán', Component: AdminCharacters },
  { key: 'dialogues', label: 'Bài khoá', Component: AdminDialogues },
  { key: 'grammar', label: 'Ngữ pháp', Component: AdminGrammar },
  { key: 'sentences', label: 'Câu (đọc/nghe)', Component: AdminSentences },
  { key: 'speaking', label: 'Luyện nói', Component: AdminSpeaking },
  { key: 'fill', label: 'Điền từ', Component: AdminFill },
  { key: 'slides', label: 'PPT', Component: AdminSlides },
  { key: 'videos', label: 'Video', Component: AdminVideos },
  { key: 'songs', label: 'Bài hát', Component: AdminSongs },
  { key: 'docs', label: 'Tài liệu', Component: AdminDocuments }
];

export default function AdminLessonEditor() {
  const { levelId, lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  // Tab đang mở nằm trên URL (?tab=...) để tải lại trang/gửi link vẫn mở đúng tab.
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((t) => t.key === searchParams.get('tab')) ? searchParams.get('tab') : 'layout';
  const setTab = (key) => setSearchParams({ tab: key }, { replace: true });

  useEffect(() => {
    api.get(`/lessons/${lessonId}`).then((res) => setLesson(res.data));
  }, [lessonId]);

  const ActiveComponent = TABS.find((t) => t.key === tab).Component;

  return (
    <div>
      <Link to={`/admin/levels/${levelId}`} className="top-back-link"><ArrowLeft size={14} style={{ verticalAlign: -2, marginRight: 4 }} />Danh sách bài học</Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 6, marginBottom: 14 }}>
        <h2 style={{ margin: 0 }}>{lesson ? lesson.title : 'Đang tải...'}</h2>
        <a href={`/lessons/${lessonId}`} target="_blank" rel="noreferrer" className="btn-secondary" style={{ padding: '7px 12px' }}>
          <ExternalLink size={14} /> Xem như học viên
        </a>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.key} type="button" className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <ActiveComponent key={`${tab}-${lessonId}`} lessonId={lessonId} onSaved={setLesson} />
    </div>
  );
}
