import { useEffect, useState } from 'react';
import api from '../../api/client';
import AdminCrud from '../../components/AdminCrud';

export default function AdminDialogues({ lessonId: lockedLessonId }) {
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState('');

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
    { key: 'lines', label: 'Số câu thoại', render: (item) => (item.lines || []).length }
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
    />
  );
}
