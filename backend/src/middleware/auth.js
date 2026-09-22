const jwt = require('jsonwebtoken');
const db = require('../db');
const access = require('../utils/access');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Chưa đăng nhập' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.find('users', payload.sub);
    if (!user || user.status === 'locked') return res.status(401).json({ error: 'Tài khoản không hợp lệ' });
    // Học viên chỉ được dùng hệ thống khi email còn quyền truy cập ít nhất 1 khoá học
    // (quyền bị thu hồi thì phiên đang mở cũng mất hiệu lực ngay).
    if (!access.hasAnyAccess(user)) return res.status(401).json({ error: 'Email của bạn chưa được cấp quyền truy cập khoá học nào' });
    const session = (user.activeSessions || []).find((s) => s.jti === payload.jti);
    if (!session) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại' });
    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    req.jti = payload.jti;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token không hợp lệ' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Không đủ quyền truy cập' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole, JWT_SECRET };
