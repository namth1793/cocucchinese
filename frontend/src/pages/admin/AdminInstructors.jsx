import { useState } from 'react';
import { Camera } from 'lucide-react';
import api from '../../api/client';
import AdminCrud from '../../components/AdminCrud';
import AuthImage from '../../components/AuthImage';

export default function AdminInstructors() {
  const [uploadedUrl, setUploadedUrl] = useState('');

  const fields = [
    { name: 'name', label: 'Họ và tên', required: true },
    { name: 'title', label: 'Chức danh (VD: Giáo viên, Trưởng bộ môn...)' },
    { name: 'avatarUrl', label: 'Đường dẫn ảnh đại diện', hint: 'Tải ảnh lên bên dưới rồi dán đường dẫn vào đây.' },
    { name: 'bio', label: 'Giới thiệu / kinh nghiệm / bằng cấp', type: 'textarea' },
    { name: 'order', label: 'Thứ tự hiển thị', type: 'number', default: 1 }
  ];

  const columns = [
    {
      key: 'avatarUrl', label: 'Ảnh',
      render: (item) => (item.avatarUrl
        ? <AuthImage src={item.avatarUrl} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
        : '—')
    },
    { key: 'name', label: 'Họ và tên' },
    { key: 'title', label: 'Chức danh' }
  ];

  const uploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', 'giang-vien');
    const res = await api.post('/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setUploadedUrl(res.data.url);
  };

  return (
    <div>
      <div className="card">
        <label style={{ fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Camera size={15} /> Tải ảnh đại diện giảng viên lên
        </label>
        <input type="file" accept="image/*" onChange={uploadImage} style={{ marginTop: 8 }} />
        {uploadedUrl && (
          <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AuthImage src={uploadedUrl} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
            <code style={{ fontSize: 12, wordBreak: 'break-all' }}>{uploadedUrl}</code>
          </div>
        )}
      </div>
      <AdminCrud
        title="Quản lý giảng viên"
        endpoint="/instructors"
        fields={fields}
        listColumns={columns}
      />
    </div>
  );
}
