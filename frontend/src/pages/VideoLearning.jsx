import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clapperboard, RotateCcw, Headphones, Mic2, Square, Volume2, Eye, EyeOff } from 'lucide-react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import { speak } from '../utils/speak';

function toYoutubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=|youtube\.com\/embed\/)([\w-]+)/);
  return m ? m[1] : null;
}

/**
 * Hợp nhất "Video tình huống" và "Học qua bài hát" thành một luồng học duy
 * nhất: mỗi mục (video hoặc bài hát) đều có trình phát + bản chép đồng bộ
 * theo câu (nếu giáo viên đã nhập), kèm khung luyện nói theo câu.
 */
export default function VideoLearning() {
  const { lessonId } = useParams();
  const [items, setItems] = useState(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get('/videos', { params: { lessonId } }),
      api.get('/songs', { params: { lessonId } })
    ]).then(([vRes, sRes]) => {
      const merged = [
        ...vRes.data.map((v) => ({ id: `v-${v.id}`, kind: 'video', title: v.title, description: v.description, url: v.url, lines: v.lines || [] })),
        ...sRes.data.map((s) => ({ id: `s-${s.id}`, kind: 'song', title: s.title, description: s.grammarNotes, url: s.mediaUrl, lines: s.lines || [] }))
      ];
      setItems(merged);
      setActiveIdx(0);
    });
  }, [lessonId]);

  if (items === null) {
    return (
      <div>
        <PageHeader icon={Clapperboard} color="#B91C1C" title="Học qua video" backTo={`/lessons/${lessonId}`} />
        <p className="empty-state">Đang tải...</p>
      </div>
    );
  }

  const item = items[activeIdx];

  return (
    <div>
      <PageHeader
        icon={Clapperboard}
        color="#B91C1C"
        title="Học qua video"
        subtitle={item ? item.title : `${items.length} nội dung trong bài học này`}
        backTo={`/lessons/${lessonId}`}
      />

      {items.length > 1 && (
        <div className="vl-tabs">
          {items.map((it, i) => (
            <button key={it.id} type="button" className={`tab-btn ${i === activeIdx ? 'active' : ''}`} onClick={() => setActiveIdx(i)}>
              {it.title}
            </button>
          ))}
        </div>
      )}

      {item ? (
        <VideoLearningItem key={item.id} item={item} />
      ) : (
        <p className="empty-state">Chưa có video hoặc bài hát cho bài học này.</p>
      )}
    </div>
  );
}

