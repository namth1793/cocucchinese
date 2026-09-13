import { useEffect, useState } from 'react';
import api from '../../api/client';
import AdminCrud from '../../components/AdminCrud';

export default function AdminCharacters({ lessonId: lockedLessonId }) {
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState('');

  useEffect(() => { if (!lockedLessonId) api.get('/lessons').then((res) => setLessons(res.data)); }, [lockedLessonId]);

  const lessonOptions = lessons.map((l) => ({ value: l.id, label: l.title }));

  const fields = [
    ...(lockedLessonId ? [] : [{ name: 'lessonId', label: 'Thuộc bài học', type: 'select', options: lessonOptions, required: true }]),
    { name: 'char', label: '汉字 (chữ Hán)', required: true },
    { name: 'pinyin', label: 'Pinyin', required: true },
    { name: 'meaningVi', label: 'Nghĩa tiếng Việt', required: true },
    { name: 'strokes', label: 'Số nét', type: 'number' },
    { name: 'structure', label: 'Cấu trúc (VD: 左右, 上下, 独体)' },
    { name: 'radical', label: 'Bộ thủ' },
    { name: 'radicalMeaningVi', label: 'Nghĩa bộ thủ' },
    { name: 'build', label: 'Cấu tạo chữ', type: 'textarea' },
    { name: 'rule', label: 'Quy tắc viết (VD: 先左后右)' },
    { name: 'memo', label: 'Mẹo ghi nhớ', type: 'textarea' },
    {
      name: 'strokeSeq', label: 'Thứ tự nét (JSON mảng)', type: 'json',
      default: [],
      hint: 'VD: ["撇","竖","横","竖弯钩"]'
    }
  ];

  const columns = [
    { key: 'char', label: '汉字' },
    { key: 'pinyin', label: 'Pinyin' },
    { key: 'meaningVi', label: 'Nghĩa' },
    { key: 'strokes', label: 'Số nét' }
  ];

  if (!lockedLessonId && lessons.length === 0) return <p className="empty-state">Đang tải danh sách bài học...</p>;

  return (
    <AdminCrud
      title="Quản lý Chữ Hán"
      endpoint="/characters"
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
