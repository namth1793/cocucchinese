import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PenTool } from 'lucide-react';
import api from '../api/client';
import ProtectedContent from '../components/ProtectedContent';
import PageHeader from '../components/PageHeader';
import CharacterCard from '../components/CharacterCard';

export default function Characters() {
  const { lessonId } = useParams();
  const [chars, setChars] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    api.get('/characters', { params: { lessonId } }).then((res) => setChars(res.data));
    setSelectedId(null);
  }, [lessonId]);

  return (
    <div>
      <PageHeader
        icon={PenTool}
        color="#6B21A8"
        title="Chữ Hán"
        subtitle={`${chars.length} chữ Hán trong bài học này — bấm vào chữ để xem chi tiết`}
        backTo={`/lessons/${lessonId}`}
      />

      <ProtectedContent>
        <div className="char-mini-grid">
          {chars.map((c) => (
            c.id === selectedId ? (
              <CharacterCard key={c.id} character={c} onClose={() => setSelectedId(null)} />
            ) : (
              <button key={c.id} type="button" className="char-mini-card" onClick={() => setSelectedId(c.id)}>
                <span className="cn char-mini-hanzi">{c.char}</span>
                <span className="pinyin-text">{c.pinyin}</span>
                <span className="meaning-text">{c.meaningVi}</span>
              </button>
            )
          ))}
        </div>
        {chars.length === 0 && <p className="empty-state">Chưa có chữ Hán cho bài học này.</p>}
      </ProtectedContent>
    </div>
  );
}
