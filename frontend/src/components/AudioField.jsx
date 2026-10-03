import { useEffect, useRef, useState } from 'react';
import { Check, Music, Trash2, Upload, X } from 'lucide-react';
import api from '../api/client';
import useAuthMedia from '../utils/useAuthMedia';

const AUDIO_ACCEPT = '.mp3,.m4a,.wav,.ogg,.aac,.webm,audio/*';

/** Tải 1 file nghe lên kho media, trả về URL để lưu vào bản ghi. */
export async function uploadAudio(file) {
  const fd = new FormData();
  fd.append('kind', 'audio');
  fd.append('file', file);
  const res = await api.post('/media', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data.url;
}

/**
 * Ô quản lý file nghe dùng chung (từ vựng, câu, hội thoại...): chọn file -> nghe thử ngay trên
 * máy -> bấm "Dùng file này" mới thực sự tải lên và lưu. Có thay file và xoá file.
 * onChange(url | null) do nơi dùng tự lưu vào bản ghi (có thể là async).
 */
export default function AudioField({ value, onChange, compact = false, disabled = false }) {
  const fileRef = useRef(null);
  const [pending, setPending] = useState(null); // { file, previewUrl }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const currentUrl = useAuthMedia(value || null);

  useEffect(() => () => { if (pending) URL.revokeObjectURL(pending.previewUrl); }, [pending]);

  const pick = (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 30 * 1024 * 1024) { setError('File quá lớn (tối đa 30MB).'); return; }
    setError('');
    setPending({ file, previewUrl: URL.createObjectURL(file) });
  };

  const confirm = async () => {
    setBusy(true);
    setError('');
    try {
      const url = await uploadAudio(pending.file);
      await onChange(url);
      setPending(null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Tải file nghe thất bại, vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Xoá file nghe này? Học viên sẽ nghe bằng giọng đọc tự động.')) return;
    setBusy(true);
    try { await onChange(null); } finally { setBusy(false); }
  };

  return (
    <div className={`audio-field ${compact ? 'compact' : ''}`}>
      {pending ? (
        <div className="audio-field-pending">
          <span className="audio-field-label">Nghe thử: <b>{pending.file.name}</b></span>
          <audio controls src={pending.previewUrl} />
          <span className="audio-field-actions">
            <button type="button" className="btn-primary audio-field-btn" onClick={confirm} disabled={busy}>
              <Check size={14} /> {busy ? 'Đang lưu...' : (value ? 'Thay bằng file này' : 'Dùng file này')}
            </button>
            <button type="button" className="btn-secondary audio-field-btn" onClick={() => setPending(null)} disabled={busy}>
              <X size={14} /> Huỷ
            </button>
          </span>
        </div>
      ) : (
        <div className="audio-field-current">
          {value ? (
            currentUrl ? <audio controls src={currentUrl} preload="none" /> : <span className="audio-field-label"><Music size={14} /> Đang tải...</span>
          ) : (
            <span className="audio-field-empty">{compact ? 'Giọng máy' : 'Chưa có file nghe - đang dùng giọng đọc tự động'}</span>
          )}
          <span className="audio-field-actions">
            <button type="button" className="btn-secondary audio-field-btn" onClick={() => fileRef.current?.click()} disabled={busy || disabled} title={value ? 'Thay file nghe' : 'Tải file nghe'}>
              <Upload size={14} />{!compact && (value ? ' Thay file' : ' Tải file nghe')}
            </button>
            {value && (
              <button type="button" className="btn-danger audio-field-btn" onClick={remove} disabled={busy || disabled} title="Xoá file nghe">
                <Trash2 size={14} />{!compact && ' Xoá'}
              </button>
            )}
          </span>
        </div>
      )}
      {error && <span className="audio-field-error">{error}</span>}
      <input ref={fileRef} type="file" accept={AUDIO_ACCEPT} hidden onChange={pick} />
    </div>
  );
}
