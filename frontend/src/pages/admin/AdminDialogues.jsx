import { useEffect, useRef, useState } from 'react';
import { Upload, Volume2, X } from 'lucide-react';
import api from '../../api/client';
import AdminCrud from '../../components/AdminCrud';
import useAuthMedia from '../../utils/useAuthMedia';

/** Ô tải/nghe thử/xoá file mp3 thay cho giọng đọc máy của 1 bài khoá. */
function DialogueAudioCell({ dialogue, onChanged }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const previewUrl = useAuthMedia(dialogue.audioUrl);

  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/dialogues/${dialogue.id}/audio`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChanged();
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const remove = async () => {
    if (!window.confirm('Xoá file nghe đã tải lên? Bài khoá sẽ quay lại dùng giọng đọc máy.')) return;
    await api.delete(`/dialogues/${dialogue.id}/audio`);
    onChanged();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {dialogue.audioUrl ? (
        <>
          {previewUrl && <audio controls src={previewUrl} style={{ height: 28, width: 140 }} />}
          <button type="button" className="btn-secondary" title="Xoá file nghe" onClick={remove}><X size={13} /></button>
        </>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Volume2 size={13} /> Giọng đọc máy
        </span>
      )}
      <button type="button" className="btn-secondary" disabled={uploading} onClick={() => fileRef.current?.click()}>
        <Upload size={13} style={{ verticalAlign: -2 }} /> {uploading ? 'Đang tải...' : dialogue.audioUrl ? 'Thay file' : 'Tải mp3'}
      </button>
      <input ref={fileRef} type="file" accept="audio/*" hidden onChange={upload} />
    </div>
  );
}

export default function AdminDialogues({ lessonId: lockedLessonId }) {
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => { if (!lockedLessonId) api.get('/lessons').then((res) => setLessons(res.data)); }, [lockedLessonId]);

  const lessonOptions = lessons.map((l) => ({ value: l.id, label: l.title }));

  const fields = [
    ...(lockedLessonId ? [] : [{ name: 'lessonId', label: 'Thuộc bài học', type: 'select', options: lessonOptions, required: true }]),
    { name: 'order', label: 'Thứ tự', type: 'number' },
    { name: 'title', label: 'Tiêu đề đoạn hội thoại', required: true },
    { name: 'audioLabel', label: 'Nhãn audio (VD: 1-1)' },
    { name: 'contextHanzi', label: 'Bối cảnh (chữ Hán)', type: 'textarea' },
    { name: 'contextEn', label: 'Bối cảnh (tiếng Anh)', type: 'textarea' },
    {
      name: 'tip', label: 'Chú thích thêm (JSON, có thể để trống)', type: 'json',
      default: null,
      hint: 'VD: {"hanzi":"您，敬称...","en":"\\"您\\" is an honorific..."} hoặc để trống là null'
    },
    {
      name: 'lines', label: 'Các câu thoại (JSON mảng)', type: 'json', required: true,
      default: [],
      hint: 'VD: [{"speaker":"Wáng Yīfēi","hanzi":"你好！","pinyin":"Nǐ hǎo!","vi":"Xin chào!","en":"Hello!"}]'
    }
  ];

  const columns = [
    { key: 'order', label: 'Thứ tự' },
    { key: 'title', label: 'Tiêu đề' },
    { key: 'lines', label: 'Số câu thoại', render: (item) => (item.lines || []).length },
    {
      key: 'audio', label: 'File nghe',
      render: (item) => <DialogueAudioCell dialogue={item} onChanged={() => setRefreshKey((k) => k + 1)} />
    }
  ];

  if (!lockedLessonId && lessons.length === 0) return <p className="empty-state">Đang tải danh sách bài học...</p>;

  return (
    <AdminCrud
      title="Quản lý Bài khoá"
      endpoint="/dialogues"
      fields={fields}
      filterKey={lockedLessonId ? undefined : 'lessonId'}
      filterOptions={lockedLessonId ? undefined : lessonOptions}
      filterValue={lockedLessonId ? undefined : lessonId}
      onFilterChange={lockedLessonId ? undefined : setLessonId}
      fixedValues={lockedLessonId ? { lessonId: lockedLessonId } : undefined}
      listColumns={columns}
      reloadToken={refreshKey}
      hint="Mặc định bài khoá đọc bằng giọng máy (TTS). Tải file mp3 lên để dùng giọng đọc thật thay thế."
    />
  );
}
