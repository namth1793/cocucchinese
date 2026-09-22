import { assetUrl } from '../utils/assetUrl';

const FALLBACK_COLORS = ['#DC2626', '#059669', '#D97706', '#2563EB', '#7C3AED', '#DB2777'];

/**
 * Ảnh bìa dạng bìa sách của khoá học/cấp độ. Chưa có ảnh thì hiện khung màu kèm mã cấp độ,
 * để lưới khoá học luôn đều nhau dù có khoá chưa upload bìa.
 */
export default function CourseCover({ course, colorIndex = 0, className = '' }) {
  if (course.coverUrl) {
    return (
      <span className={`cover-frame ${className}`}>
        <img src={assetUrl(course.coverUrl)} alt={`Bìa ${course.name}`} loading="lazy" />
      </span>
    );
  }
  return (
    <span className={`cover-frame cover-fallback ${className}`} style={{ background: FALLBACK_COLORS[colorIndex % FALLBACK_COLORS.length] }}>
      {course.code}
    </span>
  );
}
