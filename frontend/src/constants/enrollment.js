/** Trạng thái học viên trong 1 khoá - phải khớp ENROLLMENT_STATUS ở backend/src/utils/access.js. */
export const ENROLLMENT_STATUS_LABEL = {
  purchased: 'Đã mua',
  learning: 'Đang học',
  completed: 'Hoàn thành',
  revoked: 'Đã thu hồi'
};

export const ENROLLMENT_STATUS_COLOR = {
  purchased: { bg: '#DBEAFE', fg: '#1D4ED8' },
  learning: { bg: '#FEF3C7', fg: '#B45309' },
  completed: { bg: '#D1FAE5', fg: '#047857' },
  revoked: { bg: '#F3F4F6', fg: '#6B7280' }
};

export const ORDER_STATUS_LABEL = {
  pending: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  rejected: 'Đã từ chối'
};

export const formatVnd = (n) => (typeof n === 'number' ? `${n.toLocaleString('vi-VN')}đ` : 'Liên hệ');
