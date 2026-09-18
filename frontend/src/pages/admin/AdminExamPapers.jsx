import { useRef, useState } from 'react';
import { Upload, ExternalLink } from 'lucide-react';
import api from '../../api/client';
import AdminCrud from '../../components/AdminCrud';

/** Ô tải/thay file HTML đề thi (có thể tới hàng trăm MB). */
function ExamFileCell({ paper, onChanged }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const upload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      await api.post(`/exam-papers/${paper.id}/file`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChanged();
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {paper.url ? (
        <a href={paper.url} target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ExternalLink size={13} /> Xem thử
        </a>
      ) : (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Chưa có file</span>
      )}
      <button type="button" className="btn-secondary" disabled={uploading} onClick={() => fileRef.current?.click()}>
        <Upload size={13} style={{ verticalAlign: -2 }} /> {uploading ? 'Đang tải...' : paper.url ? 'Thay file' : 'Tải lên'}
      </button>
      <input ref={fileRef} type="file" accept=".html,.htm" hidden onChange={upload} />
    </div>
  );
}

/** levelId: dùng trong trang chi tiết cấp độ, khoá theo đúng cấp độ đó. */
export default function AdminExamPapers({ levelId: lockedLevelId }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const fields = [
    { name: 'group', label: 'Nhóm (VD: HSK1, HSK2, HSK3)', required: true },
    { name: 'order', label: 'Thứ tự trong nhóm', type: 'number' },
    { name: 'title', label: 'Tiêu đề (VD: Đề số 1)', required: true },
  ];

  const columns = [
    { key: 'group', label: 'Nhóm' },
    { key: 'order', label: 'TT' },
    { key: 'title', label: 'Tiêu đề' },
    {
      key: 'file', label: 'File đề thi (HTML)',
      render: (item) => <ExamFileCell paper={item} onChanged={() => setRefreshKey((k) => k + 1)} />
    }
  ];

  return (
    <AdminCrud
      title="Quản lý Đề thi thử"
      hint="Mỗi đề là 1 file HTML tự chứa (đồng hồ, phiếu trả lời, chấm điểm riêng) - tạo bản ghi trước, sau đó tải file lên. File có thể rất nặng (hàng chục–hàng trăm MB) nên nên bật Cloudflare R2 trước khi tải lên nhiều đề."
      endpoint="/exam-papers"
      fields={fields}
      fixedValues={{ levelId: lockedLevelId }}
      listColumns={columns}
      reloadToken={refreshKey}
    />
  );
}
