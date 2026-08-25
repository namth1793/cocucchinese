import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, GraduationCap, Layers, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

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
      <div className="auth-card card">
        <div className="auth-panel-brand">
          <Logo size="lg" showText={false} />
          <h2>Bắt đầu lộ trình học tiếng Trung của riêng bạn</h2>
          <p>Tạo tài khoản miễn phí để lưu tiến độ, ôn tập từ/câu đã sai và theo dõi kết quả từng bài học.</p>
          <div className="auth-panel-divider" />
          <div className="auth-feature-list">
            <span className="auth-feature-item"><GraduationCap size={16} /> Lộ trình theo cấp độ HSK / YCT</span>
            <span className="auth-feature-item"><Layers size={16} /> Flashcard ghi nhớ từ vựng thông minh</span>
            <span className="auth-feature-item"><Trophy size={16} /> Theo dõi kết quả và ôn tập cá nhân hoá</span>
          </div>
        </div>
        <div className="auth-panel-form">
          <div className="auth-brand"><Logo size="lg" showText={false} /></div>
          <h1 className="auth-title">Tạo tài khoản học viên</h1>
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
  );
}
