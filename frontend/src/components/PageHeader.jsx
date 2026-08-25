import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/**
 * Tiêu đề dùng chung cho mọi trang chức năng chi tiết trong bài học (Từ vựng,
 * Flashcard, Ngữ pháp, Game, Nghe, Đọc, Dịch, Shadowing, Video, Bài hát, PPT,
 * Kết quả...). Icon màu theo từng module giúp người học nhận diện xuyên suốt,
 * đồng bộ với màu đã dùng ở danh sách module trên trang bài học.
 */
export default function PageHeader({ icon: Icon, color = 'var(--primary)', title, subtitle, backTo, backLabel = 'Quay lại bài học', right }) {
  return (
    <div className="page-header">
      {backTo && (
        <Link to={backTo} className="top-back-link">
          <ChevronLeft size={14} /> {backLabel}
        </Link>
      )}
      <div className="page-header-row">
        {Icon && (
          <span className="page-header-icon" style={{ background: color }}>
            <Icon size={22} />
          </span>
        )}
        <div className="page-header-text">
          <h1 className="page-header-title">{title}</h1>
          {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
        </div>
        {right && <div className="page-header-right">{right}</div>}
      </div>
    </div>
  );
}
