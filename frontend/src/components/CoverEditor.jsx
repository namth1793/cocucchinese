import { useState } from 'react';
import api from '../api/client';
import CourseCover from './CourseCover';

/**
 * Upload/đổi/xoá ảnh bìa cấp độ - lưu ngay khi chọn file (không cần bấm "Lưu thay đổi" của form).
 * Dùng ở trang sửa cấp độ và mục "Ảnh bìa sách" của /admin/homepage.
 */
export default function CoverEditor({ level, onChanged, label, colorIndex = 0 }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const upload = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Vui lòng chọn file ảnh (JPG, PNG, WEBP).'); return; }
    if (file.size > 15 * 1024 * 1024) { setError('Ảnh quá lớn (tối đa 15MB).'); return; }
    setError('');
    setBusy(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res = await api.post(`/levels/${level.id}/cover`, body);
      onChanged(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Tải ảnh lên thất bại, vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Xoá ảnh bìa của ${level.name || 'cấp độ này'}?`)) return;
    setBusy(true);
    setError('');
    try {
      const res = await api.delete(`/levels/${level.id}/cover`);
      onChanged(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Xoá ảnh thất bại, vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="form-field">
      {label && <label>{label}</label>}
      {error && <div className="form-error">{error}</div>}
      <div className="cover-editor">
        <CourseCover course={level} colorIndex={colorIndex} className="cover-thumb" />
        <div className="cover-editor-actions">
          <label className={`btn-secondary cover-upload-btn ${busy ? 'disabled' : ''}`}>
            {busy ? 'Đang tải...' : (level.coverUrl ? 'Đổi ảnh bìa' : 'Tải ảnh bìa lên')}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={upload} disabled={busy} hidden />
          </label>
          {level.coverUrl && <button type="button" className="btn-danger" onClick={remove} disabled={busy}>Xoá ảnh</button>}
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>JPG/PNG/WEBP, tối đa 15MB. Nên dùng ảnh bìa dọc (tỉ lệ ~4:5).</span>
        </div>
      </div>
    </div>
  );
}
