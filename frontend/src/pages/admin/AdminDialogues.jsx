import { useEffect, useState } from 'react';
import api from '../../api/client';
import AdminCrud from '../../components/AdminCrud';
import AudioField from '../../components/AudioField';

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
      name: 'tip', label: 'Chú thích thêm (không bắt buộc)', type: 'example', nullable: true,
      keys: [['hanzi', 'Chú thích (chữ Hán)'], ['en', 'Chú thích (tiếng Anh/Việt)']]
    },
    {
      name: 'lines', label: 'Các câu thoại', type: 'rows', addLabel: 'Thêm câu thoại',
      columns: [
        { key: 'speaker', label: 'Người nói' },
        { key: 'hanzi', label: '汉字', cn: true, wide: true },
        { key: 'pinyin', label: 'Pinyin', wide: true },
        { key: 'vi', label: 'Nghĩa tiếng Việt', wide: true },
        { key: 'en', label: 'Tiếng Anh (không bắt buộc)' }
      ]
    }
  ];

  const columns = [
    { key: 'order', label: 'Thứ tự' },
    { key: 'title', label: 'Tiêu đề' },
    { key: 'lines', label: 'Số câu thoại', render: (item) => (item.lines || []).length },
    {
      key: 'audio', label: 'File nghe',
      render: (item) => (
        <AudioField
          compact
          value={item.audioUrl}
          onChange={async (url) => { await api.put(`/dialogues/${item.id}`, { audioUrl: url }); setRefreshKey((k) => k + 1); }}
        />
      )
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
      sortable
      hint="Mặc định bài khoá đọc bằng giọng máy. Tải file nghe ở cột File nghe (được nghe thử trước khi lưu) để dùng giọng đọc thật."
    />
  );
}
