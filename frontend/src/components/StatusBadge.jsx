import { ENROLLMENT_STATUS_COLOR, ENROLLMENT_STATUS_LABEL, ORDER_STATUS_LABEL } from '../constants/enrollment';

const ORDER_COLOR = {
  pending: { bg: '#FEF3C7', fg: '#B45309' },
  paid: { bg: '#D1FAE5', fg: '#047857' },
  rejected: { bg: '#F3F4F6', fg: '#6B7280' }
};

/** Nhãn trạng thái nhỏ dùng cho học viên (kind="enrollment") và đơn hàng (kind="order"). */
export default function StatusBadge({ status, kind = 'enrollment' }) {
  const labels = kind === 'order' ? ORDER_STATUS_LABEL : ENROLLMENT_STATUS_LABEL;
  const colors = (kind === 'order' ? ORDER_COLOR : ENROLLMENT_STATUS_COLOR)[status] || { bg: '#F3F4F6', fg: '#6B7280' };
  return <span className="status-badge" style={{ background: colors.bg, color: colors.fg }}>{labels[status] || status}</span>;
}
