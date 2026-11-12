import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, LogIn, Sparkles, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import Logo from '../components/Logo';
import AuthSidePanel from '../components/AuthSidePanel';

/** Tự đăng ký: tài khoản tạo ở trạng thái chờ duyệt, admin duyệt xong mới đăng nhập được. */
function RegisterForm({ onDone }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError('Mật khẩu nhập lại không khớp'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        name: form.name, email: form.email, phone: form.phone, password: form.password
      });
      onDone(data.email);
    } catch (err) {
      setError(err?.response?.data?.error || 'Đăng ký thất bại, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit}>
      {error && <div className="form-error">{error}</div>}
      <div className="form-field">
        <label>Họ và tên</label>
        <input value={form.name} onChange={set('name')} required maxLength={100} autoComplete="name" />
      </div>
      <div className="form-field">
        <label>Email (dùng để đăng nhập)</label>
        <input type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
      </div>
      <div className="form-field">
        <label>Số điện thoại (không bắt buộc)</label>
        <input value={form.phone} onChange={set('phone')} inputMode="tel" maxLength={30} autoComplete="tel" />
      </div>
      <div className="form-field">
        <label>Mật khẩu (tối thiểu 6 ký tự)</label>
        <input type="password" value={form.password} onChange={set('password')} required minLength={6} autoComplete="new-password" />
      </div>
      <div className="form-field">
        <label>Nhập lại mật khẩu</label>
        <input type="password" value={form.confirm} onChange={set('confirm')} required minLength={6} autoComplete="new-password" />
      </div>
      <button type="submit" className="btn-primary btn-block" disabled={loading}>
        <UserPlus size={17} />
        {loading ? 'Đang gửi...' : 'Đăng ký tài khoản'}
      </button>
    </form>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotNote, setShowForgotNote] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const mode = searchParams.get('dang-ky') !== null ? 'register' : 'login';
  const setMode = (m) => { setError(''); setRegistered(''); setSearchParams(m === 'register' ? { 'dang-ky': '' } : {}, { replace: true }); };
  // Email vừa đăng ký xong (đang chờ duyệt) - hiện thông báo thay cho form.
  const [registered, setRegistered] = useState('');

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
            <h1 className="auth-title">{mode === 'register' ? 'Tạo tài khoản mới ✨' : 'Chào mừng trở lại 👋'}</h1>
            <p className="auth-sub">
              {mode === 'register'
                ? 'Đăng ký xong, tài khoản cần quản trị viên duyệt trước khi đăng nhập được.'
                : 'Đăng nhập để tiếp tục hành trình chinh phục HSK/YCT'}
            </p>
            <div className="auth-mode-tabs" role="tablist">
              <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Đăng nhập</button>
              <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Đăng ký</button>
            </div>
            {mode === 'register' && registered && (
              <div className="auth-pending-note">
                <CheckCircle2 size={22} />
                <div>
                  <b>Đã gửi đăng ký cho {registered}</b>
                  <span>Tài khoản đang chờ quản trị viên duyệt. Sau khi được duyệt, bạn đăng nhập bằng email và mật khẩu vừa tạo.</span>
                  <button type="button" className="link-btn" onClick={() => setMode('login')}>Về trang đăng nhập</button>
                </div>
              </div>
            )}
            {mode === 'register' && !registered && <RegisterForm onDone={(email) => { setRegistered(email); setEmail(email); }} />}
            {mode === 'login' && (
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
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {showForgotNote && (
                <p className="auth-forgot-note">Vui lòng liên hệ quản trị viên để được cấp lại mật khẩu.</p>
              )}
              <button type="submit" className="btn-primary btn-block" disabled={loading}>
                <LogIn size={17} />
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
              <p className="auth-switch-note">
                Chưa có tài khoản? <button type="button" className="link-btn" onClick={() => setMode('register')}>Đăng ký ngay</button>
              </p>
            </form>
            )}
            <p className="auth-footer-link">
              <Link to="/" className="auth-home-link"><ArrowLeft size={15} /> Quay lại trang chủ</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
