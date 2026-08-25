import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link2, Timer, CheckCircle2 } from 'lucide-react';
import PlumBlossom from '../../components/PlumBlossom';
import PageHeader from '../../components/PageHeader';
import api from '../../api/client';
import { speak } from '../../utils/speak';

export default function MatchGame() {
  const { lessonId } = useParams();
  const [pairs, setPairs] = useState(null);
  const [selLeft, setSelLeft] = useState(null);
  const [selRight, setSelRight] = useState(null);
  const [matched, setMatched] = useState([]);
  const [wrongFlash, setWrongFlash] = useState([]);
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    api.get(`/exercises/${lessonId}/match`, { params: { count: 6 } }).then((res) => setPairs(res.data.items));
  }, [lessonId]);

  useEffect(() => {
    if (!pairs) return;
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [pairs]);

  useEffect(() => {
    if (pairs && matched.length === pairs.left.length && matched.length > 0) {
      clearInterval(timerRef.current);
      api.post(`/progress/${lessonId}/complete-module`, { module: 'game' }).catch(() => {});
    }
  }, [matched, pairs, lessonId]);

  if (!pairs) return <p className="empty-state">Đang tải...</p>;
  if (pairs.left.length === 0) return <p className="empty-state">Chưa có đủ từ vựng để chơi game ghép đôi.</p>;

  const tryMatch = (leftId, rightId) => {
    if (leftId === rightId) {
      setMatched((m) => [...m, leftId]);
      setSelLeft(null);
      setSelRight(null);
    } else {
      setWrongFlash([leftId, rightId]);
      setTimeout(() => { setWrongFlash([]); setSelLeft(null); setSelRight(null); }, 500);
    }
  };

  const clickLeft = (item) => {
    if (matched.includes(item.id)) return;
    speak(item.label);
    setSelLeft(item.id);
    if (selRight) tryMatch(item.id, selRight);
  };
  const clickRight = (item) => {
    if (matched.includes(item.id)) return;
    setSelRight(item.id);
    if (selLeft) tryMatch(selLeft, item.id);
  };

  const cls = (id, sel) => {
    let c = 'match-item';
    if (matched.includes(id)) c += ' matched';
    else if (wrongFlash.includes(id)) c += ' wrong-flash';
    else if (sel === id) c += ' selected';
    return c;
  };

  const finished = matched.length === pairs.left.length;

  return (
    <div>
      <PageHeader
        icon={Link2}
        color="#DC2626"
        title="Ghép đôi"
        backTo={`/lessons/${lessonId}/games`}
        backLabel="Chọn game khác"
        right={(
          <div className="badges-row" style={{ margin: 0 }}>
            <span className="timer-badge"><Timer size={13} /> {seconds}s</span>
            <span className="score-badge"><CheckCircle2 size={13} /> {matched.length}/{pairs.left.length}</span>
          </div>
        )}
      />

      {finished ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <h3><PlumBlossom size={20} color="var(--primary)" style={{ verticalAlign: -4, marginRight: 6 }} />Hoàn thành trong {seconds} giây!</h3>
          <button type="button" className="btn-primary" onClick={() => window.location.reload()}>Chơi lại</button>
        </div>
      ) : (
        <div className="match-grid">
          <div className="match-col">
            {pairs.left.map((item) => (
              <button key={item.id} type="button" className={cls(item.id, selLeft)} onClick={() => clickLeft(item)}>
                {item.label}
              </button>
            ))}
          </div>
          <div className="match-col">
            {pairs.right.map((item) => (
              <button key={item.id} type="button" className={cls(item.id, selRight)} onClick={() => clickRight(item)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
