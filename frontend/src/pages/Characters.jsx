import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PenTool } from 'lucide-react';
import api from '../api/client';
import ProtectedContent from '../components/ProtectedContent';
import PageHeader from '../components/PageHeader';
import SpeakButton from '../components/SpeakButton';

export default function Characters() {
  const { lessonId } = useParams();
  const [chars, setChars] = useState([]);

  useEffect(() => {
    api.get('/characters', { params: { lessonId } }).then((res) => setChars(res.data));
  }, [lessonId]);

  return (
    <div>
      <PageHeader
        icon={PenTool}
        color="#6B21A8"
        title="Chữ Hán"
        subtitle={`${chars.length} chữ Hán trong bài học này`}
        backTo={`/lessons/${lessonId}`}
      />

      <ProtectedContent>
        <div className="char-grid">
          {chars.map((c) => (
            <div key={c.id} className="card char-card">
              <div className="char-head">
                <div className="char-hanzi-row">
                  <span className="cn char-hanzi-big">{c.char}</span>
                  <SpeakButton text={c.char} />
                </div>
                <div className="char-meta">
                  <span className="pinyin-text">{c.pinyin}</span>
                  <span className="meaning-text">{c.meaningVi}</span>
                </div>
                <div className="char-tags">
                  {c.strokes != null && <span className="char-tag">{c.strokes} nét</span>}
                  {c.structure && <span className="char-tag cn">{c.structure}</span>}
                  {c.rule && <span className="char-tag cn">{c.rule}</span>}
                </div>
              </div>

              {c.radical && (
                <div className="char-row">
                  <span className="char-row-label">Bộ thủ</span>
                  <span className="cn char-radical">{c.radical}</span>
                  <span className="char-row-text">{c.radicalMeaningVi}</span>
                </div>
              )}
              {c.build && (
                <div className="char-row">
                  <span className="char-row-label">Cấu tạo</span>
                  <span className="char-row-text cn">{c.build}</span>
                </div>
              )}
              {c.strokeSeq && c.strokeSeq.length > 0 && (
                <div className="char-stroke-seq">
                  {c.strokeSeq.map((s, i) => <span key={i} className="char-stroke-chip cn">{s}</span>)}
                </div>
              )}
              {c.memo && <div className="char-memo cn">{c.memo}</div>}
            </div>
          ))}
        </div>
        {chars.length === 0 && <p className="empty-state">Chưa có chữ Hán cho bài học này.</p>}
      </ProtectedContent>
    </div>
  );
}
