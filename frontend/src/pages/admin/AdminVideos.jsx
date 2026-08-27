import { useEffect, useState } from 'react';
import api from '../../api/client';
import AdminCrud from '../../components/AdminCrud';

export default function AdminVideos({ lessonId: lockedLessonId }) {
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState('');

  useEffect(() => { if (!lockedLessonId) api.get('/lessons').then((res) => setLessons(res.data)); }, [lockedLessonId]);

  const lessonOptions = lessons.map((l) => ({ value: l.id, label: l.title }));

  const fields = [
    ...(lockedLessonId ? [] : [{ name: 'lessonId', label: 'Thuộc bài học', type: 'select', options: lessonOptions, required: true }]),
    { name: 'title', label: 'Tiêu đề video', required: true },
    { name: 'url', label: 'Link video (YouTube hoặc URL công khai)', required: true },
    { name: 'description', label: 'Mô tả', type: 'textarea' },
    {
      name: 'lines', label: 'Bản chép theo câu (JSON mảng, không bắt buộc)', type: 'json',
      default: [],
      hint: 'VD: [{"start":0,"end":3,"hanzi":"你好","pinyin":"nǐ hǎo","vi":"Xin chào"}] (start/end tính bằng giây). Chỉ đồng bộ khi video là URL trực tiếp (mp4...), không áp dụng cho YouTube.'
    }
  ];

  const columns = [
    { key: 'title', label: 'Tiêu đề' },
    { key: 'url', label: 'Link' }
  ];

  if (!lockedLessonId && lessons.length === 0) return <p className="empty-state">Đang tải danh sách bài học...</p>;

  return (
    <AdminCrud
      title="Quản lý video tình huống"
      endpoint="/videos"
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
