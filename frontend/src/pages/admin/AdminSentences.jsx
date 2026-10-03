import { useEffect, useState } from 'react';
import api from '../../api/client';
import AdminCrud from '../../components/AdminCrud';

export default function AdminSentences({ lessonId: lockedLessonId }) {
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState('');

  useEffect(() => { if (!lockedLessonId) api.get('/lessons').then((res) => setLessons(res.data)); }, [lockedLessonId]);

  const lessonOptions = lessons.map((l) => ({ value: l.id, label: l.title }));

  const fields = [
    ...(lockedLessonId ? [] : [{ name: 'lessonId', label: 'Thuộc bài học', type: 'select', options: lessonOptions, required: true }]),
    {
      name: 'category', label: 'Dùng cho mục', type: 'select', required: true,
      options: [
        { value: 'reading', label: 'Luyện đọc' },
        { value: 'listening', label: 'Luyện nghe' },
        { value: 'dialogue', label: 'Hội thoại (nghe)' }
      ]
    },
    { name: 'hanzi', label: '汉字', required: true },
    { name: 'pinyin', label: 'Pinyin', required: true },
    { name: 'vi', label: 'Nghĩa tiếng Việt', required: true },
    { name: 'order', label: 'Thứ tự', type: 'number' },
    { name: 'audioUrl', label: 'File nghe (thay cho giọng đọc máy)', type: 'audio', hint: 'Sau khi bấm "Dùng file này", nhớ bấm "Lưu thay đổi" để áp dụng.' },
    { name: 'questions', label: 'Câu hỏi trắc nghiệm', type: 'questions', questionKey: 'q' }
  ];

  const columns = [
    { key: 'hanzi', label: '汉字' },
    { key: 'vi', label: 'Nghĩa' },
    { key: 'category', label: 'Mục' },
    { key: 'audioUrl', label: 'File nghe', render: (item) => (item.audioUrl ? 'File tải lên' : 'Giọng máy') }
  ];

  if (!lockedLessonId && lessons.length === 0) return <p className="empty-state">Đang tải danh sách bài học...</p>;

  return (
    <AdminCrud
      title="Quản lý câu (đọc/nghe/hội thoại)"
      endpoint="/sentences"
      fields={fields}
      filterKey={lockedLessonId ? undefined : 'lessonId'}
      filterOptions={lockedLessonId ? undefined : lessonOptions}
      filterValue={lockedLessonId ? undefined : lessonId}
      onFilterChange={lockedLessonId ? undefined : setLessonId}
      fixedValues={lockedLessonId ? { lessonId: lockedLessonId } : undefined}
      listColumns={columns}
      sortable
    />
  );
}
