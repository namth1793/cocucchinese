import { useEffect, useState } from 'react';
import api from '../../api/client';

export default function AdminSlides({ lessonId: lockedLessonId }) {
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState(lockedLessonId || '');
  const [decks, setDecks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [uploadingId, setUploadingId] = useState(null);

  useEffect(() => { if (!lockedLessonId) api.get('/lessons').then((res) => setLessons(res.data)); }, [lockedLessonId]);

  const loadDecks = () => {
    if (!lessonId) { setDecks([]); return; }
    api.get('/slides', { params: { lessonId } }).then((res) => setDecks(res.data));
  };

  useEffect(loadDecks, [lessonId]);

  const createDeck = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await api.post('/slides', { lessonId, title: newTitle });
    setNewTitle('');
    loadDecks();
  };

  const uploadPages = async (deckId, files) => {
    if (!files || files.length === 0) return;
    setUploadingId(deckId);
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append('pages', f));
    await api.post(`/slides/${deckId}/pages`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setUploadingId(null);
    loadDecks();
  };

  if (!lockedLessonId && lessons.length === 0) return <p className="empty-state">Đang tải danh sách bài học...</p>;

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Quản lý PPT / Bài giảng</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: -6 }}>
        Ảnh trang bài giảng được lưu ở khu vực bảo mật, học sinh chỉ xem qua trình xem có kiểm soát (không tải xuống được).
      </p>

      {!lockedLessonId && (
        <div className="form-field">
          <label>Chọn bài học</label>
          <select value={lessonId} onChange={(e) => setLessonId(e.target.value)}>
            <option value="">-- Chọn bài học --</option>
            {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
        </div>
      )}

      {lessonId && (
        <>
          <form className="admin-form" onSubmit={createDeck} style={{ marginTop: 16 }}>
            <div className="form-field">
              <label>Tạo bộ bài giảng mới</label>
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="VD: PPT Bài 1: 你好" />
            </div>
            <button type="submit" className="btn-primary">+ Tạo bộ bài giảng</button>
          </form>

          {decks.map((deck) => (
            <div key={deck.id} className="card">
              <h3 style={{ marginTop: 0 }}>{deck.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>{deck.pageCount} trang · phiên bản {deck.version}</p>
              <label style={{ fontWeight: 600, fontSize: 13 }}>Tải thêm trang (ảnh, có thể chọn nhiều file cùng lúc)</label><br />
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploadingId === deck.id}
                onChange={(e) => uploadPages(deck.id, e.target.files)}
                style={{ marginTop: 8 }}
              />
              {uploadingId === deck.id && <p style={{ fontSize: 13 }}>Đang tải lên...</p>}
            </div>
          ))}
          {decks.length === 0 && <p className="empty-state">Chưa có bộ bài giảng nào cho bài học này.</p>}
        </>
      )}
    </div>
  );
}
