import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import AuthSidePanel from '../components/AuthSidePanel';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('student@hsk360.vn');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotNote, setShowForgotNote] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.error || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <AuthSidePanel />
        <div className="auth-panel-form">
          <div className="auth-panel-form-logo"><Logo size="sm" /></div>
          <div className="auth-panel-form-inner">
            <span className="auth-badge-pill"><Sparkles size={12} /> Học mỗi ngày, giỏi tiếng Trung nhanh hơn</span>
            <h1 className="auth-title">Chào mừng trở lại 👋</h1>
            <p className="auth-sub">Đăng nhập để tiếp tục hành trình chinh phục HSK/YCT</p>
            <form onSubmit={submit}>
              {error && <div className="form-error">{error}</div>}
              <div className="form-field">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-field">
                <div className="auth-field-row">
                  <label>Mật khẩu</label>
                  <button type="button" className="auth-forgot-link" onClick={() => setShowForgotNote((v) => !v)}>Quên mật khẩu?</button>
                </div>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {showForgotNote && (
                <p className="auth-forgot-note">Vui lòng liên hệ giáo viên hoặc quản trị viên lớp học để được cấp lại mật khẩu.</p>
              )}
              <button type="submit" className="btn-primary btn-block" disabled={loading}>
                <LogIn size={17} />
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>
            <p className="auth-footer-link">
              Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </p>
            <div className="auth-demo">
              <b>Tài khoản demo</b><br />
              Học sinh: student@hsk360.vn / student123<br />
              Giáo viên: teacher@hsk360.vn / teacher123<br />
              Quản trị: admin@hsk360.vn / admin123
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
