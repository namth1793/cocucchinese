/**
 * Nội dung pop-up hướng dẫn cho từng mục trong trang quản trị.
 * Mỗi hướng dẫn: title, intro, steps [{ title, body, tip? }], done (lời kết ở bước Hoàn tất).
 * Trong chuỗi, **chữ** sẽ hiển thị in đậm. Tên nút/ô phải khớp đúng chữ trên giao diện.
 */
export const ADMIN_GUIDES = {
  home: {
    title: 'Tổng quan quản trị',
    intro: 'Trang đầu tiên sau khi đăng nhập, cho biết số liệu nội dung và lối vào các mục quản lý.',
    steps: [
      { title: 'Xem số liệu', body: 'Bốn ô trên cùng cho biết tổng số **Cấp độ**, **Bài học**, **Từ vựng** và **Câu ví dụ** đang có trên hệ thống.' },
      { title: 'Chọn khoá học ở thanh bên', body: 'Ở thanh bên trái, mục **Khoá học** chia theo nhóm (HSK, HSKK, YCT, Giao tiếp...). Bấm tên nhóm để mở ra, rồi bấm vào một cấp độ (VD: **HSK1 — HSK 1**) để vào danh sách bài học của khoá đó.' },
      { title: 'Thêm cấp độ / khoá học mới', body: 'Bấm **+ Thêm cấp độ** ở cuối danh sách khoá học, nhập **Mã** (VD: HSK4), **Tên hiển thị**, chọn **Loại** và **Thứ tự**, rồi bấm **Tạo**. Cấp độ tự rơi vào đúng nhóm theo Loại đã chọn.' },
      { title: 'Quản lý tất cả cấp độ dạng bảng', body: 'Bấm thẻ **Quản lý chi tiết tất cả cấp độ** để sửa mã, tên, loại, thứ tự của mọi cấp độ trong một bảng.' },
      { title: 'Các mục khác', body: 'Phần **Khác** ở thanh bên gồm: Giảng viên, Học viên & thanh toán, Người dùng, Đăng ký tư vấn, Nội dung trang chủ, Font chữ & hiển thị. Mỗi mục đều có hướng dẫn riêng như thế này.', tip: 'Mục Học viên, Người dùng, Tư vấn, Trang chủ, Font chữ chỉ tài khoản Quản trị mới thấy.' }
    ],
    done: 'Bắt đầu bằng cách bấm vào một cấp độ ở thanh bên trái. Muốn xem lại hướng dẫn, bấm nút **Hướng dẫn** ở góc trên bên phải.'
  },

  levels: {
    title: 'Quản lý cấp độ / khoá học',
    intro: 'Bảng này chỉ sửa thông tin cơ bản của cấp độ (mã, tên, loại, thứ tự) — không sửa bài học bên trong.',
    steps: [
      { title: 'Thêm cấp độ mới', body: 'Bấm **+ Thêm mới**. Form hiện ra phía trên bảng.' },
      { title: 'Điền thông tin', body: '**Mã cấp độ**: mã ngắn, không trùng (VD: HSK4, CONVO-BASIC). **Tên hiển thị**: tên học viên thấy. **Loại**: quyết định cấp độ nằm ở nhóm nào trên thanh bên. **Thứ tự trong nhóm**: số nhỏ đứng trước.' },
      { title: 'Lưu', body: 'Bấm **Tạo mới** (hoặc **Lưu thay đổi** khi đang sửa). Cột **Vị trí ở sidebar** tự cập nhật theo Loại.' },
      { title: 'Sửa hoặc xoá', body: 'Trên mỗi dòng: **Sửa** để mở lại form, **Xoá** để xoá cấp độ (bài học bên trong sẽ không còn hiển thị).', tip: 'Xoá không hoàn tác được — kiểm tra kỹ trước khi xác nhận.' },
      { title: 'Vào nội dung khoá học', body: 'Bấm **Nội dung** trên dòng cấp độ để vào danh sách bài học, đặt học phí, ảnh bìa và đề thi thử.' }
    ],
    done: 'Cấp độ đã sẵn sàng. Tiếp theo bấm **Nội dung** để thêm bài học và đặt học phí.'
  },

  levelDetail: {
    title: 'Khoá học: bài học, học phí & đề thi',
    intro: 'Trang của một cấp độ: sửa thông tin bán khoá học, quản lý danh sách bài học và đề thi thử.',
    steps: [
      { title: 'Mở form sửa khoá học', body: 'Bấm **Sửa thông tin cấp độ** cạnh tên khoá ở trên cùng.' },
      { title: 'Đổi ảnh bìa', body: 'Ở ô **Ảnh bìa**, chọn file JPG/PNG/WEBP (tối đa 15MB). Ảnh **lưu ngay** khi chọn xong, không cần bấm Lưu. Bấm **Xoá ảnh** để quay về khung màu mặc định.' },
      { title: 'Đặt học phí và thông tin bán', body: 'Nhập **Học phí (VNĐ)** — để trống nghĩa là không bán, khoá sẽ hiện "Sắp mở". Điền **Thời lượng**, **Đối tượng phù hợp**, **Giới thiệu khoá học**, **Kết quả đạt được** (mỗi dòng một ý). Bỏ chọn **Hiển thị công khai** để tạm ẩn khoá.', tip: 'Chỉ khoá có học phí mới cho đăng ký mua; 2 bài đầu của khoá đang bán tự động mở học thử miễn phí.' },
      { title: 'Lưu thông tin khoá', body: 'Bấm **Lưu thay đổi**. Trang khoá học công khai cập nhật ngay.' },
      { title: 'Thêm bài học', body: 'Ở bảng **Quản lý bài học**, bấm **+ Thêm mới**, nhập **Tiêu đề bài học** (VD: Bài 1: 你好 - Xin chào), **Mô tả ngắn**, chọn **Xuất bản: Có** rồi bấm **Tạo mới**.', tip: 'Xuất bản = Không thì học viên chưa thấy bài — dùng khi đang soạn dở.' },
      { title: 'Sắp xếp bài học', body: 'Dùng mũi tên **↑ ↓** ở cột **Thứ tự** để đổi vị trí bài. Thứ tự lưu ngay.' },
      { title: 'Soạn nội dung bài', body: 'Bấm **Nội dung** trên dòng bài học để vào trình soạn bài (từ vựng, ngữ pháp, PPT, bài khoá...).' },
      { title: 'Đề thi thử (nếu có)', body: 'Cuối trang, bảng **Quản lý Đề thi thử**: bấm **+ Thêm mới**, nhập **Nhóm**, **Thứ tự**, **Tiêu đề** → **Tạo mới**. Sau đó bấm **Tải lên** ở cột File đề thi để chọn file HTML của đề.' }
    ],
    done: 'Khoá học đã có thông tin bán và danh sách bài. Bấm **Nội dung** trên từng bài để soạn chi tiết.'
  },

  'lesson-layout': {
    title: 'Thông tin & bố cục bài học',
    intro: 'Sửa tên, mô tả, lời giới thiệu bài và chọn các phần học viên sẽ thấy theo thứ tự nào.',
    steps: [
      { title: 'Chọn tab', body: 'Trên thanh tab của bài học, bấm **Thông tin & bố cục** (tab đầu tiên).' },
      { title: 'Sửa thông tin bài', body: 'Sửa **Tên bài học**, **Thứ tự bài trong khoá**, **Mô tả ngắn** (hiện ở lộ trình khoá học).' },
      { title: 'Viết lời giới thiệu', body: 'Ô **Nội dung / giới thiệu bài học** hiện ở đầu trang bài cho học viên, giữ nguyên xuống dòng — ghi mục tiêu, kiến thức trọng tâm, cách học.' },
      { title: 'Sắp xếp các phần trong bài', body: 'Ở cột **Thứ tự các phần trong bài**, dùng mũi tên **lên/xuống** để đổi vị trí, bấm **con mắt** để ẩn/hiện phần đó với học viên.', tip: '"Bài học tương tác" và "Tài liệu" chỉ hiện khi bài thực sự có nội dung tương ứng.' },
      { title: 'Xuất bản', body: 'Đánh dấu **Xuất bản bài học** để học viên thấy bài.' },
      { title: 'Lưu và kiểm tra', body: 'Bấm **Lưu thay đổi**. Bấm **Xem như học viên** ở trên cùng để mở bài ở tab mới và kiểm tra.' }
    ],
    done: 'Bố cục bài đã lưu. Chuyển sang các tab khác để thêm từ vựng, PPT, bài khoá...'
  },

  'lesson-html': {
    title: 'Bài học HTML (tương tác)',
    intro: 'Tải lên file bài học .html tự chứa (chữ, hình, âm thanh, bài tập trong 1 file) để học viên xem nguyên vẹn.',
    steps: [
      { title: 'Chọn tab', body: 'Bấm tab **Bài học HTML**.' },
      { title: 'Tải file lên', body: '**Kéo thả** file .html vào khung nét đứt, hoặc bấm vào khung để chọn file. Có thể chọn nhiều file — mỗi file thành 1 bài.' },
      { title: 'Đổi tên', body: 'Tên bài lấy theo tên file. Bấm vào ô tên, sửa lại rồi nhấn **Enter** hoặc bấm ra ngoài để lưu.' },
      { title: 'Sắp xếp và ẩn/hiện', body: 'Dùng **↑ ↓** để đổi thứ tự. Bấm nút **con mắt** để ẩn/hiện bài với học viên.' },
      { title: 'Kiểm tra', body: 'Bấm **Xem thử** để mở bài như học viên.' },
      { title: 'Cập nhật nội dung', body: 'Muốn sửa bài, soạn lại file trên máy rồi bấm **Thay file** — học viên thấy bản mới ngay. Bấm **thùng rác** để xoá hẳn.' }
    ],
    done: 'Bài học HTML đã có trong bài. Học viên mở ở mục "Bài học tương tác".'
  },

  'lesson-words': {
    title: 'Từ vựng',
    intro: 'Bảng từ vựng sửa trực tiếp như Excel, tự lưu khi rời khỏi ô.',
    steps: [
      { title: 'Chọn tab', body: 'Bấm tab **Từ vựng**.' },
      { title: 'Thêm dòng mới', body: 'Bấm **+ Thêm hàng**. Một dòng trống hiện ra cuối bảng.' },
      { title: 'Nhập 3 ô bắt buộc', body: 'Điền **汉字**, **Pinyin**, **Nghĩa**. Khi rời ô (Tab hoặc bấm ra ngoài), dòng tự lưu.', tip: 'Dòng mới thiếu 1 trong 3 ô này sẽ chưa được lưu — dòng nhắc phía trên bảng cho biết còn bao nhiêu dòng chưa lưu.' },
      { title: 'Thêm thông tin phụ', body: 'Điền **Loại từ** và câu ví dụ (**VD 汉字**, **VD Pinyin**, **VD nghĩa**). Có thể tải ảnh minh hoạ cho từ — ảnh lưu ngay.' },
      { title: 'Tải file nghe (không bắt buộc)', body: 'Ở cột **File nghe**, chọn file mp3, nghe thử rồi bấm **Dùng file này**. Nếu không có file, hệ thống tự đọc bằng giọng máy.' },
      { title: 'Tuỳ chỉnh bảng', body: 'Nút **– / +** chỉnh cỡ chữ trong bảng; **+ Thêm cột** để thêm cột ghi chú riêng. Hai thiết lập này chỉ nhớ trên máy đang dùng.' },
      { title: 'Xoá từ', body: 'Bấm biểu tượng **xoá** ở cuối dòng.' }
    ],
    done: 'Từ vựng đã lưu tự động. Học viên dùng chúng ở Từ vựng, Flashcard và Game ôn tập.'
  },

  'lesson-characters': {
    title: 'Chữ Hán',
    intro: 'Thẻ chữ Hán: nét, bộ thủ, cấu tạo, mẹo nhớ và thứ tự nét.',
    steps: [
      { title: 'Chọn tab', body: 'Bấm tab **Chữ Hán**.' },
      { title: 'Thêm chữ', body: 'Bấm **+ Thêm mới**.' },
      { title: 'Điền thông tin bắt buộc', body: 'Điền **汉字 (chữ Hán)**, **Pinyin**, **Nghĩa tiếng Việt**.' },
      { title: 'Điền thông tin chữ', body: 'Điền **Số nét**, **Cấu trúc** (VD: 左右, 上下), **Bộ thủ**, **Nghĩa bộ thủ**, **Cấu tạo chữ**, **Quy tắc viết**, **Mẹo ghi nhớ**.' },
      { title: 'Thứ tự nét', body: 'Ô **Thứ tự nét** nhập dạng danh sách trong ngoặc vuông, mỗi nét đặt trong ngoặc kép, ngăn bằng dấu phẩy. VD: ["撇","竖","横","竖弯钩"].', tip: 'Sai dấu ngoặc/dấu phẩy sẽ báo lỗi đỏ và không lưu được.' },
      { title: 'Lưu', body: 'Bấm **Tạo mới**. Muốn sửa sau này bấm **Sửa** trên dòng chữ đó.' }
    ],
    done: 'Chữ Hán đã thêm vào bài, hiện ở mục "Chữ Hán" của học viên.'
  },

  'lesson-dialogues': {
    title: 'Bài khoá (hội thoại)',
    intro: 'Mỗi bài khoá là một đoạn hội thoại gồm nhiều câu thoại, có thể kèm file nghe giọng thật.',
    steps: [
      { title: 'Chọn tab', body: 'Bấm tab **Bài khoá**.' },
      { title: 'Thêm bài khoá', body: 'Bấm **+ Thêm mới**, nhập **Thứ tự**, **Tiêu đề đoạn hội thoại**, **Nhãn audio** (VD: 1-1).' },
      { title: 'Bối cảnh', body: 'Điền **Bối cảnh (chữ Hán)** và **Bối cảnh (tiếng Anh)** nếu có. **Chú thích thêm** không bắt buộc.' },
      { title: 'Nhập câu thoại', body: 'Ở **Các câu thoại**, bấm **Thêm câu thoại** cho từng câu: **Người nói**, **汉字**, **Pinyin**, **Nghĩa tiếng Việt** (tiếng Anh không bắt buộc).' },
      { title: 'Lưu', body: 'Bấm **Tạo mới**.' },
      { title: 'Gắn file nghe', body: 'Ở cột **File nghe** trong bảng, chọn file mp3, nghe thử rồi xác nhận. Không có file thì bài khoá đọc bằng giọng máy.' }
    ],
    done: 'Bài khoá đã có trong bài, học viên đọc và nghe ở mục "Bài khoá".'
  },

  'lesson-grammar': {
    title: 'Ngữ pháp',
    intro: 'Mỗi điểm ngữ pháp gồm cấu trúc, cách dùng, ví dụ và bài tập trắc nghiệm.',
    steps: [
      { title: 'Chọn tab', body: 'Bấm tab **Ngữ pháp**.' },
      { title: 'Thêm điểm ngữ pháp', body: 'Bấm **+ Thêm mới**.' },
      { title: 'Cấu trúc & cách dùng', body: 'Nhập **Cấu trúc** (VD: A + 是 + B) và **Cách dùng** giải thích bằng tiếng Việt.' },
      { title: 'Ví dụ & lưu ý', body: 'Điền 3 ô **Ví dụ** (汉字, Pinyin, Nghĩa tiếng Việt) và **Lưu ý / lỗi thường gặp** nếu có.' },
      { title: 'Bài tập trắc nghiệm', body: 'Bấm **Thêm câu hỏi**, nhập câu hỏi, bấm **Thêm đáp án** cho từng lựa chọn và chọn đáp án đúng.', tip: 'Mỗi câu cần nội dung câu hỏi và ít nhất 2 đáp án, đáp án đúng không được để trống.' },
      { title: 'Lưu', body: 'Bấm **Tạo mới** (hoặc **Lưu thay đổi**).' }
    ],
    done: 'Điểm ngữ pháp đã lưu, học viên học và làm bài ở mục "Ngữ pháp".'
  },

  'lesson-sentences': {
    title: 'Câu (đọc / nghe)',
    intro: 'Câu dùng cho Luyện đọc, Luyện nghe và Hội thoại (nghe). Mỗi câu chỉ hiện ở mục đã chọn.',
    steps: [
      { title: 'Chọn tab', body: 'Bấm tab **Câu (đọc/nghe)**.' },
      { title: 'Thêm câu', body: 'Bấm **+ Thêm mới**, chọn **Dùng cho mục**: Luyện đọc / Luyện nghe / Hội thoại (nghe).' },
      { title: 'Nội dung câu', body: 'Nhập **汉字**, **Pinyin**, **Nghĩa tiếng Việt** và **Thứ tự**.' },
      { title: 'File nghe (không bắt buộc)', body: 'Ở **File nghe**, chọn file mp3, nghe thử, bấm **Dùng file này**.', tip: 'Sau khi bấm "Dùng file này" vẫn phải bấm Lưu ở bước cuối mới áp dụng.' },
      { title: 'Câu hỏi kiểm tra', body: 'Bấm **Thêm câu hỏi** để thêm câu hỏi trắc nghiệm hiểu câu (không bắt buộc).' },
      { title: 'Lưu', body: 'Bấm **Tạo mới** (hoặc **Lưu thay đổi**).' }
    ],
    done: 'Câu đã lưu và hiện ở đúng mục luyện tập đã chọn.'
  },

  'lesson-speaking': {
    title: 'Luyện nói (tình huống)',
    intro: 'Học viên đọc tình huống, chọn câu nói đúng rồi tập nói câu đó.',
    steps: [
      { title: 'Chọn tab', body: 'Bấm tab **Luyện nói**.' },
      { title: 'Thêm tình huống', body: 'Bấm **+ Thêm mới**, nhập **Thứ tự** và **Tình huống** bằng tiếng Việt.' },
      { title: 'Các lựa chọn', body: 'Ô **Các lựa chọn** nhập dạng danh sách, VD: ["老师，你好！","老师，您好！","大家好！","再见！"].' },
      { title: 'Đáp án đúng', body: 'Ô **Chỉ số đáp án đúng** đếm từ 0: lựa chọn thứ nhất là 0, thứ hai là 1...' },
      { title: 'Câu mẫu & giải thích', body: 'Điền **Câu cần nói (Hán tự)**, **Pinyin** và **Giải thích**.' },
      { title: 'Lưu', body: 'Bấm **Tạo mới**.' }
    ],
    done: 'Tình huống đã thêm vào mục "Luyện nói".'
  },

  'lesson-fill': {
    title: 'Điền từ (luyện viết)',
    intro: 'Câu có một chỗ trống, học viên gõ chữ Hán để điền.',
    steps: [
      { title: 'Chọn tab', body: 'Bấm tab **Điền từ**.' },
      { title: 'Thêm câu', body: 'Bấm **+ Thêm mới**, nhập **Thứ tự**.' },
      { title: 'Chia câu thành 3 phần', body: '**Đoạn trước chỗ trống** + **Từ cần điền** + **Đoạn sau chỗ trống**. VD: 我 + 是 + 学生。' },
      { title: 'Gợi ý', body: 'Điền **Gợi ý** bằng nghĩa tiếng Việt.' },
      { title: 'Đáp án được chấp nhận', body: 'Mỗi dòng một cách viết đúng (ít nhất 1 dòng).' },
      { title: 'Lưu', body: 'Bấm **Tạo mới**. Cột **Câu** trong bảng hiện dạng 我[是]学生 để kiểm tra nhanh.' }
    ],
    done: 'Câu điền từ đã có ở mục "Luyện viết".'
  },

  'lesson-slides': {
    title: 'PPT / Bài giảng',
    intro: 'Học viên xem bài giảng dạng ảnh từng trang có watermark, không tải xuống được.',
    steps: [
      { title: 'Chọn tab', body: 'Bấm tab **PPT**.' },
      { title: 'Tạo bộ bài giảng', body: 'Nhập tên vào ô **Tạo bộ bài giảng mới** (VD: PPT Bài 1: 你好), bấm **+ Tạo bộ bài giảng**.' },
      { title: 'Tải file PPT/PDF', body: 'Trong khung **Tải file PPT/PDF lên**, chọn file .ppt/.pptx/.pdf. Hệ thống tự chuyển thành ảnh từng trang.', tip: 'File ít trang thường dưới 1 phút; file vài trăm trang mất nhiều phút — có thể rời trang, hệ thống vẫn xử lý ngầm.' },
      { title: 'Kiểm tra', body: 'Khi số trang hiện lên (VD: "24 trang · phiên bản 1"), bấm **Xem thử** để xem như học viên.' },
      { title: 'Lưu file gốc (không bắt buộc)', body: 'Ở mục **File PowerPoint gốc**, chọn file để lưu trữ — học viên không thấy, chỉ giáo viên/admin bấm **Tải xuống** được.' },
      { title: 'Cập nhật / xoá', body: 'Tải file mới vào khung chuyển đổi để thay bài giảng (phiên bản tăng lên). Bấm **Xoá** để xoá cả bộ.' }
    ],
    done: 'Bài giảng đã sẵn sàng ở mục "PPT / Bài giảng" của học viên.'
  },

  'lesson-videos': {
    title: 'Video',
    intro: 'Video tình huống hoặc bài giảng gắn vào bài học.',
    steps: [
      { title: 'Chọn tab', body: 'Bấm tab **Video**.' },
      { title: 'Thêm video', body: 'Bấm **+ Thêm mới**, nhập **Tiêu đề video**.' },
      { title: 'Dán link', body: 'Dán **Link video**: link YouTube hoặc link file video công khai (mp4...). Điền **Mô tả** nếu cần.' },
      { title: 'Phụ đề theo câu (không bắt buộc)', body: 'Ô **Bản chép theo câu** nhập dạng: [{"start":0,"end":3,"hanzi":"你好","pinyin":"nǐ hǎo","vi":"Xin chào"}] — start/end tính bằng giây.', tip: 'Phụ đề chỉ chạy theo video khi dùng link mp4 trực tiếp, không áp dụng cho YouTube.' },
      { title: 'Lưu', body: 'Bấm **Tạo mới**.' }
    ],
    done: 'Video đã gắn vào bài học.'
  },

  'lesson-songs': {
    title: 'Bài hát',
    intro: 'Học tiếng Trung qua bài hát với lời chạy theo từng câu.',
    steps: [
      { title: 'Chọn tab', body: 'Bấm tab **Bài hát**.' },
      { title: 'Thêm bài hát', body: 'Bấm **+ Thêm mới**, nhập **Tên bài hát**.' },
      { title: 'Link nhạc', body: 'Dán **Link nhạc/audio** (file mp3 hoặc link công khai).' },
      { title: 'Lời bài hát', body: 'Ô **Lời bài hát theo câu** nhập dạng: [{"start":0,"end":3,"hanzi":"你好你好","pinyin":"nǐ hǎo nǐ hǎo","vi":"Xin chào, xin chào"}] — start/end tính bằng giây.' },
      { title: 'Ghi chú & lưu', body: 'Điền **Từ vựng/ngữ pháp học được qua bài hát**, rồi bấm **Tạo mới**.' }
    ],
    done: 'Bài hát đã thêm vào bài học.'
  },

  'lesson-docs': {
    title: 'Tài liệu đính kèm',
    intro: 'PDF, Word, Excel, PowerPoint, ảnh, file nghe hoặc .zip (tối đa 100MB/file) cho học viên tải.',
    steps: [
      { title: 'Chọn tab', body: 'Bấm tab **Tài liệu**.' },
      { title: 'Tải lên', body: 'Bấm **Tải tài liệu lên** và chọn một hoặc nhiều file.' },
      { title: 'Đổi tên hiển thị', body: 'Bấm vào ô tên tài liệu, sửa lại, nhấn **Enter** để lưu.' },
      { title: 'Sắp xếp', body: 'Dùng **↑ ↓** để đổi thứ tự.' },
      { title: 'Kiểm tra / thay / xoá', body: '**Mở** để xem file, **Thay file** để cập nhật bản mới, **thùng rác** để xoá.' }
    ],
    done: 'Học viên của khoá mở/tải tài liệu ở mục "Tài liệu đính kèm" trong bài.'
  },

  instructors: {
    title: 'Giảng viên',
    intro: 'Danh sách giảng viên kèm ảnh, chức danh và giới thiệu.',
    steps: [
      { title: 'Tải ảnh đại diện', body: 'Trong khung **Tải ảnh đại diện giảng viên lên**, chọn ảnh. Đường dẫn ảnh hiện ra ngay bên dưới — bôi đen và sao chép.' },
      { title: 'Thêm giảng viên', body: 'Bấm **+ Thêm mới**.' },
      { title: 'Điền thông tin', body: 'Nhập **Họ và tên**, **Chức danh**, dán đường dẫn vừa sao chép vào **Đường dẫn ảnh đại diện**, điền **Giới thiệu / kinh nghiệm / bằng cấp** và **Thứ tự hiển thị**.' },
      { title: 'Lưu', body: 'Bấm **Tạo mới**. Sửa/xoá bằng nút **Sửa**, **Xoá** trên từng dòng.' }
    ],
    done: 'Giảng viên đã được thêm.'
  },

  students: {
    title: 'Học viên & thanh toán',
    intro: 'Quy trình: học viên đặt mua → bạn xác nhận đã nhận tiền → hệ thống cấp quyền học cho email đó.',
    steps: [
      { title: 'Xem đơn chờ thanh toán', body: 'Tab **Đơn đăng ký / thanh toán** mặc định lọc **Chờ thanh toán**. Mỗi đơn có mã đơn, email, SĐT, khoá học và số tiền.' },
      { title: 'Đối chiếu tiền', body: 'Kiểm tra tài khoản ngân hàng: số tiền và nội dung chuyển khoản (học viên được dặn ghi đúng **Mã đơn**) khớp với đơn.' },
      { title: 'Xác nhận đơn', body: 'Bấm **Xác nhận đã thanh toán** rồi đồng ý. Nếu sai/không nhận được tiền, bấm **Từ chối** và ghi lý do.' },
      { title: 'Gửi tài khoản cho học viên', body: 'Khung thông báo hiện **email** và **mật khẩu tạm** (nếu là tài khoản mới). Sao chép gửi cho học viên ngay.', tip: 'Mật khẩu tạm chỉ hiển thị một lần.' },
      { title: 'Cấp quyền thủ công', body: 'Tab **Học viên theo khoá** → khung **Cấp quyền thủ công cho một email**: nhập **Email học viên**, **Họ tên**, chọn **Khoá học**, bấm **+ Cấp quyền**.' },
      { title: 'Theo dõi & thu hồi', body: 'Bảng học viên cho thấy trạng thái và **Tiến độ**. Đổi ở cột **Đổi trạng thái**; chọn **Đã thu hồi** để chặn học viên xem khoá đó.' }
    ],
    done: 'Học viên đăng nhập bằng email đã cấp và chỉ thấy các khoá được cấp quyền.'
  },

  users: {
    title: 'Người dùng & nhật ký',
    intro: 'Quản lý tài khoản giáo viên/quản trị, khoá tài khoản, cấp lại mật khẩu và xem nhật ký.',
    steps: [
      { title: 'Tạo tài khoản', body: 'Ở tab **Người dùng**, khung **Tạo tài khoản giáo viên/quản trị**: nhập **Họ tên**, **Email**, **Mật khẩu** (để trống = 123456), chọn **Vai trò**.' },
      { title: 'Lưu tài khoản', body: 'Bấm **+ Tạo tài khoản**. Tài khoản mới hiện trong bảng bên dưới.', tip: 'Giáo viên chỉ soạn nội dung; Quản trị thấy thêm học viên, thanh toán, trang chủ.' },
      { title: 'Khoá / mở khoá', body: 'Bấm **Khoá** để chặn đăng nhập (VD: nhân sự nghỉ việc), **Mở khoá** để khôi phục.' },
      { title: 'Cấp lại mật khẩu', body: 'Bấm **Cấp lại MK** khi người dùng quên mật khẩu. Hộp thoại hiện **mật khẩu tạm** — sao chép gửi cho họ. Mật khẩu cũ mất hiệu lực và mọi thiết bị bị đăng xuất.', tip: 'Cột **Thiết bị** là số thiết bị đang đăng nhập — mỗi tài khoản tối đa 2.' },
      { title: 'Xem nhật ký', body: 'Tab **Nhật ký hoạt động** liệt kê đăng nhập, xem tài liệu, tải file... để kiểm tra khi cần.' }
    ],
    done: 'Tài khoản đã được quản lý xong.'
  },

  consultations: {
    title: 'Đăng ký tư vấn',
    intro: 'Danh sách khách để lại thông tin ở form "Đăng ký tư vấn" trên trang chủ.',
    steps: [
      { title: 'Xem yêu cầu mới', body: 'Tab **Mới** hiện các yêu cầu chưa xử lý, kèm số lượng.' },
      { title: 'Liên hệ khách', body: 'Xem cột **Liên hệ qua** (Zalo/Facebook/Gọi điện). Bấm số điện thoại để gọi, hoặc email để gửi thư.' },
      { title: 'Cập nhật trạng thái', body: 'Ở cột **Trạng thái**, chọn **Đã liên hệ** sau khi gọi, **Đã xong** khi đã chốt hoặc kết thúc.' },
      { title: 'Lọc & dọn dẹp', body: 'Bấm các tab **Đã liên hệ**, **Đã xong**, **Tất cả** để lọc. Bấm **thùng rác** để xoá yêu cầu rác.' }
    ],
    done: 'Không bỏ sót khách nào khi tab "Mới" về 0.'
  },

  homepage: {
    title: 'Nội dung trang chủ',
    intro: 'Sửa chữ, ảnh, liên hệ và các mục trên trang chủ công khai mà không cần sửa code.',
    steps: [
      { title: 'Mở từng khung', body: 'Bấm tiêu đề mỗi khung (Thông tin liên hệ, Banner, Khoá học...) để mở/đóng.' },
      { title: 'Thông tin liên hệ', body: 'Điền **Hotline**, **Email**, **Địa chỉ**, **Giờ làm việc**, link **Facebook/YouTube/TikTok/Zalo**.', tip: 'Hotline và Zalo dùng cho 2 nút rung ở góc dưới màn hình. Để trống Zalo sẽ tự dùng zalo.me/<Hotline>.' },
      { title: 'Banner & giới thiệu', body: 'Sửa chữ ở **Banner đầu trang**, **Ảnh hoạt động & 3 ô lối tắt**, **Giới thiệu - Tại sao chọn chúng tôi**. Ảnh để trống sẽ dùng ảnh mặc định.' },
      { title: 'Ảnh bìa sách', body: 'Khung **Ảnh bìa sách** đổi bìa từng khoá ngay tại đây — ảnh lưu ngay, không cần bấm Lưu.' },
      { title: 'Tin tức, video, giảng viên, cảm nhận', body: 'Bấm nút **Thêm...** trong từng khung để thêm mục. Mục nào rỗng sẽ tự ẩn khỏi trang chủ.', tip: 'Chỉ nhập cảm nhận thật của học viên.' },
      { title: 'Link', body: 'Ô link có thể là trang nội bộ (/courses), mục trên trang chủ (#dang-ky) hoặc địa chỉ đầy đủ (https://...).' },
      { title: 'Lưu', body: 'Bấm **Lưu thay đổi** ở thanh dưới cùng (nút chỉ bật khi có thay đổi).' },
      { title: 'Kiểm tra', body: 'Bấm **Xem trang chủ** ở đầu trang để mở trang công khai ở tab mới.' }
    ],
    done: 'Trang chủ đã cập nhật cho mọi khách truy cập.'
  },

  typography: {
    title: 'Font chữ & hiển thị',
    intro: 'Đổi font, cỡ chữ, màu chữ cho toàn bộ trang học của học viên.',
    steps: [
      { title: 'Chọn font', body: 'Chọn **Font chữ Hán**, **Font tiếng Việt** và **Độ đậm chữ Hán**.' },
      { title: 'Chỉnh cỡ chữ', body: 'Kéo các thanh **Cỡ chữ Hán**, **Cỡ chữ Hán trên điện thoại**, **Cỡ pinyin**, **Cỡ phần dịch nghĩa**, **Cỡ chữ tiếng Việt chung**, **Khoảng cách dòng**.' },
      { title: 'Chọn màu', body: 'Đổi màu **Chữ thường**, **Chữ Hán**, **Pinyin**, **Dịch nghĩa**.' },
      { title: 'Xem trước', body: 'Khung bên phải hiển thị kết quả ngay. Bấm **Máy tính** / **Điện thoại** để xem hai kiểu màn hình.' },
      { title: 'Lưu', body: 'Bấm **Lưu** để áp dụng cho học viên. Bấm **Khôi phục mặc định** nếu muốn làm lại từ đầu (rồi bấm Lưu).' }
    ],
    done: 'Giao diện chữ mới đã áp dụng cho toàn bộ trang học.'
  },

  guide: {
    title: 'Hướng dẫn sử dụng',
    intro: 'Trang này tổng hợp hướng dẫn của mọi mục trong trang quản trị.',
    steps: [
      { title: 'Hướng dẫn tự mở', body: 'Mỗi khi bấm vào một mục (hoặc một tab trong bài học), pop-up hướng dẫn của mục đó tự hiện ra.' },
      { title: 'Đi qua từng bước', body: 'Bấm **Tiếp theo** / **Quay lại**, hoặc bấm vào chấm tròn để nhảy tới bước bất kỳ. Bước cuối bấm **Hoàn tất**.' },
      { title: 'Tắt tự mở', body: 'Đánh dấu **Không tự mở lại ở mục này** nếu đã quen thao tác. Hướng dẫn vẫn mở lại được bất cứ lúc nào.' },
      { title: 'Mở lại hướng dẫn', body: 'Bấm nút **Hướng dẫn** ở góc trên bên phải của mọi trang quản trị.' },
      { title: 'Xem toàn bộ', body: 'Kéo xuống trang này để xem hoặc mở hướng dẫn của bất kỳ mục nào.' }
    ],
    done: 'Bạn đã biết cách dùng hướng dẫn.'
  }
};

