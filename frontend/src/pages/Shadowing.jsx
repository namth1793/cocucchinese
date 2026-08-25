import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Mic2, Volume2, Repeat, Square, Play } from 'lucide-react';
import PlumBlossom from '../components/PlumBlossom';
import api from '../api/client';
import Hanzi from '../components/Hanzi';
import ProtectedContent from '../components/ProtectedContent';
import PageHeader from '../components/PageHeader';
import { speak } from '../utils/speak';

export default function Shadowing() {
  const { lessonId } = useParams();
  const [sentences, setSentences] = useState([]);
  const [index, setIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [myAudioUrl, setMyAudioUrl] = useState(null);
  const [error, setError] = useState('');
  const [doneCount, setDoneCount] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    api.get('/sentences', { params: { lessonId } }).then((res) => setSentences(res.data));
  }, [lessonId]);

  useEffect(() => () => { if (myAudioUrl) URL.revokeObjectURL(myAudioUrl); }, [myAudioUrl]);

  if (sentences.length === 0) {
    return (
      <div>
        <PageHeader icon={Mic2} color="#EA580C" title="Shadowing" backTo={`/lessons/${lessonId}`} />
        <p className="empty-state">Chưa có câu để luyện Shadowing.</p>
      </div>
    );
  }

  const sentence = sentences[index];

  const startRecording = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (myAudioUrl) URL.revokeObjectURL(myAudioUrl);
        setMyAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (e) {
      setError('Không thể truy cập micro. Vui lòng cấp quyền ghi âm cho trình duyệt.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  };

  const nextSentence = async () => {
    await api.post('/exercises/submit', { lessonId, module: 'shadowing', itemId: sentence.id, itemType: 'sentence', correct: true });
    setMyAudioUrl(null);
    if (index + 1 >= sentences.length) {
      await api.post(`/progress/${lessonId}/complete-module`, { module: 'shadowing' });
      setDoneCount(sentences.length);
    } else {
      setIndex((i) => i + 1);
    }
  };

  if (doneCount > 0) {
    return (
      <div>
        <PageHeader icon={Mic2} color="#EA580C" title="Shadowing" backTo={`/lessons/${lessonId}`} />
        <div className="card" style={{ textAlign: 'center' }}>
          <h3><PlumBlossom size={20} color="var(--primary)" style={{ verticalAlign: -4, marginRight: 6 }} />Đã hoàn thành Shadowing {doneCount} câu!</h3>
          <button type="button" className="btn-primary" onClick={() => { setIndex(0); setDoneCount(0); }}>Luyện lại</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={Mic2}
        color="#EA580C"
        title="Shadowing"
        subtitle={`Câu ${index + 1}/${sentences.length}`}
        backTo={`/lessons/${lessonId}`}
      />

      <div className="exercise-progress-dots">
        {sentences.map((_, i) => (
          <span key={i} className={i < index ? 'dot-done' : i === index ? 'dot-current' : ''} />
        ))}
      </div>

      <ProtectedContent>
        <div className="card" style={{ textAlign: 'center' }}>
          <Hanzi hanzi={sentence.hanzi} pinyin={sentence.pinyin} meaning={sentence.vi} />
        </div>
      </ProtectedContent>

      <div className="card">
        <p className="step-label"><span className="step-num">1</span>Nghe câu mẫu</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
          <button type="button" className="btn-secondary" onClick={() => speak(sentence.hanzi)}><Volume2 size={15} /> Nghe câu mẫu</button>
          <button type="button" className="btn-secondary" onClick={() => speak(sentence.hanzi)}><Repeat size={15} /> Nghe lại</button>
        </div>

        <p className="step-label"><span className="step-num">2</span>Thu âm giọng đọc của bạn</p>
        {error && <div className="form-error">{error}</div>}
        {!recording ? (
          <button type="button" className="btn-primary" onClick={startRecording}><Mic2 size={16} /> Bấm để thu âm</button>
        ) : (
          <button type="button" className="btn-danger" onClick={stopRecording}><Square size={14} /> Dừng thu âm</button>
        )}

        {myAudioUrl && (
          <div style={{ marginTop: 22 }}>
            <p className="step-label"><span className="step-num">3</span>So sánh giọng đọc</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button type="button" className="btn-secondary" onClick={() => speak(sentence.hanzi)}><Play size={14} /> Giọng mẫu</button>
              <audio controls src={myAudioUrl} style={{ maxWidth: '100%' }} />
            </div>
            <button type="button" className="btn-primary btn-block" style={{ marginTop: 16 }} onClick={nextSentence}>
              {index + 1 >= sentences.length ? 'Hoàn thành' : 'Câu tiếp theo →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
