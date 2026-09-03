import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import api from '../../api/client';

export default function AdminSlides({ lessonId: lockedLessonId }) {
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState(lockedLessonId || '');
  const [decks, setDecks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [uploadingId, setUploadingId] = useState(null);
  const [uploadingSourceId, setUploadingSourceId] = useState(null);

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

  const uploadSource = async (deckId, file) => {
    if (!file) return;
    setUploadingSourceId(deckId);
    const fd = new FormData();
    fd.append('file', file);
    await api.post(`/slides/${deckId}/source`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setUploadingSourceId(null);
    loadDecks();
  };

  const downloadSource = async (deckId, filename) => {
    const res = await api.get(`/slides/${deckId}/source`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'bai-giang.pptx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (!lockedLessonId && lessons.length === 0) return <p className="empty-state">Đang tải danh sách bài học...</p>;

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Quản lý PPT / Bài giảng</h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: -6 }}>
        Học sinh xem bài giảng qua trình xem có kiểm soát (ảnh từng trang, có watermark, không tải xuống được).
        File PowerPoint gốc chỉ giáo viên/admin tải lên và tải về được, không hiển thị cho học sinh.
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

              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--line-strong)' }}>
                <label style={{ fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={14} /> File PowerPoint gốc (lưu trữ/tải về, không hiển thị cho học sinh)
                </label>
                {deck.sourceOriginalName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                    <span style={{ fontSize: 13 }}>📎 {deck.sourceOriginalName}</span>
                    <button type="button" className="btn-secondary" onClick={() => downloadSource(deck.id, deck.sourceOriginalName)}>
                      <Download size={13} /> Tải xuống
                    </button>
                  </div>
                ) : (
                  <p className="empty-state" style={{ padding: '6px 0', textAlign: 'left' }}>Chưa có file PowerPoint gốc.</p>
                )}
                <input
                  type="file"
                  accept=".ppt,.pptx,.pdf,.key"
                  disabled={uploadingSourceId === deck.id}
                  onChange={(e) => uploadSource(deck.id, e.target.files[0])}
                  style={{ marginTop: 8 }}
                />
                {uploadingSourceId === deck.id && <p style={{ fontSize: 13 }}>Đang tải lên...</p>}
              </div>
            </div>
          ))}
          {decks.length === 0 && <p className="empty-state">Chưa có bộ bài giảng nào cho bài học này.</p>}
        </>
      )}
    </div>
  );
}
