import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clapperboard, ExternalLink, PlayCircle } from 'lucide-react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';

function toEmbedUrl(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return null;
}

export default function VideoPage() {
  const { lessonId } = useParams();
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    api.get('/videos', { params: { lessonId } }).then((res) => setVideos(res.data));
  }, [lessonId]);

  return (
    <div>
      <PageHeader
        icon={Clapperboard}
        color="#B91C1C"
        title="Video tình huống thực tế"
        subtitle={`${videos.length} video trong bài học này`}
        backTo={`/lessons/${lessonId}`}
      />

      {videos.map((v) => {
        const embed = toEmbedUrl(v.url);
        return (
          <div key={v.id} className="card video-item">
            {embed ? (
              <iframe className="video-frame" src={embed} title={v.title} allowFullScreen />
            ) : v.url ? (
              <a href={v.url} target="_blank" rel="noopener noreferrer" className="video-frame video-frame-link">
                <PlayCircle size={44} />
              </a>
            ) : (
              <div className="video-frame video-frame-empty">
                <PlayCircle size={32} />
              </div>
            )}
            <div className="video-item-body">
              <h3 className="video-item-title">{v.title}</h3>
              {v.description && <p className="video-item-desc">{v.description}</p>}
              {!embed && v.url && (
                <a href={v.url} target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ marginTop: 10 }}>
                  <ExternalLink size={14} /> Mở video
                </a>
              )}
              {!v.url && <p className="empty-state" style={{ padding: '10px 0 0', textAlign: 'left' }}>Giáo viên chưa cập nhật link video cho mục này.</p>}
            </div>
          </div>
        );
      })}
      {videos.length === 0 && <p className="empty-state">Chưa có video tình huống cho bài học này.</p>}
    </div>
  );
}
