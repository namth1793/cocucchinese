import { useState } from 'react';
import { BookOpen } from 'lucide-react';
import GuidePopup from '../../components/GuidePopup';
import { ADMIN_GUIDES } from '../../constants/adminGuides';

const GROUPS = [
  { label: 'Khoá học', keys: ['home', 'levels', 'levelDetail'] },
  {
    label: 'Soạn nội dung bài học (các tab trong trang "Nội dung")',
    keys: ['lesson-layout', 'lesson-html', 'lesson-words', 'lesson-characters', 'lesson-dialogues', 'lesson-grammar',
      'lesson-sentences', 'lesson-speaking', 'lesson-fill', 'lesson-slides', 'lesson-videos', 'lesson-songs', 'lesson-docs']
  },
  { label: 'Khác', keys: ['instructors', 'students', 'users', 'consultations', 'homepage', 'typography'] }
];

const ADMIN_ONLY = ['students', 'users', 'consultations', 'homepage', 'typography'];

/** Tổng hợp mọi pop-up hướng dẫn - dùng chung nội dung với pop-up tự mở ở từng mục. */
export default function AdminGuide() {
  const [open, setOpen] = useState(null);

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
        <BookOpen size={20} /> Hướng dẫn sử dụng trang quản trị
      </h2>
      <p className="page-sub">
        Mỗi khi bấm vào một mục, hướng dẫn từng bước của mục đó tự hiện ra. Có thể mở lại bất cứ lúc nào bằng nút
        {' '}<b>Hướng dẫn</b> ở góc trên bên phải, hoặc bấm vào một thẻ dưới đây.
      </p>

      {GROUPS.map((g) => (
        <section key={g.label}>
          <div className="guide-index-group">{g.label}</div>
          <div className="guide-index">
            {g.keys.map((k) => (
              <button key={k} type="button" className="card guide-card" onClick={() => setOpen(k)}>
                <b>{ADMIN_GUIDES[k].title}</b>
                <span>{ADMIN_GUIDES[k].intro}</span>
                <small>{ADMIN_GUIDES[k].steps.length} bước{ADMIN_ONLY.includes(k) ? ' · chỉ Quản trị' : ''} →</small>
              </button>
            ))}
          </div>
        </section>
      ))}

      <section className="card" style={{ marginTop: 22 }}>
        <h3 style={{ marginTop: 0 }}>Lỗi thường gặp</h3>
        <ul style={{ fontSize: 13.5, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
          <li><b>Học viên chưa thấy bài vừa soạn:</b> kiểm tra bài đã bật <b>Xuất bản</b> (tab "Thông tin &amp; bố cục") và phần đó không bị ẩn (biểu tượng con mắt).</li>
          <li><b>Khoá học không hiện ở trang công khai:</b> khoá cần có <b>Học phí</b> và đang bật <b>Hiển thị công khai</b> (nút "Sửa thông tin cấp độ").</li>
          <li><b>Báo "Không đủ quyền truy cập":</b> thao tác đó chỉ tài khoản <b>Quản trị</b> làm được.</li>
          <li><b>Ô nhập dạng [ ... ] báo lỗi khi lưu:</b> kiểm tra dấu ngoặc vuông, ngoặc kép và dấu phẩy giữa các mục.</li>
          <li><b>Đã sửa nhưng web vẫn hiện bản cũ:</b> nhấn <b>Ctrl + Shift + R</b> để tải lại trang không dùng bộ nhớ đệm.</li>
        </ul>
      </section>

      {open && <GuidePopup guideKey={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
