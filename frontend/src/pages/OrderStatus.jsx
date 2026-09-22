import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Clock, Copy, XCircle } from 'lucide-react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import { formatVnd } from '../constants/enrollment';

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(String(value));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) { /* trình duyệt không cho phép - người dùng tự copy */ }
  };
  return (
    <div className="pay-row">
      <span className="pay-label">{label}</span>
      <span className="pay-value">{value}</span>
      <button type="button" className="pay-copy" onClick={copy} aria-label={`Sao chép ${label}`}>
        {copied ? 'Đã chép' : <Copy size={14} />}
      </button>
    </div>
  );
}

/** Trang sau khi đăng ký: hướng dẫn chuyển khoản + theo dõi trạng thái xác nhận thanh toán. */
export default function OrderStatus() {
  const { code } = useParams();
  const [order, setOrder] = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let timer;
    let cancelled = false;
    const load = () => api.get(`/orders/lookup/${code}`)
      .then((res) => {
        if (cancelled) return;
        setOrder(res.data);
        if (res.data.status === 'pending') timer = setTimeout(load, 15000);
      })
      .catch(() => { if (!cancelled) setNotFound(true); });
    load();
    return () => { cancelled = true; clearTimeout(timer); };
  }, [code]);

  if (notFound) return <p className="empty-state">Không tìm thấy đơn đăng ký. <Link to="/courses">Xem khoá học</Link></p>;
  if (!order) return <p className="empty-state">Đang tải...</p>;

  const { payment } = order;
  const hasBankInfo = payment.bankName || payment.accountNumber;

  return (
    <div className="pub-narrow">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <h2 style={{ margin: 0 }}>Đơn đăng ký {order.code}</h2>
          <StatusBadge kind="order" status={order.status} />
        </div>
        <p style={{ margin: '0 0 4px' }}><b>{order.courseName}</b> · {formatVnd(order.amount)}</p>
        <p style={{ margin: 0, color: 'var(--ink-soft)', fontSize: 13.5 }}>{order.name} · {order.email}</p>
      </div>

      {order.status === 'pending' && (
        <div className="card">
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={18} /> Chuyển khoản để hoàn tất</h3>
          {hasBankInfo ? (
            <>
              <CopyRow label="Ngân hàng" value={payment.bankName} />
              <CopyRow label="Số tài khoản" value={payment.accountNumber} />
              <CopyRow label="Chủ tài khoản" value={payment.accountName} />
              <CopyRow label="Số tiền" value={formatVnd(order.amount)} />
              <CopyRow label="Nội dung CK" value={payment.transferContent} />
            </>
          ) : (
            <p>Vui lòng liên hệ quản trị viên để nhận thông tin chuyển khoản, kèm mã đơn <b>{order.code}</b>.</p>
          )}
          <p className="pub-field-note" style={{ marginTop: 12 }}>
            Hãy ghi đúng nội dung chuyển khoản là <b>{order.code}</b> để được xác nhận nhanh.
            {payment.note ? ` ${payment.note}` : ''} Trang này tự cập nhật khi đơn được xác nhận.
          </p>
        </div>
      )}

      {order.status === 'paid' && (
        <div className="card" style={{ textAlign: 'center' }}>
          <CheckCircle2 size={34} color="var(--jade)" />
          <h3 style={{ margin: '8px 0 4px' }}>Thanh toán đã được xác nhận</h3>
          <p style={{ color: 'var(--ink-soft)', margin: '0 0 14px' }}>
            Email <b>{order.email}</b> đã được cấp quyền học. Đăng nhập bằng email này để vào khoá học.
          </p>
          <Link to="/login" className="btn-primary">Đăng nhập để học</Link>
        </div>
      )}

      {order.status === 'rejected' && (
        <div className="card" style={{ textAlign: 'center' }}>
          <XCircle size={34} color="var(--wrong)" />
          <h3 style={{ margin: '8px 0 4px' }}>Đơn chưa được xác nhận</h3>
          <p style={{ color: 'var(--ink-soft)', margin: '0 0 14px' }}>Vui lòng liên hệ quản trị viên hoặc đăng ký lại.</p>
          <Link to="/courses" className="btn-secondary">Xem khoá học</Link>
        </div>
      )}
    </div>
  );
}
