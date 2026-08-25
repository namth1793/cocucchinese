# Cô Cúc Chinese — Website Học Tiếng Trung

Triển khai theo tài liệu đặc tả "Yêu cầu chức năng website học tiếng Trung" (mobile-first, song ngữ Trung–Việt, HSK/YCT, hệ thống dạng bài dùng chung).

```
cocuc/
├── backend/   # API Node.js + Express, lưu dữ liệu dạng JSON file (không cần cài DB ngoài)
└── frontend/  # React + Vite, giao diện mobile-first
```

## Chạy thử (development)

**Backend** (mặc định cổng 4000, tự seed dữ liệu mẫu lần chạy đầu tiên):
```
cd backend
npm install
npm run dev      # hoặc: npm start
```

**Frontend** (mặc định cổng 5173, đã cấu hình proxy `/api` và `/uploads` sang backend):
```
cd frontend
npm install
npm run dev
```

Mở `http://localhost:5173`.

### Tài khoản demo (được tạo tự động khi seed)
| Vai trò | Email | Mật khẩu |
|---|---|---|
| Quản trị | admin@cocucchinese.vn | admin123 |
| Giáo viên | teacher@cocucchinese.vn | teacher123 |
| Học sinh | student@cocucchinese.vn | student123 |

Dữ liệu mẫu gồm 1 bài học đầy đủ (HSK1 – Bài 1: 你好) để test toàn bộ các module.

## Kiến trúc dạng bài dùng chung (mục 15 đặc tả)

Giáo viên/Admin chỉ nhập **dữ liệu gốc** (từ vựng, câu, ngữ pháp) qua trang Quản trị (`/admin`). Từ cùng một bộ dữ liệu, backend (`backend/src/utils/exerciseGenerator.js`) tự sinh nhiều dạng bài: Trung→Việt, Việt→Trung, Pinyin→Hán tự, Nghe→chọn, Ghép đôi, Memory, Sắp xếp câu, Xây câu... Frontend dùng lại 2 engine chung: `ExerciseRunner` (trắc nghiệm) và `TokenSentenceGame` (ghép câu) cho toàn bộ HSK/YCT thay vì code riêng từng bài.

Kết quả làm bài được lưu theo từng học sinh (`progress` collection) để tính % hoàn thành từng phần, tổng hợp trang Kết quả cuối bài, và tự động đưa từ/câu sai vào hàng đợi **Ôn tập** (`/review`).

## Ẩn/hiện Pinyin toàn site

`PinyinContext` lưu trạng thái vào `localStorage`, đồng bộ ngay lập tức (không tải lại trang) cho toàn bộ Từ vựng, Flashcard, Ngữ pháp, Đọc, Nghe, Shadowing, Hội thoại, Dịch qua component `Hanzi`.

## Bảo mật nội dung (mục 18)

- PPT/PDF: ảnh từng trang **không** serve qua static route công khai. Học sinh xem qua endpoint có token JWT ngắn hạn (5 phút, gắn với phiên đăng nhập) — không có nút tải xuống, không lộ URL file gốc. Ở chế độ R2, token này đổi thành URL ký (presigned) sống 90 giây do server phát hành sau khi đã xác thực, cùng mức bảo mật như bản local.
- Watermark động (tên + email + thời gian) hiển thị đè lên trình xem PPT.
- Giới hạn 2 thiết bị đăng nhập đồng thời/tài khoản; đăng nhập thiết bị thứ 3 sẽ tự đăng xuất phiên cũ nhất.
- Chặn chuột phải / Ctrl+C / Ctrl+U / Ctrl+S ở mức trình duyệt trên các trang nội dung học (`ProtectedContent`) — đây là biện pháp hạn chế hợp lý, **không** cam kết ngăn chặn tuyệt đối chụp/quay màn hình (đúng như lưu ý trong đặc tả).
- Nội dung bài học (đáp án, PPT) yêu cầu đăng nhập. Riêng ảnh minh hoạ từ vựng (ít nhạy cảm) ở chế độ R2 được phục vụ public qua CDN để tối ưu tốc độ/chi phí — xem phần đánh đổi ở mục lưu trữ bên dưới.
- Admin có thể khoá/mở khoá tài khoản và xem nhật ký hoạt động (đăng nhập, xem tài liệu, upload...).

## Lưu trữ file: ổ đĩa cục bộ hay Cloudflare R2

Toàn bộ việc đọc/ghi file đi qua một lớp trừu tượng (`backend/src/storage/`) với 2 cách triển khai cùng interface — code ở các route không cần biết đang chạy chế độ nào:

