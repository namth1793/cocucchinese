import { useEffect, useState } from 'react';
import api from '../../api/client';
import AdminCrud from '../../components/AdminCrud';

export default function AdminSpeaking({ lessonId: lockedLessonId }) {
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState('');

  useEffect(() => { if (!lockedLessonId) api.get('/lessons').then((res) => setLessons(res.data)); }, [lockedLessonId]);

  const lessonOptions = lessons.map((l) => ({ value: l.id, label: l.title }));

  const fields = [
    ...(lockedLessonId ? [] : [{ name: 'lessonId', label: 'Thuộc bài học', type: 'select', options: lessonOptions, required: true }]),
    { name: 'order', label: 'Thứ tự', type: 'number' },
    { name: 'context', label: 'Tình huống (tiếng Việt)', type: 'textarea', required: true },
    {
      name: 'options', label: 'Các lựa chọn (JSON mảng chữ Hán)', type: 'json', required: true,
      default: [],
      hint: 'VD: ["老师，你好！","老师，您好！","大家好！","再见！"]'
    },
    { name: 'answerIndex', label: 'Chỉ số đáp án đúng (bắt đầu từ 0)', type: 'number', required: true },
    { name: 'targetHanzi', label: 'Câu cần nói (Hán tự)' },
    { name: 'targetPinyin', label: 'Pinyin' },
    { name: 'explanation', label: 'Giải thích', type: 'textarea' }
  ];

  const columns = [
    { key: 'order', label: 'Thứ tự' },
    { key: 'context', label: 'Tình huống' },
    { key: 'targetHanzi', label: 'Câu cần nói' }
  ];

  if (!lockedLessonId && lessons.length === 0) return <p className="empty-state">Đang tải danh sách bài học...</p>;

  return (
    <AdminCrud
      title="Quản lý Luyện nói (tình huống)"
      endpoint="/speaking"
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
