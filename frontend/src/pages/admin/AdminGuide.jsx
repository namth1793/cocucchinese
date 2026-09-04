import { BookOpen } from 'lucide-react';

const TOC = [
  { id: 'cau-truc', label: '1. Cấu trúc dữ liệu (đọc trước tiên)' },
  { id: 'cap-do', label: '2. Sửa / thêm / xoá Cấp độ' },
  { id: 'bai-hoc', label: '3. Sửa / thêm / xoá Bài học' },
  { id: 'noi-dung-bai-hoc', label: '4. Sửa nội dung trong một bài học' },
  { id: 'giang-vien', label: '5. Quản lý Giảng viên' },
  { id: 'nguoi-dung', label: '6. Quản lý Người dùng & nhật ký (chỉ Admin)' },
  { id: 'meo', label: '7. Mẹo & lỗi thường gặp' }
];

function Section({ id, title, children }) {
  return (
    <section id={id} className="card" style={{ marginBottom: 16, scrollMarginTop: 16 }}>
      <h3 style={{ marginTop: 0, marginBottom: 10 }}>{title}</h3>
      {children}
    </section>
  );
}

function Step({ n, children }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
      <span style={{
        flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: 'var(--primary-soft)',
        color: 'var(--primary-dark)', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center',
        justifyContent: 'center', marginTop: 1
      }}>{n}</span>
      <div style={{ fontSize: 13.5, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function FieldTable({ rows }) {
  return (
    <div style={{ overflowX: 'auto', margin: '10px 0' }}>
      <table className="admin-table">
        <thead><tr><th>Trường</th><th>Ý nghĩa</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              <td><code>{r[0]}</code></td>
              <td style={{ fontSize: 12.5 }}>{r[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JsonExample({ children }) {
  return (
    <pre style={{
      background: 'var(--bg-alt)', border: '1px dashed var(--line-strong)', borderRadius: 8,
      padding: '10px 12px', fontSize: 11.5, overflowX: 'auto', margin: '6px 0 14px'
    }}>{children}</pre>
  );
}

export default function AdminGuide() {
  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
        <BookOpen size={20} /> Hướng dẫn sử dụng trang quản trị
      </h2>
      <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 0, marginBottom: 18 }}>
        Tổng hợp cách sửa mọi phần trong trang admin. Bấm vào mục trong danh sách bên dưới để nhảy tới phần tương ứng.
      </p>

      <nav className="card" style={{ marginBottom: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Mục lục</div>
        <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13.5, lineHeight: 2 }}>
          {TOC.map((t) => <li key={t.id}><a href={`#${t.id}`}>{t.label}</a></li>)}
        </ol>
      </nav>

      <Section id="cau-truc" title="1. Cấu trúc dữ liệu (đọc trước tiên)">
        <p style={{ fontSize: 13.5, lineHeight: 1.7 }}>
          Toàn bộ nội dung học được tổ chức theo 3 tầng, từ ngoài vào trong:
        </p>
        <p style={{ fontSize: 13.5, lineHeight: 1.9, fontWeight: 600 }}>
          Cấp độ <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>(VD: HSK1)</span>
          {' → '}Bài học <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>(VD: Bài 1: 你好)</span>
          {' → '}Nội dung bài học <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>(Từ vựng / Ngữ pháp / Câu / PPT / Video / Bài hát)</span>
        </p>
        <p style={{ fontSize: 13.5, lineHeight: 1.7 }}>
          Vì vậy có <b>2 chỗ dễ nhầm</b> khi bấm "Sửa" ở trang danh sách Cấp độ:
        </p>
        <ul style={{ fontSize: 13.5, lineHeight: 1.9, paddingLeft: 20 }}>
          <li>Nút <b>"Sửa"</b> ở danh sách cấp độ &nbsp;→&nbsp; chỉ sửa <b>thông tin của cấp độ</b> (mã, tên, loại, thứ tự) — không đụng tới bài học bên trong.</li>
          <li>Nút <b>"Nội dung"</b> ở mỗi dòng cấp độ, hoặc bấm thẳng vào tên cấp độ ở sidebar &nbsp;→&nbsp; mới vào được danh sách <b>bài học</b>, rồi từ đó bấm "Nội dung" trên từng bài để sửa từ vựng/ngữ pháp/câu/PPT/video/bài hát.</li>
        </ul>
      </Section>

      <Section id="cap-do" title="2. Sửa / thêm / xoá Cấp độ">
        <Step n={1}>
          Vào <b>Quản lý cấp độ / khoá học</b> bằng 1 trong 2 cách: bấm thẻ "Quản lý chi tiết tất cả cấp độ" ở trang Tổng quan admin, hoặc bấm vào tên một cấp độ ở sidebar rồi bấm nút <b>"Sửa thông tin cấp độ"</b> trên trang đó.
        </Step>
        <Step n={2}>
          Bấm <b>"Sửa"</b> trên dòng cấp độ cần sửa (hoặc "Thêm mới"/"+ Thêm cấp độ" ở sidebar để tạo mới). Form hiện ra với 4 trường:
        </Step>
        <FieldTable rows={[
          ['Mã cấp độ', 'Mã ngắn gọn, duy nhất, VD: HSK1, YCT2, CONVO-BASIC.'],
          ['Tên hiển thị', 'Tên đầy đủ hiển thị cho học sinh, VD: "HSK 1".'],
          ['Loại', 'HSK / HSKK / YCT / Trẻ em khác / Giao tiếp — quyết định cấp độ này tự động rơi vào mục/nhóm con nào ở sidebar. Không cần tự chọn danh mục, hệ thống tự gán.'],
          ['Thứ tự trong nhóm', 'Số càng nhỏ càng nằm trên trong danh sách hiển thị của nhóm đó.']
        ]}
        />
        <Step n={3}>Bấm <b>"Lưu thay đổi"</b>. Cột "Vị trí ở sidebar" trong bảng sẽ tự cập nhật theo "Loại" vừa chọn.</Step>
        <Step n={4}><b>Xoá</b> cấp độ: bấm nút Xoá đỏ (hoặc icon thùng rác cạnh tên cấp độ ở sidebar). Bài học/nội dung bên trong sẽ không còn hiển thị cho học sinh — cân nhắc trước khi xoá.</Step>
      </Section>

      <Section id="bai-hoc" title="3. Sửa / thêm / xoá Bài học">
        <Step n={1}>Từ sidebar, bấm vào tên một cấp độ để vào trang chi tiết — phần dưới là <b>"Quản lý bài học"</b>.</Step>
        <Step n={2}>Bấm <b>"+ Thêm mới"</b> để tạo bài học, hoặc <b>"Sửa"</b> trên một bài có sẵn.</Step>
        <FieldTable rows={[
          ['Thứ tự bài', 'Số thứ tự bài học trong cấp độ (1, 2, 3...).'],
          ['Tiêu đề bài học', 'VD: "Bài 1: 你好 - Xin chào".'],
          ['Mô tả ngắn', 'Giới thiệu ngắn về bài học, hiển thị cho học sinh.'],
          ['Xuất bản', '"Có" thì học sinh mới thấy được bài học này. "Không" = ẩn tạm (VD: đang soạn dở).']
        ]}
        />
        <Step n={3}>Muốn sửa nội dung <i>bên trong</i> bài học (từ vựng, ngữ pháp...) — bấm nút <b>"Nội dung"</b> trên dòng bài học đó, xem mục 4 bên dưới.</Step>
      </Section>

      <Section id="noi-dung-bai-hoc" title="4. Sửa nội dung trong một bài học">
        <p style={{ fontSize: 13.5, lineHeight: 1.7 }}>
          Sau khi bấm "Nội dung" trên một bài học, trang chỉnh sửa có 6 tab. Mỗi tab là một bảng quản lý riêng (Thêm mới / Sửa / Xoá) giống nhau về cách dùng — chọn tab tương ứng với phần muốn sửa:
        </p>

        <h4 style={{ marginBottom: 4 }}>🀄 Tab "Từ vựng"</h4>
        <FieldTable rows={[
          ['汉字 (chữ Hán)', 'Chữ Hán của từ.'],
          ['Pinyin', 'Phiên âm.'],
          ['Nghĩa tiếng Việt', 'Nghĩa dịch sang tiếng Việt.'],
          ['Loại từ', 'VD: Danh từ, Động từ... (không bắt buộc).'],
          ['Đường dẫn hình ảnh minh hoạ', 'Bấm "Tải ảnh minh hoạ mới lên thư viện" ở phía trên form trước, sao chép đường dẫn hiện ra rồi dán vào ô này.'],
          ['Ví dụ (JSON)', 'Câu ví dụ chứa từ này, xem định dạng bên dưới.']
        ]}
        />
        <JsonExample>{'{"hanzi":"你好！","pinyin":"nǐ hǎo!","vi":"Xin chào!"}'}</JsonExample>

        <h4 style={{ marginBottom: 4 }}>📖 Tab "Ngữ pháp"</h4>
        <FieldTable rows={[
          ['Cấu trúc', 'VD: "A + 是 + B".'],
          ['Cách dùng', 'Giải thích bằng tiếng Việt.'],
          ['Ví dụ (JSON)', 'Cùng định dạng {"hanzi","pinyin","vi"} như trên.'],
          ['Lưu ý / lỗi thường gặp', 'Không bắt buộc.'],
          ['Bài tập (JSON mảng)', 'Danh sách câu hỏi trắc nghiệm để học sinh luyện — xem định dạng bên dưới.']
        ]}
        />
        <JsonExample>{'[{"type":"mcq","question":"...","options":["A","B","C"],"answerIndex":0,"explanation":"..."}]'}</JsonExample>

        <h4 style={{ marginBottom: 4 }}>💬 Tab "Câu (đọc/nghe)"</h4>
        <p style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: -4 }}>Dùng chung cho 3 module: Luyện đọc, Luyện nghe, Hội thoại — chọn ở ô "Dùng cho mục".</p>
        <FieldTable rows={[
          ['Dùng cho mục', 'Luyện đọc / Luyện nghe / Hội thoại (nghe) — câu chỉ hiện ở đúng module đã chọn.'],
          ['汉字 / Pinyin / Nghĩa tiếng Việt', 'Nội dung câu.'],
          ['Thứ tự', 'Thứ tự hiển thị trong danh sách câu.'],
          ['Câu hỏi (JSON mảng)', 'Câu hỏi kiểm tra hiểu bài, không bắt buộc.']
        ]}
        />
        <JsonExample>{'[{"q":"Câu này nghĩa là gì?","options":["Đáp án đúng","Sai 1","Sai 2"],"answerIndex":0,"explanation":"..."}]'}</JsonExample>

        <h4 style={{ marginBottom: 4 }}>📑 Tab "PPT" (bài giảng)</h4>
        <p style={{ fontSize: 13.5, lineHeight: 1.7 }}>Có 2 việc tách riêng trong tab này, xem chi tiết ở mục 7 bên dưới:</p>
        <ul style={{ fontSize: 13.5, lineHeight: 1.9, paddingLeft: 20 }}>
          <li>Tạo một "bộ bài giảng", rồi tải <b>ảnh từng trang</b> lên (đây là thứ học sinh thực sự xem, có watermark, không tải xuống được).</li>
          <li>Tải <b>file PowerPoint gốc</b> (.ppt/.pptx/.pdf) lên để lưu trữ/tải về — học sinh không thấy mục này.</li>
        </ul>

        <h4 style={{ marginBottom: 4 }}>🎬 Tab "Video"</h4>
        <FieldTable rows={[
          ['Tiêu đề video', 'Tên hiển thị.'],
          ['Link video', 'Link YouTube hoặc URL video công khai.'],
          ['Mô tả', 'Không bắt buộc.'],
          ['Bản chép theo câu (JSON)', 'Chỉ hoạt động với video URL trực tiếp (mp4...), không áp dụng cho YouTube. Xem định dạng bên dưới.']
        ]}
        />
        <JsonExample>{'[{"start":0,"end":3,"hanzi":"你好","pinyin":"nǐ hǎo","vi":"Xin chào"}]'}</JsonExample>

        <h4 style={{ marginBottom: 4 }}>🎵 Tab "Bài hát"</h4>
        <FieldTable rows={[
          ['Tên bài hát', 'Tên hiển thị.'],
          ['Link nhạc/audio', 'File mp3 hoặc URL công khai.'],
          ['Lời bài hát theo câu (JSON)', 'Lời chạy theo từng câu khi phát nhạc — cùng định dạng start/end (giây) như tab Video.'],
          ['Từ vựng/ngữ pháp học được', 'Ghi chú thêm, không bắt buộc.']
        ]}
        />
      </Section>

      <Section id="giang-vien" title="5. Quản lý Giảng viên">
        <p style={{ fontSize: 13.5, lineHeight: 1.7 }}>
          Vào mục <b>"Giảng viên"</b> ở sidebar (mục "Khác"). Tải ảnh đại diện lên trước (nút "Tải ảnh đại diện giảng viên lên"), dán đường dẫn ảnh vào form, rồi điền:
        </p>
        <FieldTable rows={[
          ['Họ và tên', 'Bắt buộc.'],
          ['Chức danh', 'VD: Giáo viên, Trưởng bộ môn...'],
          ['Giới thiệu', 'Kinh nghiệm, bằng cấp — hiển thị ở trang giới thiệu giảng viên.'],
          ['Thứ tự hiển thị', 'Số nhỏ hơn hiện trước.']
        ]}
        />
      </Section>

      <Section id="nguoi-dung" title="6. Quản lý Người dùng & nhật ký (chỉ Admin)">
        <p style={{ fontSize: 13.5, lineHeight: 1.7 }}>
          Mục này chỉ hiện với tài khoản vai trò <b>Quản trị (admin)</b> — tài khoản Giáo viên không thấy và không sửa được (backend sẽ báo lỗi "Không đủ quyền truy cập" nếu cố truy cập).
        </p>
        <Step n={1}>Tab <b>"Người dùng"</b>: tạo tài khoản Giáo viên/Quản trị mới (họ tên, email, mật khẩu — để trống thì mặc định là <code>123456</code>, vai trò).</Step>
        <Step n={2}>Bấm <b>"Khoá"</b>/<b>"Mở khoá"</b> ở cuối mỗi dòng để tạm ngưng hoặc khôi phục quyền đăng nhập của một tài khoản.</Step>
        <Step n={3}>Tab <b>"Nhật ký hoạt động"</b>: xem lịch sử đăng nhập, xem tài liệu, tải file... của toàn bộ người dùng, phục vụ kiểm tra khi cần.</Step>
      </Section>

      <Section id="meo" title="7. Mẹo & lỗi thường gặp">
        <ul style={{ fontSize: 13.5, lineHeight: 2, paddingLeft: 20 }}>
          <li><b>Bấm "Sửa" mà không thấy gì đổi:</b> kiểm tra bạn đang ở đúng trang — trang danh sách Cấp độ chỉ sửa được mã/tên/loại/thứ tự, không sửa được bài học bên trong (xem mục 1).</li>
          <li><b>Sửa xong báo "Không đủ quyền truy cập":</b> một số thao tác (sửa/xoá cấp độ, quản lý người dùng...) chỉ tài khoản <b>Quản trị</b> mới làm được, tài khoản Giáo viên sẽ bị chặn ở bước lưu.</li>
          <li><b>Các ô "(JSON)"</b> phải đúng định dạng JSON hợp lệ (dấu ngoặc, dấu phẩy đúng chỗ) — sai định dạng sẽ báo lỗi đỏ ngay khi bấm Lưu và không lưu được. Có thể để trống nếu trường đó không bắt buộc.</li>
          <li><b>Ảnh không hiện lên sau khi lưu:</b> phải bấm "Tải ảnh lên" trước, đợi đường dẫn hiện ra, rồi dán đúng đường dẫn đó vào ô tương ứng — không dán link ảnh từ nơi khác trên mạng.</li>
          <li><b>PPT học sinh không xem được ngay sau khi tải file .pptx lên:</b> hệ thống không tự chuyển .pptx thành ảnh. Cần tự xuất ảnh từng trang (từ PowerPoint: Save as → hình ảnh) rồi tải lên ở ô "Tải thêm trang (ảnh...)" — file .pptx gốc chỉ dùng để lưu trữ/tải về.</li>
          <li><b>Bài học/từ vựng đã sửa nhưng học sinh chưa thấy:</b> kiểm tra bài học đó có đang bật "Xuất bản" = Có hay không.</li>
          <li><b>Vừa deploy code mới nhưng web vẫn hiện giao diện cũ:</b> nhấn Ctrl+Shift+R (hard refresh) để bỏ cache trình duyệt, hoặc đợi vài phút để Netlify build xong bản mới.</li>
        </ul>
      </Section>
    </div>
  );
}
