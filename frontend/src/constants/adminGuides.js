/**
 * Nội dung hướng dẫn từng bước cho từng mục trong trang quản trị.
 * Mỗi hướng dẫn: title, intro, steps [{ title, body, tip?, target? }], done (lời kết ở bước Hoàn tất).
 *
 * target - phần tử được khoanh vùng ở bước đó:
 *   'css selector'          → phần tử đầu tiên đang hiển thị
 *   'css selector::chữ'     → phần tử (trong cùng nhất) khớp selector VÀ có chứa đoạn chữ đó
 *   '*css selector'         → khoanh chung tất cả phần tử khớp (gộp thành 1 vùng)
 * needs - nhắc việc cần làm khi phần tử chưa hiện (mặc định: mở form / chuyển tab ở bước trước).
 * Không có target hoặc phần tử chưa hiện (VD: form chưa mở) → khung hướng dẫn nằm giữa màn hình.
 * Trong chuỗi, **chữ** hiển thị in đậm. Tên nút/ô phải khớp đúng chữ trên giao diện.
 */
const ADD = 'button::+ Thêm mới';
const FORM_ACTIONS = '.admin-form .admin-actions';
const field = (label) => `.form-field::${label}`;
const tab = (label) => `.tabs .tab-btn::${label}`;

export const ADMIN_GUIDES = {
  home: {
    title: 'Tổng quan quản trị',
    intro: 'Trang đầu tiên sau khi đăng nhập, cho biết số liệu nội dung và lối vào các mục quản lý.',
    steps: [
      { target: '.stats-row', title: 'Xem số liệu', body: 'Bốn ô này cho biết tổng số **Cấp độ**, **Bài học**, **Từ vựng** và **Câu ví dụ** đang có trên hệ thống.' },
      { target: '.admin-level-link', title: 'Chọn khoá học ở thanh bên', body: 'Danh sách khoá học chia theo nhóm (HSK, YCT, Giao tiếp...). Bấm vào một cấp độ để vào danh sách bài học của khoá đó.', tip: 'Nhóm đang đóng thì bấm tên nhóm để mở ra.' },
      { target: '.admin-level-add-btn', title: 'Thêm cấp độ / khoá học mới', body: 'Bấm **+ Thêm cấp độ**, nhập **Mã** (VD: HSK4), **Tên hiển thị**, chọn **Loại** và **Thứ tự**, rồi bấm **Tạo**. Cấp độ tự rơi vào đúng nhóm theo Loại đã chọn.' },
      { target: 'a.card::Quản lý chi tiết', title: 'Quản lý tất cả cấp độ dạng bảng', body: 'Bấm thẻ này để sửa mã, tên, loại, thứ tự của mọi cấp độ trong một bảng.' },
      { target: '*.sidebar-nav .sidebar-link', title: 'Các mục khác', body: 'Giảng viên, Học viên & thanh toán, Người dùng, Đăng ký tư vấn, Nội dung trang chủ, Font chữ & hiển thị. Vào mục nào, hướng dẫn của mục đó tự hiện ra.', tip: 'Học viên, Người dùng, Tư vấn, Trang chủ, Font chữ chỉ tài khoản Quản trị mới thấy.' },
      { target: '.guide-trigger', title: 'Mở lại hướng dẫn', body: 'Bấm nút **Hướng dẫn** này bất cứ lúc nào để xem lại hướng dẫn của trang đang mở.' }
    ],
    done: 'Bắt đầu bằng cách bấm vào một cấp độ ở thanh bên trái.'
  },

  levels: {
    title: 'Quản lý cấp độ / khoá học',
    intro: 'Bảng này chỉ sửa thông tin cơ bản của cấp độ (mã, tên, loại, thứ tự) — không sửa bài học bên trong.',
    steps: [
      { target: ADD, title: 'Thêm cấp độ mới', body: 'Bấm **+ Thêm mới**. Form nhập hiện ra ngay tại chỗ.' },
      { target: 'form.admin-form', title: 'Điền thông tin', body: '**Mã cấp độ**: mã ngắn, không trùng (VD: HSK4). **Tên hiển thị**: tên học viên thấy. **Loại**: quyết định cấp độ nằm ở nhóm nào trên thanh bên. **Thứ tự trong nhóm**: số nhỏ đứng trước.' },
      { target: FORM_ACTIONS, title: 'Lưu', body: 'Bấm **Tạo mới** (hoặc **Lưu thay đổi** khi đang sửa). Cột **Vị trí ở sidebar** tự cập nhật theo Loại.' },
      { target: '.admin-table tbody td.admin-actions', title: 'Sửa hoặc xoá', body: 'Trên mỗi dòng: **Sửa** để mở lại form, **Xoá** để xoá cấp độ (bài học bên trong sẽ không còn hiển thị).', tip: 'Xoá không hoàn tác được — kiểm tra kỹ trước khi xác nhận.' },
      { target: 'a.btn-secondary::Nội dung', title: 'Vào nội dung khoá học', body: 'Bấm **Nội dung** để vào danh sách bài học, đặt học phí, ảnh bìa và đề thi thử.' }
    ],
    done: 'Cấp độ đã sẵn sàng. Tiếp theo bấm **Nội dung** để thêm bài học và đặt học phí.'
  },

  levelDetail: {
    title: 'Khoá học: bài học, học phí & đề thi',
    intro: 'Trang của một cấp độ: sửa thông tin bán khoá học, quản lý danh sách bài học và đề thi thử.',
    steps: [
      { target: 'button::Sửa thông tin cấp độ', title: 'Mở form sửa khoá học', body: 'Bấm **Sửa thông tin cấp độ**. Các bước tiếp theo khoanh vào từng ô trong form vừa mở.' },
      { target: '.cover-editor', title: 'Đổi ảnh bìa', body: 'Chọn file JPG/PNG/WEBP (tối đa 15MB). Ảnh **lưu ngay** khi chọn xong. **Xoá ảnh** để quay về khung màu mặc định.' },
      { target: field('Học phí'), title: 'Đặt học phí', body: 'Nhập **Học phí (VNĐ)**. Để trống = không bán, khoá hiện "Sắp mở".', tip: 'Khoá đang bán tự mở 2 bài đầu cho học thử miễn phí.' },
      { target: field('Hiển thị công khai'), title: 'Ẩn / hiện khoá', body: 'Bỏ chọn ô này để tạm ẩn khoá khỏi trang đăng ký mà không cần xoá học phí.' },
      { target: field('Kết quả đạt được'), title: 'Giới thiệu khoá học', body: 'Điền **Thời lượng**, **Đối tượng phù hợp**, **Giới thiệu khoá học** và **Kết quả đạt được** (mỗi dòng một ý) — hiện ở trang chi tiết khoá học.' },
      { target: 'form.admin-form .admin-actions', title: 'Lưu thông tin khoá', body: 'Bấm **Lưu thay đổi**. Trang khoá học công khai cập nhật ngay.' },
      { target: ADD, title: 'Thêm bài học', body: 'Bấm **+ Thêm mới**, nhập **Tiêu đề bài học** (VD: Bài 1: 你好 - Xin chào), **Mô tả ngắn**, chọn **Xuất bản: Có** rồi bấm **Tạo mới**.', tip: 'Xuất bản = Không thì học viên chưa thấy bài — dùng khi đang soạn dở.' },
      { target: '.admin-table .sort-cell', title: 'Sắp xếp bài học', body: 'Dùng mũi tên **↑ ↓** để đổi vị trí bài. Thứ tự lưu ngay.' },
      { target: 'a.btn-secondary::Nội dung', title: 'Soạn nội dung bài', body: 'Bấm **Nội dung** trên dòng bài học để vào trình soạn bài (từ vựng, ngữ pháp, PPT, bài khoá...).' },
      { target: 'h2::Quản lý Đề thi thử', title: 'Đề thi thử (nếu có)', body: 'Bấm **+ Thêm mới** của bảng này, nhập **Nhóm**, **Thứ tự**, **Tiêu đề** → **Tạo mới**. Sau đó bấm **Tải lên** ở cột File đề thi để chọn file HTML của đề.' }
    ],
    done: 'Khoá học đã có thông tin bán và danh sách bài. Bấm **Nội dung** trên từng bài để soạn chi tiết.'
  },

  'lesson-layout': {
    title: 'Thông tin & bố cục bài học',
    intro: 'Sửa tên, mô tả, lời giới thiệu bài và chọn các phần học viên sẽ thấy theo thứ tự nào.',
    steps: [
      { target: tab('Thông tin & bố cục'), title: 'Chọn tab', body: 'Bấm tab **Thông tin & bố cục** (tab đầu tiên).' },
      { target: field('Tên bài học'), title: 'Sửa thông tin bài', body: 'Sửa **Tên bài học**, **Thứ tự bài trong khoá**, **Mô tả ngắn** (hiện ở lộ trình khoá học).' },
      { target: field('Nội dung / giới thiệu'), title: 'Viết lời giới thiệu', body: 'Hiện ở đầu trang bài cho học viên, giữ nguyên xuống dòng — ghi mục tiêu, kiến thức trọng tâm, cách học.' },
      { target: '.section-order-list', title: 'Sắp xếp các phần trong bài', body: 'Dùng mũi tên **lên/xuống** để đổi vị trí, bấm **con mắt** để ẩn/hiện phần đó với học viên.', tip: '"Bài học tương tác" và "Tài liệu" chỉ hiện khi bài thực sự có nội dung tương ứng.' },
      { target: 'label.check-label::Xuất bản bài học', title: 'Xuất bản', body: 'Đánh dấu **Xuất bản bài học** để học viên thấy bài.' },
      { target: '.lesson-layout-actions', title: 'Lưu', body: 'Bấm **Lưu thay đổi**.' },
      { target: 'a.btn-secondary::Xem như học viên', title: 'Kiểm tra', body: 'Bấm **Xem như học viên** để mở bài ở tab mới và kiểm tra.' }
    ],
    done: 'Bố cục bài đã lưu. Chuyển sang các tab khác để thêm từ vựng, PPT, bài khoá...'
  },

  'lesson-html': {
    title: 'Bài học HTML (tương tác)',
    intro: 'Tải lên file bài học .html tự chứa (chữ, hình, âm thanh, bài tập trong 1 file) để học viên xem nguyên vẹn.',
    steps: [
      { target: tab('Bài học HTML'), title: 'Chọn tab', body: 'Bấm tab **Bài học HTML**.' },
      { target: '.drop-zone', title: 'Tải file lên', body: '**Kéo thả** file .html vào khung này, hoặc bấm vào khung để chọn file. Chọn nhiều file được — mỗi file thành 1 bài.' },
      { target: '.html-page-title', title: 'Đổi tên', needs: 'Cần tải ít nhất 1 file HTML ở bước 2 trước.', body: 'Tên bài lấy theo tên file. Bấm vào ô tên, sửa rồi nhấn **Enter** để lưu.' },
      { target: '.html-page-row .sort-cell', title: 'Sắp xếp', body: 'Dùng **↑ ↓** để đổi thứ tự các bài.', needs: 'Cần tải ít nhất 1 file HTML ở bước 2 trước.' },
      { target: '.html-page-actions', title: 'Xem thử, thay file, ẩn, xoá', needs: 'Cần tải ít nhất 1 file HTML ở bước 2 trước.', body: '**Xem thử**: mở như học viên. **Thay file**: tải bản sửa mới, học viên thấy ngay. **Con mắt**: ẩn/hiện với học viên. **Thùng rác**: xoá hẳn.' }
    ],
    done: 'Bài học HTML đã có trong bài. Học viên mở ở mục "Bài học tương tác".'
  },

  'lesson-words': {
    title: 'Từ vựng',
    intro: 'Bảng từ vựng sửa trực tiếp như Excel, tự lưu khi rời khỏi ô.',
    steps: [
      { target: tab('Từ vựng'), title: 'Chọn tab', body: 'Bấm tab **Từ vựng**.' },
      { target: 'button::+ Thêm hàng', title: 'Thêm dòng mới', body: 'Bấm **+ Thêm hàng**. Một dòng trống hiện ra cuối bảng.' },
      { target: '*.word-grid-table thead th:nth-child(-n+3)', title: 'Nhập 3 cột bắt buộc', body: 'Điền **汉字**, **Pinyin**, **Nghĩa**. Khi rời ô (Tab hoặc bấm ra ngoài), dòng tự lưu.', tip: 'Dòng mới thiếu 1 trong 3 ô này sẽ chưa được lưu.' },
      { target: '*.word-grid-table thead th:nth-child(4), .word-grid-table thead th:nth-child(n+7):nth-child(-n+9)', title: 'Loại từ và câu ví dụ', body: 'Điền **Loại từ** và câu ví dụ (**VD 汉字**, **VD Pinyin**, **VD nghĩa**).' },
      { target: '.word-grid-table thead th:nth-child(5)', title: 'Ảnh minh hoạ', body: 'Bấm ô ảnh trên dòng để chọn ảnh minh hoạ cho từ — ảnh lưu ngay.' },
      { target: '.word-grid-table thead th:nth-child(6)', title: 'File nghe (không bắt buộc)', body: 'Chọn file mp3, nghe thử rồi bấm **Dùng file này**. Không có file thì hệ thống tự đọc bằng giọng máy.' },
      { target: '*.word-grid-font-control, .word-grid-toolbar-actions .btn-secondary', title: 'Tuỳ chỉnh bảng', body: 'Nút **– / +** chỉnh cỡ chữ trong bảng; **+ Thêm cột** để thêm cột ghi chú riêng. Hai thiết lập này chỉ nhớ trên máy đang dùng.' },
      { target: '.word-grid-row-delete', title: 'Xoá từ', needs: 'Bảng chưa có từ nào — thêm từ ở bước 2.', body: 'Bấm biểu tượng **thùng rác** ở cuối dòng để xoá từ đó.' }
    ],
    done: 'Từ vựng đã lưu tự động. Học viên dùng chúng ở Từ vựng, Flashcard và Game ôn tập.'
  },

  'lesson-characters': {
    title: 'Chữ Hán',
    intro: 'Thẻ chữ Hán: nét, bộ thủ, cấu tạo, mẹo nhớ và thứ tự nét.',
    steps: [
      { target: tab('Chữ Hán'), title: 'Chọn tab', body: 'Bấm tab **Chữ Hán**.' },
      { target: ADD, title: 'Thêm chữ', body: 'Bấm **+ Thêm mới** để mở form.' },
      { target: field('汉字 (chữ Hán)'), title: 'Thông tin bắt buộc', body: 'Điền **汉字 (chữ Hán)**, rồi **Pinyin**, **Nghĩa tiếng Việt** ngay bên dưới.' },
      { target: field('Bộ thủ'), title: 'Thông tin chữ', body: 'Điền **Số nét**, **Cấu trúc** (VD: 左右, 上下), **Bộ thủ**, **Nghĩa bộ thủ**, **Cấu tạo chữ**, **Quy tắc viết**, **Mẹo ghi nhớ**.' },
      { target: field('Thứ tự nét'), title: 'Thứ tự nét', body: 'Nhập dạng danh sách: mỗi nét trong ngoặc kép, ngăn bằng dấu phẩy, đặt trong ngoặc vuông. VD: ["撇","竖","横","竖弯钩"].', tip: 'Sai dấu ngoặc/dấu phẩy sẽ báo lỗi đỏ và không lưu được.' },
      { target: FORM_ACTIONS, title: 'Lưu', body: 'Bấm **Tạo mới**. Muốn sửa sau này bấm **Sửa** trên dòng chữ đó.' }
    ],
    done: 'Chữ Hán đã thêm vào bài, hiện ở mục "Chữ Hán" của học viên.'
  },

  'lesson-dialogues': {
    title: 'Bài khoá (hội thoại)',
    intro: 'Mỗi bài khoá là một đoạn hội thoại gồm nhiều câu thoại, có thể kèm file nghe giọng thật.',
    steps: [
      { target: tab('Bài khoá'), title: 'Chọn tab', body: 'Bấm tab **Bài khoá**.' },
      { target: ADD, title: 'Thêm bài khoá', body: 'Bấm **+ Thêm mới** để mở form.' },
      { target: field('Tiêu đề đoạn hội thoại'), title: 'Tiêu đề', body: 'Nhập **Thứ tự**, **Tiêu đề đoạn hội thoại**, **Nhãn audio** (VD: 1-1).' },
      { target: field('Bối cảnh (chữ Hán)'), title: 'Bối cảnh', body: 'Điền **Bối cảnh (chữ Hán)** và **Bối cảnh (tiếng Anh)** nếu có. **Chú thích thêm** không bắt buộc.' },
      { target: field('Các câu thoại'), title: 'Nhập câu thoại', body: 'Bấm **Thêm câu thoại** cho từng câu: **Người nói**, **汉字**, **Pinyin**, **Nghĩa tiếng Việt** (tiếng Anh không bắt buộc).' },
      { target: FORM_ACTIONS, title: 'Lưu', body: 'Bấm **Tạo mới**.' },
      { target: 'th::File nghe', title: 'Gắn file nghe', body: 'Ở cột **File nghe** trong bảng, chọn file mp3, nghe thử rồi xác nhận. Không có file thì bài khoá đọc bằng giọng máy.' }
    ],
    done: 'Bài khoá đã có trong bài, học viên đọc và nghe ở mục "Bài khoá".'
  },

  'lesson-grammar': {
    title: 'Ngữ pháp',
    intro: 'Mỗi điểm ngữ pháp gồm cấu trúc, cách dùng, ví dụ và bài tập trắc nghiệm.',
    steps: [
      { target: tab('Ngữ pháp'), title: 'Chọn tab', body: 'Bấm tab **Ngữ pháp**.' },
      { target: ADD, title: 'Thêm điểm ngữ pháp', body: 'Bấm **+ Thêm mới** để mở form.' },
      { target: field('Cấu trúc'), title: 'Cấu trúc & cách dùng', body: 'Nhập **Cấu trúc** (VD: A + 是 + B), rồi **Cách dùng** giải thích bằng tiếng Việt ở ô bên dưới.' },
      { target: field('Ví dụ'), title: 'Ví dụ', body: 'Điền 3 ô **汉字**, **Pinyin**, **Nghĩa tiếng Việt** của câu ví dụ. **Lưu ý / lỗi thường gặp** điền nếu có.' },
      { target: field('Bài tập trắc nghiệm'), title: 'Bài tập trắc nghiệm', body: 'Bấm **Thêm câu hỏi**, nhập câu hỏi, bấm **Thêm đáp án** cho từng lựa chọn, chọn **nút tròn** cạnh đáp án đúng.', tip: 'Mỗi câu cần nội dung câu hỏi và ít nhất 2 đáp án.' },
      { target: FORM_ACTIONS, title: 'Lưu', body: 'Bấm **Tạo mới** (hoặc **Lưu thay đổi**).' }
    ],
    done: 'Điểm ngữ pháp đã lưu, học viên học và làm bài ở mục "Ngữ pháp".'
  },

  'lesson-sentences': {
    title: 'Câu (đọc / nghe)',
    intro: 'Câu dùng cho Luyện đọc, Luyện nghe và Hội thoại (nghe). Mỗi câu chỉ hiện ở mục đã chọn.',
    steps: [
      { target: tab('Câu (đọc/nghe)'), title: 'Chọn tab', body: 'Bấm tab **Câu (đọc/nghe)**.' },
      { target: ADD, title: 'Thêm câu', body: 'Bấm **+ Thêm mới** để mở form.' },
      { target: field('Dùng cho mục'), title: 'Chọn mục', body: 'Chọn **Luyện đọc**, **Luyện nghe** hoặc **Hội thoại (nghe)** — câu chỉ hiện ở mục này.' },
      { target: field('汉字'), title: 'Nội dung câu', body: 'Nhập **汉字**, **Pinyin**, **Nghĩa tiếng Việt** và **Thứ tự**.' },
      { target: field('File nghe'), title: 'File nghe (không bắt buộc)', body: 'Chọn file mp3, nghe thử, bấm **Dùng file này**.', tip: 'Sau khi bấm "Dùng file này" vẫn phải bấm Lưu ở bước cuối mới áp dụng.' },
      { target: field('Câu hỏi trắc nghiệm'), title: 'Câu hỏi kiểm tra', body: 'Bấm **Thêm câu hỏi** để thêm câu hỏi trắc nghiệm hiểu câu (không bắt buộc).' },
      { target: FORM_ACTIONS, title: 'Lưu', body: 'Bấm **Tạo mới** (hoặc **Lưu thay đổi**).' }
    ],
    done: 'Câu đã lưu và hiện ở đúng mục luyện tập đã chọn.'
  },

  'lesson-speaking': {
    title: 'Luyện nói (tình huống)',
    intro: 'Học viên đọc tình huống, chọn câu nói đúng rồi tập nói câu đó.',
    steps: [
      { target: tab('Luyện nói'), title: 'Chọn tab', body: 'Bấm tab **Luyện nói**.' },
      { target: ADD, title: 'Thêm tình huống', body: 'Bấm **+ Thêm mới** để mở form.' },
      { target: field('Tình huống'), title: 'Tình huống', body: 'Nhập **Thứ tự** và mô tả **Tình huống** bằng tiếng Việt.' },
      { target: field('Các lựa chọn'), title: 'Các lựa chọn', body: 'Nhập dạng danh sách, VD: ["老师，你好！","老师，您好！","大家好！","再见！"].' },
      { target: field('Chỉ số đáp án đúng'), title: 'Đáp án đúng', body: 'Đếm từ 0: lựa chọn thứ nhất là 0, thứ hai là 1...' },
      { target: field('Câu cần nói'), title: 'Câu mẫu & giải thích', body: 'Điền **Câu cần nói (Hán tự)**, **Pinyin** và **Giải thích**.' },
      { target: FORM_ACTIONS, title: 'Lưu', body: 'Bấm **Tạo mới**.' }
    ],
    done: 'Tình huống đã thêm vào mục "Luyện nói".'
  },

  'lesson-fill': {
    title: 'Điền từ (luyện viết)',
    intro: 'Câu có một chỗ trống, học viên gõ chữ Hán để điền.',
    steps: [
      { target: tab('Điền từ'), title: 'Chọn tab', body: 'Bấm tab **Điền từ**.' },
      { target: ADD, title: 'Thêm câu', body: 'Bấm **+ Thêm mới** để mở form.' },
      { target: field('Từ cần điền'), title: 'Chia câu thành 3 phần', body: '**Đoạn trước chỗ trống** + **Từ cần điền** + **Đoạn sau chỗ trống**. VD: 我 + 是 + 学生。' },
      { target: field('Gợi ý'), title: 'Gợi ý', body: 'Điền **Gợi ý** bằng nghĩa tiếng Việt.' },
      { target: field('Các đáp án được chấp nhận'), title: 'Đáp án được chấp nhận', body: 'Mỗi dòng một cách viết đúng (ít nhất 1 dòng).' },
      { target: FORM_ACTIONS, title: 'Lưu', body: 'Bấm **Tạo mới**. Cột **Câu** trong bảng hiện dạng 我[是]学生 để kiểm tra nhanh.' }
    ],
    done: 'Câu điền từ đã có ở mục "Luyện viết".'
  },

  'lesson-slides': {
    title: 'PPT / Bài giảng',
    intro: 'Học viên xem bài giảng dạng ảnh từng trang có watermark, không tải xuống được.',
    steps: [
      { target: tab('PPT'), title: 'Chọn tab', body: 'Bấm tab **PPT**.' },
      { target: 'form.admin-form', title: 'Tạo bộ bài giảng', body: 'Nhập tên (VD: PPT Bài 1: 你好), bấm **+ Tạo bộ bài giảng**.' },
      { target: '.card div::Tải file PPT/PDF lên', title: 'Tải file PPT/PDF', needs: 'Cần tạo bộ bài giảng ở bước 2 trước.', body: 'Chọn file .ppt/.pptx/.pdf. Hệ thống tự chuyển thành ảnh từng trang.', tip: 'File ít trang thường dưới 1 phút; file vài trăm trang mất nhiều phút — có thể rời trang, hệ thống vẫn xử lý ngầm.' },
      { target: '.card a.btn-secondary::Xem thử', title: 'Kiểm tra', needs: 'Nút Xem thử hiện sau khi file PPT/PDF chuyển đổi xong.', body: 'Khi số trang hiện lên (VD: "24 trang · phiên bản 1"), bấm **Xem thử** để xem như học viên.' },
      { target: '.card div::File PowerPoint gốc', title: 'Lưu file gốc (không bắt buộc)', needs: 'Cần tạo bộ bài giảng ở bước 2 trước.', body: 'Chọn file để lưu trữ — học viên không thấy, chỉ giáo viên/admin bấm **Tải xuống** được.' },
      { target: '.card button::Xoá', title: 'Cập nhật / xoá', needs: 'Cần tạo bộ bài giảng ở bước 2 trước.', body: 'Tải file mới vào khung chuyển đổi để thay bài giảng (phiên bản tăng lên). Bấm **Xoá** để xoá cả bộ.' }
    ],
    done: 'Bài giảng đã sẵn sàng ở mục "PPT / Bài giảng" của học viên.'
  },

  'lesson-videos': {
    title: 'Video',
    intro: 'Video tình huống hoặc bài giảng gắn vào bài học.',
    steps: [
      { target: tab('Video'), title: 'Chọn tab', body: 'Bấm tab **Video**.' },
      { target: ADD, title: 'Thêm video', body: 'Bấm **+ Thêm mới** để mở form.' },
      { target: field('Link video'), title: 'Tiêu đề và link', body: 'Nhập **Tiêu đề video**, dán **Link video** (YouTube hoặc link mp4 công khai), điền **Mô tả** nếu cần.' },
      { target: field('Bản chép theo câu'), title: 'Phụ đề theo câu (không bắt buộc)', body: 'Nhập dạng: [{"start":0,"end":3,"hanzi":"你好","pinyin":"nǐ hǎo","vi":"Xin chào"}] — start/end tính bằng giây.', tip: 'Phụ đề chỉ chạy theo video khi dùng link mp4 trực tiếp, không áp dụng cho YouTube.' },
      { target: FORM_ACTIONS, title: 'Lưu', body: 'Bấm **Tạo mới**.' }
    ],
    done: 'Video đã gắn vào bài học.'
  },

  'lesson-songs': {
    title: 'Bài hát',
    intro: 'Học tiếng Trung qua bài hát với lời chạy theo từng câu.',
    steps: [
      { target: tab('Bài hát'), title: 'Chọn tab', body: 'Bấm tab **Bài hát**.' },
      { target: ADD, title: 'Thêm bài hát', body: 'Bấm **+ Thêm mới** để mở form.' },
      { target: field('Link nhạc'), title: 'Tên và link nhạc', body: 'Nhập **Tên bài hát**, dán **Link nhạc/audio** (file mp3 hoặc link công khai).' },
      { target: field('Lời bài hát'), title: 'Lời bài hát', body: 'Nhập dạng: [{"start":0,"end":3,"hanzi":"你好你好","pinyin":"nǐ hǎo nǐ hǎo","vi":"Xin chào, xin chào"}] — start/end tính bằng giây.' },
      { target: FORM_ACTIONS, title: 'Ghi chú & lưu', body: 'Điền **Từ vựng/ngữ pháp học được qua bài hát** (ô phía trên), rồi bấm **Tạo mới**.' }
    ],
    done: 'Bài hát đã thêm vào bài học.'
  },

  'lesson-docs': {
    title: 'Tài liệu đính kèm',
    intro: 'PDF, Word, Excel, PowerPoint, ảnh, file nghe hoặc .zip (tối đa 100MB/file) cho học viên tải.',
    steps: [
      { target: tab('Tài liệu'), title: 'Chọn tab', body: 'Bấm tab **Tài liệu**.' },
      { target: 'button::Tải tài liệu lên', title: 'Tải lên', body: 'Bấm **Tải tài liệu lên** và chọn một hoặc nhiều file.' },
      { target: '.html-page-title', title: 'Đổi tên hiển thị', needs: 'Cần tải ít nhất 1 tài liệu ở bước 2 trước.', body: 'Bấm vào ô tên tài liệu, sửa lại, nhấn **Enter** để lưu.' },
      { target: '.html-page-row .sort-cell', title: 'Sắp xếp', body: 'Dùng **↑ ↓** để đổi thứ tự.', needs: 'Cần tải ít nhất 1 tài liệu ở bước 2 trước.' },
      { target: '.html-page-actions', title: 'Mở / thay / xoá', needs: 'Cần tải ít nhất 1 tài liệu ở bước 2 trước.', body: '**Mở** để xem file, **Thay file** để cập nhật bản mới, **thùng rác** để xoá.' }
    ],
    done: 'Học viên của khoá mở/tải tài liệu ở mục "Tài liệu đính kèm" trong bài.'
  },

  instructors: {
    title: 'Giảng viên',
    intro: 'Danh sách giảng viên kèm ảnh, chức danh và giới thiệu.',
    steps: [
      { target: '.card::Tải ảnh đại diện', title: 'Tải ảnh đại diện', body: 'Chọn ảnh. Đường dẫn ảnh hiện ra ngay bên dưới — bôi đen và sao chép.' },
      { target: ADD, title: 'Thêm giảng viên', body: 'Bấm **+ Thêm mới** để mở form.' },
      { target: field('Đường dẫn ảnh đại diện'), title: 'Điền thông tin', body: 'Nhập **Họ và tên**, **Chức danh**, dán đường dẫn vừa sao chép vào ô **Đường dẫn ảnh đại diện**, điền **Giới thiệu** và **Thứ tự hiển thị**.' },
      { target: FORM_ACTIONS, title: 'Lưu', body: 'Bấm **Tạo mới**. Sửa/xoá bằng nút **Sửa**, **Xoá** trên từng dòng.' }
    ],
    done: 'Giảng viên đã được thêm.'
  },

  students: {
    title: 'Học viên & thanh toán',
    intro: 'Quy trình: học viên đặt mua → bạn xác nhận đã nhận tiền → hệ thống cấp quyền học cho email đó.',
    steps: [
      { target: tab('Đơn đăng ký'), title: 'Mở danh sách đơn', body: 'Bấm tab **Đơn đăng ký / thanh toán**.' },
      { target: field('Lọc theo trạng thái'), title: 'Lọc đơn', body: 'Mặc định chỉ hiện đơn **Chờ thanh toán**. Chọn **Tất cả** để xem cả đơn đã xử lý.' },
      { target: '.table-scroll::Mã đơn', title: 'Đối chiếu tiền', body: 'Mỗi đơn có **Mã đơn**, email, SĐT, khoá học, số tiền. Kiểm tra tài khoản ngân hàng: số tiền và nội dung chuyển khoản (học viên được dặn ghi đúng **Mã đơn**) phải khớp.' },
      { target: 'button::Xác nhận đã thanh toán', title: 'Xác nhận đơn', needs: 'Nút này chỉ hiện khi đang có đơn Chờ thanh toán.', body: 'Bấm **Xác nhận đã thanh toán** rồi đồng ý. Nếu không nhận được tiền, bấm **Từ chối** bên cạnh và ghi lý do.' },
      { target: '.notice-card', title: 'Gửi tài khoản cho học viên', needs: 'Khung này hiện ngay sau khi bạn xác nhận một đơn hoặc cấp quyền thủ công.', body: 'Khung thông báo hiện **email** và **mật khẩu tạm** (nếu là tài khoản mới). Sao chép gửi cho học viên ngay.', tip: 'Mật khẩu tạm chỉ hiển thị một lần.' },
      { target: tab('Học viên theo khoá'), title: 'Danh sách học viên', body: 'Bấm tab **Học viên theo khoá** để cấp quyền thủ công và theo dõi học viên.' },
      { target: 'form.admin-form::Cấp quyền thủ công', title: 'Cấp quyền thủ công', needs: 'Bấm tab Học viên theo khoá ở bước trước.', body: 'Nhập **Email học viên**, **Họ tên**, chọn **Khoá học**, bấm **+ Cấp quyền**.' },
      { target: '.table-scroll::Tiến độ', title: 'Theo dõi & thu hồi', needs: 'Bấm tab Học viên theo khoá ở bước 6.', body: 'Bảng cho thấy trạng thái và **Tiến độ**. Đổi ở cột **Đổi trạng thái**; chọn **Đã thu hồi** để chặn học viên xem khoá đó.' }
    ],
    done: 'Học viên đăng nhập bằng email đã cấp và chỉ thấy các khoá được cấp quyền.'
  },

  users: {
    title: 'Người dùng & nhật ký',
    intro: 'Quản lý tài khoản giáo viên/quản trị, khoá tài khoản, cấp lại mật khẩu và xem nhật ký.',
    steps: [
      { target: 'form.admin-form', title: 'Tạo tài khoản', body: 'Nhập **Họ tên**, **Email**, **Mật khẩu** (để trống = 123456), chọn **Vai trò**.', tip: 'Giáo viên chỉ soạn nội dung; Quản trị thấy thêm học viên, thanh toán, trang chủ.' },
      { target: 'button::+ Tạo tài khoản', title: 'Lưu tài khoản', body: 'Bấm **+ Tạo tài khoản**. Tài khoản mới hiện trong bảng bên dưới.' },
      { target: '.admin-table td:last-child', title: 'Khoá / cấp lại mật khẩu', body: '**Khoá** để chặn đăng nhập (VD: nhân sự nghỉ việc), **Mở khoá** để khôi phục. **Cấp lại MK** hiện **mật khẩu tạm** để gửi cho người dùng — mật khẩu cũ mất hiệu lực, mọi thiết bị bị đăng xuất.' },
      { target: 'th::Thiết bị', title: 'Số thiết bị', body: 'Số thiết bị đang đăng nhập — mỗi tài khoản tối đa 2, đăng nhập máy thứ 3 sẽ đẩy máy cũ nhất ra.' },
      { target: tab('Nhật ký hoạt động'), title: 'Xem nhật ký', body: 'Bấm **Nhật ký hoạt động** để xem lịch sử đăng nhập, xem tài liệu, tải file...' }
    ],
    done: 'Tài khoản đã được quản lý xong.'
  },

  consultations: {
    title: 'Đăng ký tư vấn',
    intro: 'Danh sách khách để lại thông tin ở form "Đăng ký tư vấn" trên trang chủ.',
    steps: [
      { target: '.page-sub + .admin-tabs .tab-btn::Mới', title: 'Xem yêu cầu mới', body: 'Tab **Mới** hiện các yêu cầu chưa xử lý, kèm số lượng.' },
      { target: '.admin-table', title: 'Liên hệ khách', needs: 'Bảng chỉ hiện khi có yêu cầu tư vấn ở tab đang chọn.', body: 'Xem cột **Liên hệ qua** (Zalo/Facebook/Gọi điện). Bấm số điện thoại để gọi, hoặc email để gửi thư.' },
      { target: '.admin-table td select', title: 'Cập nhật trạng thái', needs: 'Bảng chỉ hiện khi có yêu cầu tư vấn ở tab đang chọn.', body: 'Chọn **Đã liên hệ** sau khi gọi, **Đã xong** khi đã chốt hoặc kết thúc.' },
      { target: '.page-sub + .admin-tabs', title: 'Lọc & dọn dẹp', body: 'Bấm **Đã liên hệ**, **Đã xong**, **Tất cả** để lọc. Nút **thùng rác** cuối dòng để xoá yêu cầu rác.' }
    ],
    done: 'Không bỏ sót khách nào khi tab "Mới" về 0.'
  },

  homepage: {
    title: 'Nội dung trang chủ',
    intro: 'Sửa chữ, ảnh, liên hệ và các mục trên trang chủ công khai mà không cần sửa code.',
    steps: [
      { target: '.hpa-section summary', title: 'Mở từng khung', body: 'Bấm tiêu đề mỗi khung để mở/đóng phần sửa của khung đó.' },
      { target: field('Hotline'), title: 'Thông tin liên hệ', body: 'Điền **Hotline**, **Email**, **Địa chỉ**, **Giờ làm việc**, link **Facebook/YouTube/TikTok/Zalo**.', tip: 'Hotline và Zalo dùng cho 2 nút rung ở góc dưới màn hình. Để trống Zalo sẽ tự dùng zalo.me/<Hotline>.' },
      { target: 'summary::Banner đầu trang', title: 'Banner & giới thiệu', body: 'Sửa chữ ở **Banner đầu trang**, **Ảnh hoạt động & 3 ô lối tắt**, **Giới thiệu - Tại sao chọn chúng tôi**. Ảnh để trống sẽ dùng ảnh mặc định.' },
      { target: 'summary::Ảnh bìa sách', title: 'Ảnh bìa sách', body: 'Đổi bìa từng khoá ngay tại khung này — ảnh lưu ngay, không cần bấm Lưu.' },
      { target: 'summary::Tin tức', title: 'Tin tức, video, giảng viên, cảm nhận', body: 'Mở từng khung và bấm nút **Thêm...** để thêm mục. Khung nào rỗng sẽ tự ẩn khỏi trang chủ.', tip: 'Chỉ nhập cảm nhận thật của học viên.' },
      { target: '.hpa .page-sub', title: 'Link', body: 'Ô link có thể là trang nội bộ (/courses), mục trên trang chủ (#dang-ky) hoặc địa chỉ đầy đủ (https://...).' },
      { target: '.hpa-savebar', title: 'Lưu', body: 'Bấm **Lưu thay đổi** (nút chỉ bật khi có thay đổi).' },
      { target: '.hpa-preview-link', title: 'Kiểm tra', body: 'Bấm **Xem trang chủ** để mở trang công khai ở tab mới.' }
    ],
    done: 'Trang chủ đã cập nhật cho mọi khách truy cập.'
  },

  typography: {
    title: 'Font chữ & hiển thị',
    intro: 'Đổi font, cỡ chữ, màu chữ cho toàn bộ trang học của học viên.',
    steps: [
      { target: '*.typo-controls > .form-field:not(.typo-slider)', title: 'Chọn font', body: 'Chọn **Font chữ Hán**, **Font tiếng Việt** và **Độ đậm chữ Hán**.' },
      { target: '*.typo-slider', title: 'Chỉnh cỡ chữ', body: 'Kéo các thanh cỡ chữ Hán (máy tính / điện thoại), pinyin, dịch nghĩa, chữ tiếng Việt và khoảng cách dòng.' },
      { target: '.typo-colors', title: 'Chọn màu', body: 'Đổi màu **Chữ thường**, **Chữ Hán**, **Pinyin**, **Dịch nghĩa**.' },
      { target: '.typo-preview-col', title: 'Xem trước', body: 'Kết quả hiện ngay ở đây. Bấm **Máy tính** / **Điện thoại** để xem hai kiểu màn hình.' },
      { target: '.typo-actions', title: 'Lưu', body: 'Bấm **Lưu** để áp dụng cho học viên. **Khôi phục mặc định** để làm lại từ đầu (rồi bấm Lưu).' }
    ],
    done: 'Giao diện chữ mới đã áp dụng cho toàn bộ trang học.'
  },

  guide: {
    title: 'Hướng dẫn sử dụng',
    intro: 'Trang này tổng hợp hướng dẫn của mọi mục trong trang quản trị.',
    steps: [
      { title: 'Hướng dẫn tự mở', body: 'Mỗi khi bấm vào một mục (hoặc một tab trong bài học), hướng dẫn của mục đó tự chạy và **khoanh vùng** đúng chỗ cần thao tác ở từng bước.' },
      { title: 'Thao tác ngay trong lúc xem', body: 'Vùng được khoanh vẫn bấm được — làm theo luôn rồi bấm **Tiếp theo**. Bước nào cần form đang đóng, khung hướng dẫn sẽ nằm giữa màn hình và nhắc bạn mở form trước.' },
      { title: 'Tắt tự mở', body: 'Đánh dấu **Không tự mở lại ở mục này** nếu đã quen thao tác.' },
      { target: '.guide-trigger', title: 'Mở lại hướng dẫn', body: 'Bấm nút **Hướng dẫn** ở góc trên bên phải của mọi trang quản trị.' },
      { target: '.guide-index', title: 'Xem toàn bộ', body: 'Bấm một thẻ bất kỳ để xem hướng dẫn của mục đó.' }
    ],
    done: 'Bạn đã biết cách dùng hướng dẫn.'
  }
};

/** Tìm hướng dẫn ứng với trang quản trị đang mở (theo đường dẫn + ?tab= của trình soạn bài). */
export function guideKeyFor(pathname, search) {
  const p = pathname.replace(/\/+$/, '');
  if (/^\/admin\/levels\/[^/]+\/lessons\/[^/]+$/.test(p)) {
    const t = new URLSearchParams(search).get('tab') || 'layout';
    return ADMIN_GUIDES[`lesson-${t}`] ? `lesson-${t}` : 'lesson-layout';
  }
  if (/^\/admin\/levels\/[^/]+$/.test(p)) return 'levelDetail';
  if (p === '/admin') return 'home';
  const key = p.replace(/^\/admin\//, '');
  return ADMIN_GUIDES[key] ? key : null;
}
