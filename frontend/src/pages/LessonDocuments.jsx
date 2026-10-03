import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronRight, Paperclip } from 'lucide-react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import { openAuthFile } from '../utils/openAuthFile';

const formatSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};
const extOf = (name) => ((name || '').split('.').pop() || '').toUpperCase().slice(0, 4);

export default function LessonDocuments() {
  const { lessonId } = useParams();
  const [docs, setDocs] = useState(null);

  useEffect(() => {
    api.get('/lesson-documents', { params: { lessonId } })
      .then((res) => setDocs([...res.data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))))
      .catch(() => setDocs([]));
  }, [lessonId]);

  return (
    <div>
      <PageHeader icon={Paperclip} color="#475569" title="Tài liệu đính kèm" subtitle="Tài liệu tham khảo của bài học" backTo={`/lessons/${lessonId}`} />
      {docs === null && <p className="empty-state">Đang tải...</p>}
      <div className="module-list">
        {docs?.map((d) => (
          <button type="button" key={d.id} className="module-row" onClick={() => openAuthFile(d.url, d.originalName)}>
            <span className="module-row-icon doc-ext">{extOf(d.originalName)}</span>
            <span className="module-row-body">
              <span className="module-row-label">{d.title}</span>
              <span className="module-row-sub">{formatSize(d.size)}</span>
            </span>
            <ChevronRight size={18} className="module-row-chevron" />
          </button>
        ))}
      </div>
      {docs?.length === 0 && <p className="empty-state">Bài này chưa có tài liệu đính kèm.</p>}
    </div>
  );
}
