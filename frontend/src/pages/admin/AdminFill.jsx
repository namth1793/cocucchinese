import { useEffect, useState } from 'react';
import api from '../../api/client';
import AdminCrud from '../../components/AdminCrud';

export default function AdminFill({ lessonId: lockedLessonId }) {
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState('');

  useEffect(() => { if (!lockedLessonId) api.get('/lessons').then((res) => setLessons(res.data)); }, [lockedLessonId]);

  const lessonOptions = lessons.map((l) => ({ value: l.id, label: l.title }));

  const fields = [
    ...(lockedLessonId ? [] : [{ name: 'lessonId', label: 'Thuộc bài học', type: 'select', options: lessonOptions, required: true }]),
    { name: 'order', label: 'Thứ tự', type: 'number' },
    { name: 'pre', label: 'Đoạn trước chỗ trống' },
    { name: 'blank', label: 'Từ cần điền (đáp án đúng)', required: true },
    { name: 'post', label: 'Đoạn sau chỗ trống' },
    { name: 'hint', label: 'Gợi ý (nghĩa tiếng Việt)' },
    {
      name: 'alts', label: 'Các đáp án được chấp nhận (JSON mảng)', type: 'json', required: true,
      default: [],
      hint: 'VD: ["你好"] — có thể thêm nhiều biến thể đúng khác nhau'
    }
  ];

  const columns = [
    { key: 'order', label: 'Thứ tự' },
    { key: 'sentence', label: 'Câu', render: (item) => `${item.pre || ''}[${item.blank}]${item.post || ''}` },
    { key: 'hint', label: 'Gợi ý' }
  ];

  if (!lockedLessonId && lessons.length === 0) return <p className="empty-state">Đang tải danh sách bài học...</p>;

  return (
    <AdminCrud
      title="Quản lý Điền từ (Luyện viết)"
      endpoint="/fill"
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
