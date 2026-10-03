import { useEffect, useState } from 'react';
import api from '../../api/client';
import AdminCrud from '../../components/AdminCrud';

export default function AdminGrammar({ lessonId: lockedLessonId }) {
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState('');

  useEffect(() => { if (!lockedLessonId) api.get('/lessons').then((res) => setLessons(res.data)); }, [lockedLessonId]);

  const lessonOptions = lessons.map((l) => ({ value: l.id, label: l.title }));

  const fields = [
    ...(lockedLessonId ? [] : [{ name: 'lessonId', label: 'Thuộc bài học', type: 'select', options: lessonOptions, required: true }]),
    { name: 'structure', label: 'Cấu trúc (VD: A + 是 + B)', required: true },
    { name: 'usageVi', label: 'Cách dùng (giải thích tiếng Việt)', type: 'textarea', required: true },
    { name: 'example', label: 'Ví dụ', type: 'example' },
    { name: 'notes', label: 'Lưu ý / lỗi thường gặp', type: 'textarea' },
    { name: 'exercises', label: 'Bài tập trắc nghiệm', type: 'questions', questionKey: 'question', questionExtra: { type: 'mcq' } }
  ];

  const columns = [
    { key: 'structure', label: 'Cấu trúc' },
    { key: 'usageVi', label: 'Cách dùng' },
    { key: 'exercises', label: 'Bài tập', render: (item) => `${(item.exercises || []).length} câu` }
  ];

  if (!lockedLessonId && lessons.length === 0) return <p className="empty-state">Đang tải danh sách bài học...</p>;

  return (
    <AdminCrud
      title="Quản lý ngữ pháp"
      endpoint="/grammar"
      fields={fields}
      filterKey={lockedLessonId ? undefined : 'lessonId'}
      filterOptions={lockedLessonId ? undefined : lessonOptions}
      filterValue={lockedLessonId ? undefined : lessonId}
      onFilterChange={lockedLessonId ? undefined : setLessonId}
      fixedValues={lockedLessonId ? { lessonId: lockedLessonId } : undefined}
      listColumns={columns}
    />
  );
}