function VideoLearningItem({ item }) {
  const mediaRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [activeLine, setActiveLine] = useState(0);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTrans, setShowTrans] = useState(true);
  const [showOverlay, setShowOverlay] = useState(true);
  const [autoPause, setAutoPause] = useState(false);
  const [loopLine, setLoopLine] = useState(false);
  const [bigMedia, setBigMedia] = useState(false);
  const [recording, setRecording] = useState(false);
  const [myAudioUrl, setMyAudioUrl] = useState(null);

  const lines = item.lines || [];
  const line = lines[activeLine];
  const ytId = item.kind === 'video' ? toYoutubeId(item.url) : null;
  const hasNativeMedia = !!item.url && !ytId;

  useEffect(() => () => { if (myAudioUrl) URL.revokeObjectURL(myAudioUrl); }, [myAudioUrl]);

  const handleTimeUpdate = () => {
    const el = mediaRef.current;
    if (!el || lines.length === 0) return;
    const t = el.currentTime;
    const idx = lines.findIndex((l) => t >= l.start && t < l.end);
    if (idx === -1) return;
    if (idx !== activeLine) setActiveLine(idx);
    const cur = lines[idx];
    if (t >= cur.end - 0.05) {
      if (loopLine) el.currentTime = cur.start;
      else if (autoPause) el.pause();
    }
  };

  const seekTo = (idx) => {
    setActiveLine(idx);
    const el = mediaRef.current;
    if (el && lines[idx]) {
      el.currentTime = lines[idx].start;
      el.play().catch(() => {});
    }
  };

  const replay = () => {
    const el = mediaRef.current;
    if (el && line) { el.currentTime = line.start; el.play().catch(() => {}); }
  };

  const startRecording = async () => {
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
    } catch {
      // Người dùng từ chối quyền micro — nút vẫn còn đó để thử lại.
    }
  };
  const stopRecording = () => { mediaRecorderRef.current?.stop(); setRecording(false); };

  return (
    <div className="vl-grid">
      <div>
        <div className={`vl-media ${bigMedia ? 'vl-media-big' : ''}`}>
          {ytId ? (
            <iframe
              src={`https://www.youtube.com/embed/${ytId}${line ? `?start=${Math.floor(line.start)}` : ''}`}
              title={item.title}
              allowFullScreen
            />
          ) : item.kind === 'video' && hasNativeMedia ? (
            <video ref={mediaRef} src={item.url} controls onTimeUpdate={handleTimeUpdate} />
          ) : item.kind === 'song' ? (
            <div className="vl-media-audio">
              <div className="vl-media-audio-icon"><Volume2 size={34} /></div>
            </div>
          ) : (
            <div className="vl-media-empty"><Clapperboard size={28} /><span>Giáo viên chưa cập nhật video cho mục này.</span></div>
          )}

          {showOverlay && line && !ytId && (
            <div className="vl-subtitle-overlay">
              <div className="hanzi-text">{line.hanzi}</div>
              {showPinyin && <div className="pinyin-text">{line.pinyin}</div>}
            </div>
          )}
        </div>

        {item.kind === 'song' && (
          item.url
            ? <audio ref={mediaRef} src={item.url} controls className="vl-audio-native" onTimeUpdate={handleTimeUpdate} />
            : <p className="empty-state" style={{ padding: '10px 0 0', textAlign: 'left' }}>Giáo viên chưa cập nhật link nhạc cho bài hát này.</p>
        )}

        <div className="vl-controls-row">
          <button type="button" className="vl-icon-btn" onClick={replay} disabled={!line || !!ytId} title="Nghe lại câu này">
            <RotateCcw size={16} />
          </button>
          <button type="button" className="vl-icon-btn" onClick={() => line && speak(line.hanzi)} disabled={!line} title="Phát âm câu này">
            <Headphones size={16} />
          </button>
          <button type="button" className={`vl-icon-btn ${showOverlay ? 'on' : ''}`} onClick={() => setShowOverlay((v) => !v)} title="Ẩn/hiện phụ đề trên video">
            {showOverlay ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>

        <div className="vl-switch-row">
          <button type="button" className={`pinyin-toggle ${autoPause ? 'on' : ''}`} onClick={() => setAutoPause((v) => !v)}>
            Tự động dừng<span className="pinyin-switch" />
          </button>
          <button type="button" className={`pinyin-toggle ${loopLine ? 'on' : ''}`} onClick={() => setLoopLine((v) => !v)}>
            Lặp câu<span className="pinyin-switch" />
          </button>
          <button type="button" className={`pinyin-toggle ${bigMedia ? 'on' : ''}`} onClick={() => setBigMedia((v) => !v)}>
            Video kích thước lớn<span className="pinyin-switch" />
          </button>
        </div>

        {line && (
          <div className="card vl-practice">
            <div className="vl-practice-title">Luyện nói theo câu</div>
            <div className="hanzi-block">
              <div className="hanzi-row"><span className="hanzi-text">{line.hanzi}</span></div>
              {showPinyin && <div className="pinyin-text">{line.pinyin}</div>}
              {showTrans && <div className="meaning-text">{line.vi}</div>}
            </div>
            <div className="vl-practice-actions">
              <button type="button" className="btn-secondary" onClick={() => speak(line.hanzi)}><Volume2 size={14} /> Nghe mẫu</button>
              {!recording ? (
                <button type="button" className="btn-primary" onClick={startRecording}><Mic2 size={14} /> Thu âm</button>
              ) : (
                <button type="button" className="btn-danger" onClick={stopRecording}><Square size={12} /> Dừng</button>
              )}
              {myAudioUrl && <audio controls src={myAudioUrl} style={{ height: 34 }} />}
            </div>
          </div>
        )}
      </div>

      <div className="card vl-transcript">
        <div className="vl-transcript-head">
          <span className="vl-transcript-head-label">Bản chép</span>
          <div className="vl-transcript-head-actions">
            <button type="button" className={`vl-pill-toggle ${showPinyin ? 'on' : ''}`} onClick={() => setShowPinyin((v) => !v)}>Pinyin</button>
            <button type="button" className={`vl-pill-toggle ${showTrans ? 'on' : ''}`} onClick={() => setShowTrans((v) => !v)}>Dịch</button>
            {lines.length > 0 && <span className="vl-progress-badge">{Math.round(((activeLine + 1) / lines.length) * 100)}%</span>}
          </div>
        </div>
        <div className="vl-transcript-list">
          {lines.map((l, i) => (
            <button key={i} type="button" className={`vl-line ${i === activeLine ? 'active' : ''}`} onClick={() => seekTo(i)}>
              <span className="vl-line-idx">#{i + 1}</span>
              <span className="vl-line-body">
                {showPinyin && <span className="vl-line-pinyin">{l.pinyin}</span>}
                <div className="vl-line-hanzi">{l.hanzi}</div>
                {showTrans && <div className="vl-line-vi">{l.vi}</div>}
              </span>
            </button>
          ))}
          {lines.length === 0 && <p className="empty-state">Giáo viên chưa thêm bản chép cho mục này.</p>}
        </div>
      </div>
    </div>
  );
}