- **`local`** (mặc định) — lưu vào `backend/uploads/`, không cần cấu hình gì. Phù hợp dev/demo, nhưng **không phù hợp production có nhiều người dùng cùng lúc** vì mọi ảnh/PPT đều phải đi qua chính server Node, tốn băng thông + CPU của server API.
- **`r2`** — lưu trên [Cloudflare R2](https://developers.cloudflare.com/r2/) (tương thích S3, **không tính phí băng thông ra**). Tự động bật khi khai báo đủ 5 biến môi trường `R2_*` trong `backend/.env` — không cần sửa code.

### Cách bật chế độ R2

1. Tạo tài khoản Cloudflare → R2 → tạo **2 bucket**: một cho ảnh minh hoạ (vd. `cocuc-media`), một cho trang PPT (vd. `cocuc-slides`, **để private**, không bật Public Access).
2. Bucket `cocuc-media`: vào Settings → bật **Public Access** (dùng domain `pub-xxxx.r2.dev` có sẵn, hoặc gắn custom domain riêng để có CDN cache tốt hơn).
3. Vào **R2 → Manage API Tokens** → tạo token có quyền đọc/ghi cả 2 bucket → lấy `Account ID`, `Access Key ID`, `Secret Access Key`.
4. Điền vào `backend/.env`:
   ```
   R2_ACCOUNT_ID=...
   R2_ACCESS_KEY_ID=...
   R2_SECRET_ACCESS_KEY=...
   R2_BUCKET_MEDIA=cocuc-media
   R2_BUCKET_SLIDES=cocuc-slides
   R2_MEDIA_PUBLIC_URL=https://pub-xxxx.r2.dev   # hoặc domain riêng
   ```
5. Khởi động lại backend — log sẽ in `Chế độ lưu trữ file: Cloudflare R2`.

### Cách hoạt động

- **Ảnh minh hoạ**: server nhận file (buffer trong RAM, không ghi ra đĩa) → upload thẳng lên bucket public → lưu **URL CDN đầy đủ** vào DB. Từ đó `<img>` tải thẳng từ CDN, hoàn toàn không qua server Node nữa.
- **Trang PPT**: lưu ở bucket private. Khi học sinh xem, server vẫn xác thực JWT + phiên đăng nhập y như cũ, rồi **chuyển hướng (302 redirect)** sang URL ký ngắn hạn (90 giây) — trình duyệt tải file trực tiếp từ R2, server Node chỉ tốn công xác thực chứ không tốn băng thông truyền file.
- Vì vậy, phần tốn tài nguyên nhất (truyền file ảnh/PPT cho nhiều người xem cùng lúc) được **đẩy hoàn toàn ra khỏi server ứng dụng**, sang hạ tầng CDN của Cloudflare — đây là điều giúp chịu tải lớn với chi phí thấp.
- Không có tài khoản R2 hoặc thiếu biến môi trường → tự động rơi về chế độ `local`, ứng dụng vẫn chạy bình thường như trước.

## Phạm vi đã triển khai theo mức ưu tiên

- **P0 – Bắt buộc**: tài khoản học sinh/giáo viên/admin, cấu trúc HSK/YCT → Bài, từ vựng, audio (Web Speech API 🔊), bài tập chấm đúng/sai + lưu lỗi sai, tiến độ, PPT/PDF bảo mật. ✅
- **P1 – Quan trọng**: Flashcard, Ngữ pháp, Nghe, Đọc, Dịch, 6 game ôn tập, Shadowing (thu âm trình duyệt), Kết quả cuối bài. ✅
- **P2 – Nâng cấp**: Video tình huống (nhúng qua link) và Bài hát (lời chạy theo câu) đã có khung chức năng đầy đủ để giáo viên nhập link thật; AI chấm phát âm/bài dịch, bảng thành tích nâng cao, cá nhân hoá lộ trình bằng AI — **chưa** triển khai, đúng định hướng "Phiên bản 2/3" của đặc tả.

## Ghi chú kỹ thuật

- Phát âm 🔊 dùng Web Speech API (`speechSynthesis`, giọng `zh-CN`) thay vì phải quản lý file audio riêng cho từng từ/câu — hoạt động trên hầu hết trình duyệt Chrome/Edge hiện đại.
- Shadowing dùng `MediaRecorder` để thu âm học sinh và phát lại so sánh với giọng mẫu (TTS); chưa có chấm điểm AI (đúng như đặc tả phiên bản 1).
- Dữ liệu lưu ở file JSON (`backend/data/db.json`) — phù hợp để demo/triển khai nhỏ, không cần cài đặt database ngoài. Có thể thay bằng PostgreSQL/MongoDB sau này mà không đổi API vì toàn bộ truy cập dữ liệu đã tập trung qua `backend/src/db.js`.
