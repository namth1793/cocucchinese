import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { unlockTests } from '../utils/testUnlock';

/** Ô nhập mã code để mở phần bài kiểm tra của 1 khoá học. */
export default function TestCodeForm({ levelId, onUnlocked, hint }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setError('');
    setLoading(true);
    try {
      onUnlocked(await unlockTests(code, levelId));
    } catch (err) {
      setError(err?.response?.data?.error || 'Không kiểm tra được mã, vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="test-code-form" onSubmit={submit}>
      <span className="test-code-icon"><KeyRound size={20} /></span>
      <div className="test-code-body">
        <b>Nhập mã code để làm bài kiểm tra</b>
        <span>{hint || 'Mã code do giáo viên/trung tâm cung cấp. Nhập 1 lần là làm được mọi bài kiểm tra của khoá này.'}</span>
        <div className="test-code-row">
          <input
            value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="VD: HSK1-ABCD" aria-label="Mã code" autoComplete="off" spellCheck={false}
          />
          <button type="submit" className="btn-primary" disabled={loading || !code.trim()}>{loading ? 'Đang kiểm tra...' : 'Xác nhận'}</button>
        </div>
        {error && <div className="form-error">{error}</div>}
      </div>
    </form>
  );
}
