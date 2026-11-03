import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, RotateCw } from 'lucide-react';
import api from '../api/client';
import { API_BASE, sandboxFor } from './HtmlLesson';
import TestCodeForm from '../components/TestCodeForm';
import { forgetTestUnlock, getTestUnlock, testUnlockHeaders } from '../utils/testUnlock';

/** Làm bài kiểm tra (file HTML của khoá học) toàn màn hình. */
export default function TestViewer() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [src, setSrc] = useState('');
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  // Chưa nhập mã code (hoặc mã đã bị tắt): { levelId, title } để hiện ô nhập mã.
  const [needCode, setNeedCode] = useState(null);

  useEffect(() => {
    setSrc('');
    setError('');
    setNeedCode(null);
    // Chưa biết bài thuộc khoá nào: hỏi không kèm mã trước (staff vào thẳng), server báo khoá của bài
    // thì gửi lại kèm token mở khoá đã lưu cho khoá đó.
    const tryToken = async () => {
      try {
        return await api.get(`/course-tests/${testId}/token`);
      } catch (err) {
        const levelId = err?.response?.data?.levelId;
        if (err?.response?.data?.code === 'TEST_CODE_REQUIRED' && levelId && getTestUnlock(levelId)) {
          try {
            return await api.get(`/course-tests/${testId}/token`, { headers: testUnlockHeaders(levelId) });
          } catch (err2) {
            // Mã đã lưu không còn hiệu lực (admin tắt/xoá mã) -> bỏ đi, yêu cầu nhập mã mới.
            if (err2?.response?.data?.code === 'TEST_CODE_REQUIRED') forgetTestUnlock(levelId);
            throw err2;
          }
        }
        throw err;
      }
    };
    tryToken()
      .then((res) => {
        setTest(res.data);
        setSrc(`${API_BASE}/course-tests/${testId}/view?token=${encodeURIComponent(res.data.token)}&v=${res.data.version}`);
      })
      .catch((err) => {
        const status = err?.response?.status;
        if (err?.response?.data?.code === 'TEST_CODE_REQUIRED') {
          setNeedCode({ levelId: err.response.data.levelId, title: err.response.data.title });
          return;
        }
        setError(status === 403 ? 'Bạn chưa được cấp quyền làm bài kiểm tra này.'
          : status === 404 ? 'Không tìm thấy bài kiểm tra.' : 'Không tải được bài kiểm tra, vui lòng thử lại.');
      });
  }, [testId, reloadKey]);

  return (
    <div className="html-viewer">
      <div className="html-viewer-bar">
        <button type="button" className="html-viewer-back" onClick={() => navigate(test || needCode ? `/courses/${(test || needCode).levelId}?muc=bai-kiem-tra` : '/courses')}>
          <ArrowLeft size={16} /> <span>Về khoá học</span>
        </button>
        <div className="html-viewer-title">{test?.title || needCode?.title || ''}</div>
        <div className="html-viewer-nav">
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} title="Tải lại"><RotateCw size={16} /></button>
        </div>
      </div>
      {error && <p className="empty-state" style={{ padding: 24 }}>{error}</p>}
      {needCode && (
        <div className="test-code-page">
          <TestCodeForm levelId={needCode.levelId} onUnlocked={() => setReloadKey((k) => k + 1)} />
        </div>
      )}
      {!error && !src && !needCode && <p className="empty-state" style={{ padding: 24 }}>Đang tải bài kiểm tra...</p>}
      {src && (
        <iframe
          key={src}
          title={test?.title || 'Bài kiểm tra'}
          src={src}
          sandbox={sandboxFor(src)}
          allow="autoplay; fullscreen; microphone"
          className="html-viewer-frame"
        />
      )}
    </div>
  );
}
