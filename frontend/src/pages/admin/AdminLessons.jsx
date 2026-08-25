import { useEffect, useState } from 'react';
import api from '../../api/client';
import AdminCrud from '../../components/AdminCrud';

export default function AdminLessons() {
  const [levels, setLevels] = useState([]);

  useEffect(() => { api.get('/levels').then((res) => setLevels(res.data)); }, []);

  const levelOptions = levels.map((l) => ({ value: l.id, label: `${l.code} - ${l.name}` }));
  const levelName = (id) => levels.find((l) => l.id === id)?.code || id;

  const fields = [
    { name: 'levelId', label: 'Thuộc cấp độ', type: 'select', options: levelOptions, required: true },
    { name: 'order', label: 'Thứ tự bài', type: 'number' },
    { name: 'title', label: 'Tiêu đề bài học (VD: Bài 1: 你好 - Xin chào)', required: true },
    { name: 'description', label: 'Mô tả ngắn', type: 'textarea' },
    { name: 'published', label: 'Xuất bản', type: 'boolean' }
  ];

  const columns = [
    { key: 'order', label: 'TT' },
    { key: 'title', label: 'Tiêu đề' },
    { key: 'levelId', label: 'Cấp độ', render: (item) => levelName(item.levelId) },
    { key: 'published', label: 'Xuất bản', render: (item) => (item.published ? 'Có' : 'Không') }
  ];

  if (levels.length === 0) return <p className="empty-state">Đang tải danh sách cấp độ...</p>;

  return <AdminCrud title="Quản lý bài học" endpoint="/lessons" fields={fields} listColumns={columns} />;
}
