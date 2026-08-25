import { useEffect, useState } from 'react';
import api from '../../api/client';
import AdminCrud from '../../components/AdminCrud';

export default function AdminSongs() {
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState('');

  useEffect(() => { api.get('/lessons').then((res) => setLessons(res.data)); }, []);

  const lessonOptions = lessons.map((l) => ({ value: l.id, label: l.title }));

  const fields = [
    { name: 'lessonId', label: 'Thuộc bài học', type: 'select', options: lessonOptions, required: true },
    { name: 'title', label: 'Tên bài hát', required: true },
    { name: 'mediaUrl', label: 'Link nhạc/audio (mp3 hoặc URL công khai)' },
    {
      name: 'lines', label: 'Lời bài hát theo câu (JSON mảng)', type: 'json',
      default: [],
      hint: 'VD: [{"start":0,"end":3,"hanzi":"你好你好","pinyin":"nǐ hǎo nǐ hǎo","vi":"Xin chào, xin chào"}] (start/end tính bằng giây)'
    },
    { name: 'grammarNotes', label: 'Từ vựng/ngữ pháp học được qua bài hát', type: 'textarea' }
  ];

  const columns = [
    { key: 'title', label: 'Tên bài hát' },
    { key: 'lines', label: 'Số câu', render: (item) => (item.lines || []).length }
  ];

  if (lessons.length === 0) return <p className="empty-state">Đang tải danh sách bài học...</p>;

  return (
    <AdminCrud
      title="Quản lý bài hát"
      endpoint="/songs"
      fields={fields}
      filterKey="lessonId"
      filterOptions={lessonOptions}
      filterValue={lessonId}
      onFilterChange={setLessonId}
      listColumns={columns}
    />
  );
}
