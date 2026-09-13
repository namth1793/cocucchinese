import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Mic2, Volume2, Square, Play, Lightbulb } from 'lucide-react';
import PlumBlossom from '../components/PlumBlossom';
import api from '../api/client';
import ProtectedContent from '../components/ProtectedContent';
import PageHeader from '../components/PageHeader';
import { speak } from '../utils/speak';

export default function Speaking() {
  const { lessonId } = useParams();
  const [scenarios, setScenarios] = useState(null);
  const [index, setIndex] = useState(0);
  const [pickedIdx, setPickedIdx] = useState(null);
  const [recording, setRecording] = useState(false);
  const [myAudioUrl, setMyAudioUrl] = useState(null);
  const [error, setError] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [doneCount, setDoneCount] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    api.get('/speaking', { params: { lessonId } }).then((res) => setScenarios(res.data));
  }, [lessonId]);

  useEffect(() => () => { if (myAudioUrl) URL.revokeObjectURL(myAudioUrl); }, [myAudioUrl]);

  if (!scenarios) return <p className="empty-state">Đang tải...</p>;

  if (scenarios.length === 0) {
    return (
      <div>
        <PageHeader icon={Mic2} color="#EA580C" title="Luyện nói" backTo={`/lessons/${lessonId}`} />
        <p className="empty-state">Chưa có tình huống luyện nói cho bài học này.</p>
      </div>
    );
  }

  const scenario = scenarios[index];
  const answered = pickedIdx !== null;

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

  const pick = async (i) => {
    if (answered) return;
    setPickedIdx(i);
    const isCorrect = i === scenario.answerIndex;
    if (isCorrect) setCorrectCount((c) => c + 1);
    try {
      await api.post('/exercises/submit', { lessonId, module: 'speaking', itemId: scenario.id, itemType: 'sentence', correct: isCorrect });
    } catch (e) { /* ignore */ }
  };

  const next = async () => {
    setMyAudioUrl(null);
    if (index + 1 >= scenarios.length) {
      await api.post(`/progress/${lessonId}/complete-module`, { module: 'speaking' });
      setDoneCount(scenarios.length);
    } else {
      setIndex((i) => i + 1);
      setPickedIdx(null);
    }
  };

  if (doneCount > 0) {
    return (
      <div>
        <PageHeader icon={Mic2} color="#EA580C" title="Luyện nói" backTo={`/lessons/${lessonId}`} />
        <div className="card" style={{ textAlign: 'center' }}>
          <h3><PlumBlossom size={20} color="var(--primary)" style={{ verticalAlign: -4, marginRight: 6 }} />Hoàn thành Luyện nói!</h3>
          <p style={{ color: 'var(--ink-soft)', margin: '8px 0 16px' }}>Đúng {correctCount}/{doneCount} tình huống</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => { setIndex(0); setPickedIdx(null); setCorrectCount(0); setDoneCount(0); }}
          >
            Luyện lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={Mic2}
        color="#EA580C"
        title="Luyện nói"
        subtitle={`Tình huống ${index + 1}/${scenarios.length}`}
        backTo={`/lessons/${lessonId}`}
      />

      <div className="exercise-progress-dots">
        {scenarios.map((_, i) => (
          <span key={i} className={i < index ? 'dot-done' : i === index ? 'dot-current' : ''} />
        ))}
      </div>

      <ProtectedContent>
        <div className="card">
          <p className="step-label"><span className="step-num">1</span>Bạn sẽ nói gì trong tình huống này?</p>
          <p className="dialogue-scenario-hint">🗣️ {scenario.context}</p>

          <div className="exercise-options">
            {scenario.options.map((opt, i) => {
              let cls = 'option-btn';
              if (answered) {
                if (i === scenario.answerIndex) cls += ' correct';
                else if (i === pickedIdx) cls += ' wrong';
              }
              return (
                <button key={i} type="button" className={cls} disabled={answered} onClick={() => pick(i)}>
                  <span className="cn">{opt}</span>
                </button>
              );
            })}
          </div>

          {answered && (
            <div className={`exercise-feedback ${pickedIdx === scenario.answerIndex ? 'ok' : 'no'}`}>
              <div className="exercise-feedback-title">{pickedIdx === scenario.answerIndex ? '✅ Chính xác!' : '❌ Chưa đúng.'}</div>
              <div className="exercise-explain"><Lightbulb size={14} style={{ verticalAlign: -2, marginRight: 4 }} />{scenario.explanation}</div>
            </div>
          )}
        </div>

        {answered && (
          <div className="card">
            <p className="step-label"><span className="step-num">2</span>Nghe mẫu rồi tự nói theo</p>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <span className="cn" style={{ fontSize: 22, fontWeight: 700 }}>{scenario.targetHanzi}</span>
              {scenario.targetPinyin && <div className="pinyin-text" style={{ marginTop: 4 }}>{scenario.targetPinyin}</div>}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20, justifyContent: 'center' }}>
              <button type="button" className="btn-secondary" onClick={() => speak(scenario.targetHanzi)}><Volume2 size={15} /> Nghe mẫu</button>
            </div>

            <p className="step-label"><span className="step-num">3</span>Thu âm giọng nói của bạn</p>
            {error && <div className="form-error">{error}</div>}
            {!recording ? (
              <button type="button" className="btn-primary" onClick={startRecording}><Mic2 size={16} /> Bấm để thu âm</button>
            ) : (
              <button type="button" className="btn-danger" onClick={stopRecording}><Square size={14} /> Dừng thu âm</button>
            )}

            {myAudioUrl && (
              <div style={{ marginTop: 22 }}>
                <p className="step-label"><span className="step-num">4</span>So sánh giọng đọc</p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <button type="button" className="btn-secondary" onClick={() => speak(scenario.targetHanzi)}><Play size={14} /> Giọng mẫu</button>
                  <audio controls src={myAudioUrl} style={{ maxWidth: '100%' }} />
                </div>
              </div>
            )}

            <button type="button" className="btn-primary btn-block" style={{ marginTop: 16 }} onClick={next}>
              {index + 1 >= scenarios.length ? 'Hoàn thành' : 'Tình huống tiếp theo →'}
            </button>
          </div>
        )}
      </ProtectedContent>
    </div>
  );
}