/** Thứ tự hiển thị ở trang "Hướng dẫn sử dụng". */
export const GUIDE_ORDER = [
  'home', 'levels', 'levelDetail',
  'lesson-layout', 'lesson-html', 'lesson-words', 'lesson-characters', 'lesson-dialogues', 'lesson-grammar',
  'lesson-sentences', 'lesson-speaking', 'lesson-fill', 'lesson-slides', 'lesson-videos', 'lesson-songs', 'lesson-docs',
  'instructors', 'students', 'users', 'consultations', 'homepage', 'typography'
];

/** Tìm hướng dẫn ứng với trang quản trị đang mở (theo đường dẫn + ?tab= của trình soạn bài). */
export function guideKeyFor(pathname, search) {
  const p = pathname.replace(/\/+$/, '');
  if (/^\/admin\/levels\/[^/]+\/lessons\/[^/]+$/.test(p)) {
    const tab = new URLSearchParams(search).get('tab') || 'layout';
    return ADMIN_GUIDES[`lesson-${tab}`] ? `lesson-${tab}` : 'lesson-layout';
  }
  if (/^\/admin\/levels\/[^/]+$/.test(p)) return 'levelDetail';
  if (p === '/admin') return 'home';
  const key = p.replace(/^\/admin\//, '');
  return ADMIN_GUIDES[key] ? key : null;
}
