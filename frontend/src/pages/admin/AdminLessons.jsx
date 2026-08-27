import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PenSquare } from 'lucide-react';
import api from '../../api/client';
import AdminCrud from '../../components/AdminCrud';

/** levelId: khi truyền vào, khoá danh sách theo đúng cấp độ đó (dùng trong trang chi tiết cấp độ), ẩn ô chọn cấp độ. */
export default function AdminLessons({ levelId: lockedLevelId }) {
  const [levels, setLevels] = useState([]);

  useEffect(() => { if (!lockedLevelId) api.get('/levels').then((res) => setLevels(res.data)); }, [lockedLevelId]);

  const levelOptions = levels.map((l) => ({ value: l.id, label: `${l.code} - ${l.name}` }));
  const levelName = (id) => levels.find((l) => l.id === id)?.code || id;

  const fields = [
    ...(lockedLevelId ? [] : [{ name: 'levelId', label: 'Thuộc cấp độ', type: 'select', options: levelOptions, required: true }]),
    { name: 'order', label: 'Thứ tự bài', type: 'number' },
    { name: 'title', label: 'Tiêu đề bài học (VD: Bài 1: 你好 - Xin chào)', required: true },
    { name: 'description', label: 'Mô tả ngắn', type: 'textarea' },
    { name: 'published', label: 'Xuất bản', type: 'boolean' }
  ];

  const columns = [
    { key: 'order', label: 'TT' },
    { key: 'title', label: 'Tiêu đề' },
    ...(lockedLevelId ? [] : [{ key: 'levelId', label: 'Cấp độ', render: (item) => levelName(item.levelId) }]),
    { key: 'published', label: 'Xuất bản', render: (item) => (item.published ? 'Có' : 'Không') }
  ];

  if (!lockedLevelId && levels.length === 0) return <p className="empty-state">Đang tải danh sách cấp độ...</p>;

  return (
    <AdminCrud
      title="Quản lý bài học"
      endpoint="/lessons"
      fields={fields}
      filterKey={lockedLevelId ? undefined : undefined}
      fixedValues={lockedLevelId ? { levelId: lockedLevelId } : undefined}
      listColumns={columns}
      renderRowExtra={lockedLevelId ? (item) => (
        <Link to={`/admin/levels/${lockedLevelId}/lessons/${item.id}`} className="btn-secondary">
          <PenSquare size={13} style={{ marginRight: 4, verticalAlign: -2 }} />Nội dung
        </Link>
      ) : undefined}
    />
  );
}
