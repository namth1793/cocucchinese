import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, BookOpen, Headphones, Mic2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('student@cocucchinese.vn');
  const [password, setPassword] = useState('student123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      <div className="auth-card card">
        <div className="auth-panel-brand">
          <Logo size="lg" showText={false} />
          <h2>Chinh phục HSK &amp; YCT cùng Cô Cúc Chinese</h2>
          <p>Từ vựng, ngữ pháp, luyện nghe – nói – đọc – dịch và game ôn tập trong một nền tảng duy nhất, học đến đâu chắc đến đó.</p>
          <div className="auth-panel-divider" />
          <div className="auth-feature-list">
            <span className="auth-feature-item"><BookOpen size={16} /> Song ngữ Trung – Việt, ẩn/hiện Pinyin tuỳ ý</span>
            <span className="auth-feature-item"><Headphones size={16} /> Luyện nghe, đọc, dịch theo từng bài học</span>
            <span className="auth-feature-item"><Mic2 size={16} /> Shadowing thu âm, so sánh phát âm</span>
          </div>
        </div>
        <div className="auth-panel-form">
          <div className="auth-brand"><Logo size="lg" showText={false} /></div>
          <h1 className="auth-title">Chào mừng trở lại</h1>
          <p className="auth-sub">Đăng nhập để tiếp tục hành trình chinh phục HSK/YCT</p>
          <form onSubmit={submit}>
            {error && <div className="form-error">{error}</div>}
            <div className="form-field">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Mật khẩu</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
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
            Học sinh: student@cocucchinese.vn / student123<br />
            Giáo viên: teacher@cocucchinese.vn / teacher123<br />
            Quản trị: admin@cocucchinese.vn / admin123
          </div>
        </div>
      </div>
    </div>
  );
}
