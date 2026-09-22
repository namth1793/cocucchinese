const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../db');
const access = require('../utils/access');

const { ENROLLMENT_STATUS } = access;

function findUserByEmail(email) {
  const wanted = access.normalizeEmail(email);
  return db.findWhere('users', (u) => access.normalizeEmail(u.email) === wanted)[0] || null;
}

function randomPassword() {
  // 10 ký tự dễ đọc (không có 0/O/1/l/I) để admin gửi cho học viên.
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 10; i++) out += alphabet[crypto.randomInt(alphabet.length)];
  return out;
}

/**
 * Trả về tài khoản học viên theo email, tạo mới nếu chưa có.
 * - Có passwordHash (học viên đã tự đặt mật khẩu lúc đăng ký mua): dùng luôn.
 * - Không có: sinh mật khẩu tạm và trả về `tempPassword` (chỉ lộ đúng 1 lần cho admin).
 * Email đã thuộc tài khoản khác thì giữ nguyên tài khoản đó, không đổi mật khẩu.
 */
function ensureStudent({ name, email, passwordHash }) {
  const existing = findUserByEmail(email);
  if (existing) return { user: existing, created: false, tempPassword: null };
  let tempPassword = null;
  let hash = passwordHash;
  if (!hash) {
    tempPassword = randomPassword();
    hash = bcrypt.hashSync(tempPassword, 10);
  }
  const user = db.insert('users', {
    name: name || access.normalizeEmail(email).split('@')[0],
    email: access.normalizeEmail(email),
    passwordHash: hash,
    role: 'student', status: 'active', activeSessions: []
  });
  return { user, created: true, tempPassword };
}

/** Cấp (hoặc cấp lại) quyền truy cập 1 khoá cho 1 học viên. */
function grantEnrollment({ user, levelId, orderId = null, grantedBy = null, note = '' }) {
  const existing = db.findWhere('enrollments', (e) => e.userId === user.id && e.levelId === levelId)[0];
  const now = new Date().toISOString();
  if (existing) {
    if (access.ACTIVE_STATUSES.includes(existing.status)) return existing;
    return db.update('enrollments', existing.id, {
      status: ENROLLMENT_STATUS.PURCHASED, grantedAt: now, grantedBy,
      orderId: orderId || existing.orderId, revokedAt: null, note: note || existing.note
    });
  }
  return db.insert('enrollments', {
    userId: user.id, email: access.normalizeEmail(user.email), levelId,
    status: ENROLLMENT_STATUS.PURCHASED, orderId, grantedBy, grantedAt: now, note
  });
}

module.exports = { findUserByEmail, ensureStudent, grantEnrollment, randomPassword };
