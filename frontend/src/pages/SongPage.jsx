import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Music4, GraduationCap } from 'lucide-react';
import api from '../api/client';
import Hanzi from '../components/Hanzi';
import PageHeader from '../components/PageHeader';

export default function SongPage() {
  const { lessonId } = useParams();
  const [songs, setSongs] = useState([]);
  const [activeLine, setActiveLine] = useState(-1);
  const audioRef = useRef(null);

  useEffect(() => {
    api.get('/songs', { params: { lessonId } }).then((res) => setSongs(res.data));
  }, [lessonId]);

  const handleTimeUpdate = (lines) => (e) => {
    const t = e.target.currentTime;
    const idx = lines.findIndex((l) => t >= l.start && t < l.end);
    setActiveLine(idx);
  };

  return (
    <div>
      <PageHeader
        icon={Music4}
        color="#D97706"
        title="Học qua bài hát"
        subtitle={`${songs.length} bài hát trong bài học này`}
        backTo={`/lessons/${lessonId}`}
      />

      {songs.map((song) => (
        <div key={song.id} className="card">
          <div className="song-header">
            <span className="song-header-icon"><Music4 size={18} /></span>
            <h3>{song.title}</h3>
          </div>

          {song.mediaUrl ? (
            <audio ref={audioRef} controls src={song.mediaUrl} style={{ width: '100%', marginBottom: 14 }} onTimeUpdate={handleTimeUpdate(song.lines)} />
          ) : (
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 10 }}>Giáo viên chưa cập nhật link nhạc — bấm 🔊 để nghe từng câu.</p>
          )}

          {song.lines.map((line, idx) => (
            <div key={idx} className={`song-line ${idx === activeLine ? 'active' : ''}`}>
              <Hanzi hanzi={line.hanzi} pinyin={line.pinyin} meaning={line.vi} />
            </div>
          ))}

          {song.grammarNotes && (
            <div className="grammar-note" style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <GraduationCap size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <span>Học từ &amp; ngữ pháp qua bài hát: {song.grammarNotes}</span>
            </div>
          )}
        </div>
      ))}
      {songs.length === 0 && <p className="empty-state">Chưa có bài hát cho bài học này.</p>}
    </div>
  );
}
