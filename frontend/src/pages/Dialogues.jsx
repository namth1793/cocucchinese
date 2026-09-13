import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MessagesSquare, Volume2 } from 'lucide-react';
import api from '../api/client';
import ProtectedContent from '../components/ProtectedContent';
import PageHeader from '../components/PageHeader';
import SpeakButton from '../components/SpeakButton';
import { speak } from '../utils/speak';

export default function Dialogues() {
  const { lessonId } = useParams();
  const [dialogues, setDialogues] = useState([]);

  useEffect(() => {
    api.get('/dialogues', { params: { lessonId } }).then((res) => setDialogues(res.data));
  }, [lessonId]);

  const playAll = (lines) => {
    lines.forEach((l, i) => setTimeout(() => speak(l.hanzi), i * 1600));
  };

  return (
    <div>
      <PageHeader
        icon={MessagesSquare}
        color="#0D7377"
        title="Bài khoá"
        subtitle={`${dialogues.length} đoạn hội thoại trong bài học này`}
        backTo={`/lessons/${lessonId}`}
      />

      <ProtectedContent>
        {dialogues.map((d) => (
          <div key={d.id} className="card dialogue-card">
            <div className="dialogue-head">
              <span className="dialogue-badge">Bài khoá {d.order}</span>
              <div className="dialogue-title">{d.title}</div>
            </div>
            {(d.contextHanzi || d.contextEn) && (
              <div className="dialogue-context">
                {d.contextHanzi && <span className="cn">{d.contextHanzi}</span>}
                {d.contextEn && <span className="dialogue-context-en">{d.contextEn}</span>}
              </div>
            )}
            {d.tip && (d.tip.hanzi || d.tip.en) && (
              <div className="dialogue-tip">
                <strong>Chú thích:</strong> {d.tip.hanzi && <span className="cn">{d.tip.hanzi}</span>}
                {d.tip.en && <div className="dialogue-tip-en">{d.tip.en}</div>}
              </div>
            )}

            <div className="dialogue-lines">
              {d.lines.map((line, i) => (
                <div key={i} className="dialogue-line">
                  <div className="dialogue-speaker">{line.speaker}</div>
                  <div className="dialogue-bubble">
                    <div className="dialogue-hanzi-row">
                      <span className="dialogue-hanzi">{line.hanzi}</span>
                      <SpeakButton text={line.hanzi} />
                    </div>
                    {line.pinyin && <div className="dialogue-pinyin">{line.pinyin}</div>}
                    {line.vi && <div className="dialogue-vi">{line.vi}</div>}
                  </div>
                </div>
              ))}
            </div>

            <button type="button" className="btn-secondary" style={{ marginTop: 12 }} onClick={() => playAll(d.lines)}>
              <Volume2 size={15} /> Nghe cả đoạn {d.audioLabel && `(${d.audioLabel})`}
            </button>
          </div>
        ))}
        {dialogues.length === 0 && <p className="empty-state">Chưa có bài khoá cho bài học này.</p>}
      </ProtectedContent>
    </div>
  );
}
