import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import AuthSidePanel from '../components/AuthSidePanel';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.error || 'Đăng ký thất bại');
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
            <span className="auth-badge-pill"><Sparkles size={12} /> Miễn phí, học ngay hôm nay</span>
            <h1 className="auth-title">Tạo tài khoản học viên 🎒</h1>
            <p className="auth-sub">Bắt đầu lộ trình học tiếng Trung của riêng bạn</p>
            <form onSubmit={submit}>
              {error && <div className="form-error">{error}</div>}
              <div className="form-field">
                <label>Họ và tên</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="form-field">
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="form-field">
                <label>Mật khẩu (tối thiểu 6 ký tự)</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
              </div>
              <button type="submit" className="btn-primary btn-block" disabled={loading}>
                <UserPlus size={17} />
                {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
              </button>
            </form>
            <p className="auth-footer-link">
              Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
