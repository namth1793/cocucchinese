import { useEffect, useState } from 'react';
import { Camera } from 'lucide-react';
import api from '../../api/client';
import AdminCrud from '../../components/AdminCrud';
import AuthImage from '../../components/AuthImage';

/** lessonId: khi truyền vào, khoá bảng theo đúng bài học đó (dùng trong trang chỉnh sửa nội dung bài học), ẩn ô chọn bài học. */
export default function AdminWords({ lessonId: lockedLessonId }) {
  const [lessons, setLessons] = useState([]);
  const [lessonId, setLessonId] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState('');

  useEffect(() => { if (!lockedLessonId) api.get('/lessons').then((res) => setLessons(res.data)); }, [lockedLessonId]);

  const lessonOptions = lessons.map((l) => ({ value: l.id, label: l.title }));

  const fields = [
    ...(lockedLessonId ? [] : [{ name: 'lessonId', label: 'Thuộc bài học', type: 'select', options: lessonOptions, required: true }]),
    { name: 'hanzi', label: '汉字 (chữ Hán)', required: true },
    { name: 'pinyin', label: 'Pinyin', required: true },
    { name: 'meaningVi', label: 'Nghĩa tiếng Việt', required: true },
    { name: 'type', label: 'Loại từ (VD: Danh từ, Động từ...)' },
    { name: 'imageUrl', label: 'Đường dẫn hình ảnh minh hoạ', hint: 'Tải ảnh lên bên dưới rồi dán đường dẫn vào đây.' },
    {
      name: 'example', label: 'Ví dụ (JSON)', type: 'json',
      default: { hanzi: '', pinyin: '', vi: '' },
      hint: 'Định dạng: {"hanzi":"你好！","pinyin":"nǐ hǎo!","vi":"Xin chào!"}'
    }
  ];

  const columns = [
    { key: 'hanzi', label: '汉字' },
    { key: 'pinyin', label: 'Pinyin' },
    { key: 'meaningVi', label: 'Nghĩa' },
    {
      key: 'imageUrl', label: 'Ảnh',
      render: (item) => (item.imageUrl
        ? <AuthImage src={item.imageUrl} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
        : '—')
    }
  ];

  const uploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', 'tu-vung');
    const res = await api.post('/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setUploadedUrl(res.data.url);
  };

  if (!lockedLessonId && lessons.length === 0) return <p className="empty-state">Đang tải danh sách bài học...</p>;

  return (
    <div>
      <div className="card">
        <label style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Camera size={15} /> Tải ảnh minh hoạ mới lên thư viện
        </label>
        <input type="file" accept="image/*" onChange={uploadImage} style={{ marginTop: 8 }} />
        {uploadedUrl && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AuthImage src={uploadedUrl} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
            <code style={{ fontSize: 12, wordBreak: 'break-all' }}>{uploadedUrl}</code>
          </div>
        )}
      </div>
      <AdminCrud
        title="Quản lý từ vựng"
        endpoint="/words"
        fields={fields}
        filterKey={lockedLessonId ? undefined : 'lessonId'}
        filterOptions={lockedLessonId ? undefined : lessonOptions}
        filterValue={lockedLessonId ? undefined : lessonId}
        onFilterChange={lockedLessonId ? undefined : setLessonId}
        fixedValues={lockedLessonId ? { lessonId: lockedLessonId } : undefined}
        listColumns={columns}
      />
    </div>
  );
}
