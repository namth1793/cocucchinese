import { useEffect, useRef, useState } from 'react';
import { FileText, Download, Trash2, Eye } from 'lucide-react';
import api from '../../api/client';

export default function AdminSlides({ lessonId: lockedLessonId }) {
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState(lockedLessonId || '');
  const [decks, setDecks] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [uploadingSourceId, setUploadingSourceId] = useState(null);
  const [convertingId, setConvertingId] = useState(null);
  const [convertError, setConvertError] = useState({});
  const pollingDeckIds = useRef(new Set());

  useEffect(() => { if (!lockedLessonId) api.get('/lessons').then((res) => setLessons(res.data)); }, [lockedLessonId]);

  // Convert PPT chạy nền ở server (có thể mất nhiều phút với file nhiều trang) -
  // tự hỏi lại định kỳ tới khi xong thay vì chờ 1 request duy nhất (dễ bị timeout).
  const pollConvertStatus = (deckId) => {
    if (pollingDeckIds.current.has(deckId)) return;
    pollingDeckIds.current.add(deckId);
    setConvertingId(deckId);
    const tick = async () => {
      try {
        const res = await api.get(`/slides/${deckId}/convert-status`);
        if (res.data.convertStatus?.state === 'processing') {
          setTimeout(tick, 4000);
          return;
        }
        pollingDeckIds.current.delete(deckId);
        setConvertingId((id) => (id === deckId ? null : id));
        setConvertError((e) => ({ ...e, [deckId]: res.data.convertStatus?.state === 'error' ? (res.data.convertStatus.error || 'Chuyển đổi thất bại, vui lòng thử lại.') : '' }));
        loadDecks();
      } catch {
        pollingDeckIds.current.delete(deckId);
        setConvertingId((id) => (id === deckId ? null : id));
        setConvertError((e) => ({ ...e, [deckId]: 'Không kiểm tra được tiến độ, vui lòng tải lại trang.' }));
      }
    };
    tick();
  };

  const loadDecks = () => {
    if (!lessonId) { setDecks([]); return; }
    api.get('/slides', { params: { lessonId } }).then((res) => {
      setDecks(res.data);
      res.data.forEach((d) => { if (d.convertStatus?.state === 'processing') pollConvertStatus(d.id); });
    });
  };

  useEffect(loadDecks, [lessonId]);

  const createDeck = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await api.post('/slides', { lessonId, title: newTitle });
    setNewTitle('');
    loadDecks();
  };

  const convertPptx = async (deckId, file) => {
    if (!file) return;
    setConvertingId(deckId);
    setConvertError((e) => ({ ...e, [deckId]: '' }));
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/slides/${deckId}/convert-pptx`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      pollConvertStatus(deckId);
    } catch (err) {
      setConvertingId(null);
      setConvertError((e) => ({ ...e, [deckId]: err?.response?.data?.error || 'Chuyển đổi thất bại, vui lòng thử lại.' }));
    }
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

  const deleteDeck = async (deckId, title) => {
    if (!window.confirm(`Xoá bộ bài giảng "${title}"? Toàn bộ ảnh và file gốc đã tải lên sẽ bị xoá vĩnh viễn.`)) return;
    await api.delete(`/slides/${deckId}`);
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <div>
                  <h3 style={{ marginTop: 0, marginBottom: 4 }}>{deck.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>{deck.pageCount} trang · phiên bản {deck.version}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {deck.pageCount > 0 && (
                    <a href={`/lessons/${lessonId}/ppt`} target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Eye size={13} /> Xem thử
                    </a>
                  )}
                  <button type="button" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#B91C1C' }} onClick={() => deleteDeck(deck.id, deck.title)}>
                    <Trash2 size={13} /> Xoá
                  </button>
                </div>
              </div>

              <div style={{ background: 'var(--primary-soft)', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                <label style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary-dark)' }}>
                  ⚡ Tải file PPT/PDF lên (tự động chuyển thành ảnh từng trang)
                </label>
                <p style={{ fontSize: 12, color: 'var(--ink-soft)', margin: '4px 0 8px' }}>
                  Cách nhanh nhất — không cần tự xuất ảnh. File ít trang thường mất dưới 1 phút; file vài trăm trang có thể mất nhiều phút — bạn có thể rời trang này, hệ thống vẫn xử lý ngầm và tự cập nhật khi quay lại.
                </p>
                <input
                  type="file"
                  accept=".ppt,.pptx,.pdf"
                  disabled={convertingId === deck.id}
                  onChange={(e) => convertPptx(deck.id, e.target.files[0])}
                />
                {convertingId === deck.id && <p style={{ fontSize: 13, marginTop: 8 }}>Đang chuyển đổi, có thể mất vài phút, vui lòng đợi hoặc quay lại sau...</p>}
                {convertError[deck.id] && <p style={{ fontSize: 12.5, color: 'var(--primary-dark)', marginTop: 8 }}>{convertError[deck.id]}</p>}
              </div>

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
