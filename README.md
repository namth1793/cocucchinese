# HSK 360 — Website Học Tiếng Trung

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

Dữ liệu mẫu gồm 1 bài học đầy đủ (HSK1 – Bài 1: 你好) để test toàn bộ các module. Backend tự tạo 3 tài khoản mẫu (quản trị/giáo viên/học sinh) ở lần chạy đầu tiên khi database còn trống — xem `backend/src/seed.js` để biết email/mật khẩu, **đổi ngay mật khẩu các tài khoản này (hoặc khoá/xoá nếu không cần) trước khi triển khai thật**, không để lộ trong tài liệu công khai.

## Mua khoá học & phân quyền theo email

Mỗi **cấp độ (level)** là một **khoá học**. Quy trình:

`Xem khoá học (/courses) → Đăng ký mua (form) → Chuyển khoản → Admin xác nhận thanh toán → Cấp quyền cho email → Đăng nhập → Chỉ thấy khoá đã được cấp → Học`

- **Công khai (không cần đăng nhập)**: `/courses` (danh sách), `/courses/:id` (giới thiệu, học phí, lộ trình - chỉ tiêu đề bài, không lộ nội dung), `/order/:mã` (hướng dẫn chuyển khoản + theo dõi trạng thái). API: `GET /api/courses`, `GET /api/courses/:id`, `POST /api/orders`, `GET /api/orders/lookup/:code`.
- **Không còn đăng ký tài khoản tự do.** Tài khoản học viên chỉ được tạo khi admin xác nhận đơn (hoặc cấp quyền thủ công). Học viên tự đặt mật khẩu ngay ở form đăng ký; nếu admin cấp thủ công cho email mới, hệ thống sinh mật khẩu tạm hiển thị **một lần** cho admin gửi lại.
- **Đăng nhập**: học viên chỉ đăng nhập được khi email có ít nhất 1 quyền khoá học đang hiệu lực; thu hồi khoá cuối cùng sẽ đăng xuất mọi thiết bị ngay.
- **Trạng thái học viên theo từng khoá**: `purchased` (đã mua) → `learning` (đang học, tự chuyển khi lần đầu mở nội dung) → `completed` (hoàn thành, admin đặt) hoặc `revoked` (thu hồi). Ba trạng thái đầu đều có quyền truy cập; `revoked` thì mất quyền.
- **Bảo vệ nội dung ở backend** (`backend/src/utils/access.js`): mọi API nội dung (từ vựng, ngữ pháp, câu, hội thoại, chữ Hán, bài tập, flashcard, tiến độ, đề thi thử, bài giảng PPT/PDF, `/lessons/:id/full`...) kiểm tra quyền theo khoá; danh sách tự lọc chỉ còn khoá được cấp, truy cập khoá khác trả `403`. Admin/giáo viên không bị giới hạn. Frontend chỉ thêm lớp thông báo (`CourseGate`), không phải lớp bảo mật.
- **Quản trị** (`/admin/students`, chỉ admin): tab *Đơn đăng ký / thanh toán* (xác nhận / từ chối), tab *Học viên theo khoá* (cấp quyền thủ công theo email, đổi trạng thái, thu hồi). Trang sửa cấp độ có thêm học phí, thời lượng, đối tượng, giới thiệu, kết quả đạt được, ẩn/hiện. Chỉ cấp độ **đã đặt học phí** mới hiện ở trang công khai. Trang *Người dùng* có nút "Cấp lại MK".
- **Thông tin chuyển khoản** cấu hình qua `BANK_NAME`, `BANK_ACCOUNT`, `BANK_ACCOUNT_NAME`, `PAYMENT_NOTE` trong `backend/.env` (xem `.env.example`). Xác nhận thanh toán hiện là **thủ công** (admin đối chiếu sao kê); chưa tích hợp cổng thanh toán/webhook, chưa gửi email tự động.
- **Migration một lần** (`backend/src/migrate.js`, chạy khi backend khởi động): học viên đã có từ trước được cấp quyền mọi khoá hiện có (để không bị khoá ngoài), và các khoá HSK có từ 5 bài trở lên được gán học phí **mẫu** (HSK1 499k, HSK2 599k, HSK3 699k...) - hãy sửa lại ở trang chỉnh sửa cấp độ.

## Ảnh bìa khoá học

Mỗi khoá học (cấp độ) có 1 ảnh bìa dạng bìa sách, hiện ở trang chủ, danh sách khoá học và trang chi tiết.

- **Admin đổi ảnh** ở trang chỉnh sửa cấp độ (`/admin/levels/:id` → Sửa thông tin cấp độ): tải lên JPG/PNG/WEBP/GIF, tối đa 15MB, nên dùng ảnh dọc tỉ lệ ~4:5. Lưu ngay khi chọn file, không cần bấm "Lưu thay đổi". Có nút xoá ảnh (quay về khung màu + mã cấp độ).
- Ảnh lưu qua cùng lớp `storage` với ảnh minh hoạ khác (`saveCover`) - ở chế độ `local` lưu vào `backend/uploads/covers/` và phục vụ **công khai** (không cần đăng nhập, khác với `/uploads/media` yêu cầu đăng nhập) vì trang danh sách khoá học là trang công khai; ở chế độ R2 dùng chung bucket media.
- **Ảnh mặc định có sẵn**: `backend/seed-assets/covers/<MÃ CẤP ĐỘ>.<đuôi>` (vd. `HSK1.jpg`) là bìa sách giáo trình chuẩn HSK/YCT/HSKK và các đầu sách giao tiếp tương ứng, tải về từ nhasachtiengtrung.com để demo. Migration `level-covers-v1` (trong `migrate.js`, chạy 1 lần) tự nạp ảnh này cho cấp độ chưa có `coverUrl`. Xoá cả file trong `seed-assets/covers/` nếu muốn tự cung cấp bộ ảnh khác trước lần chạy đầu.

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

## Cơ sở dữ liệu: file JSON hay PostgreSQL

Cùng nguyên tắc "chọn engine theo biến môi trường, không đổi code" như phần lưu trữ file ở trên (`backend/src/db/`):

- **`json`** (mặc định) — lưu vào `backend/data/db.json`. Không cần cài gì, phù hợp dev/demo. **Không phù hợp khi có nhiều học viên hoạt động đồng thời**: mỗi lần có ai đăng nhập, nộp bài, admin sửa nội dung... server phải ghi lại **toàn bộ file** xuống đĩa; càng nhiều dữ liệu, mỗi lần ghi càng chậm. Cũng không dùng được nếu sau này chạy nhiều server song song (mỗi server giữ 1 bản cache riêng, dữ liệu sẽ lệch nhau).
- **`postgres`** — tự động bật khi khai báo `DATABASE_URL` trong `backend/.env` (chuỗi kết nối chuẩn `postgresql://user:pass@host:5432/dbname`, lấy từ Railway/DigitalOcean/Supabase hoặc bất kỳ PostgreSQL nào). Mỗi collection là 1 bảng, dữ liệu lưu dạng JSONB - giữ nguyên mô hình linh hoạt hiện tại (không phải khai báo cột cứng cho từng loại nội dung), nên toàn bộ route/logic hiện tại không cần sửa gì.

### Chuyển dữ liệu cũ từ file JSON sang PostgreSQL

Áp dụng khi đã chạy `local` một thời gian (có dữ liệu thật) và muốn nâng lên PostgreSQL:

1. Tạo database PostgreSQL (Railway: New → Database → PostgreSQL là nhanh nhất; hoặc DigitalOcean Managed Database, Supabase...), lấy connection string.
2. Khai báo `DATABASE_URL=...` vào `backend/.env` (**chưa** khởi động lại backend vội).
3. Chạy `npm run migrate:postgres` (thư mục `backend/`) — script đọc `backend/data/db.json` và nhập vào PostgreSQL. An toàn chạy lại nhiều lần (bỏ qua bản ghi đã có, không tạo trùng).
4. Kiểm tra log "Hoàn tất", đối chiếu số bản ghi mỗi collection.
5. Khởi động lại backend bình thường (`npm start`) — từ giờ backend đọc/ghi thẳng PostgreSQL. File `db.json` cũ giữ nguyên như một bản sao lưu, không còn được backend dùng tới nữa.

Không cần đổi `DATABASE_URL` để "tắt" Postgres quay lại JSON - chỉ cần xoá/comment biến này trong `.env`, backend sẽ tự dùng lại `db.json` (lưu ý: dữ liệu ghi vào Postgres sau khi chuyển sẽ **không** tự động đồng bộ ngược lại file JSON).

## Phạm vi đã triển khai theo mức ưu tiên

- **P0 – Bắt buộc**: tài khoản học sinh/giáo viên/admin, cấu trúc HSK/YCT → Bài, từ vựng, audio (Web Speech API 🔊), bài tập chấm đúng/sai + lưu lỗi sai, tiến độ, PPT/PDF bảo mật. ✅
- **P1 – Quan trọng**: Flashcard, Ngữ pháp, Nghe, Đọc, Dịch, 6 game ôn tập, Shadowing (thu âm trình duyệt), Kết quả cuối bài. ✅
- **P2 – Nâng cấp**: Video tình huống (nhúng qua link) và Bài hát (lời chạy theo câu) đã có khung chức năng đầy đủ để giáo viên nhập link thật; AI chấm phát âm/bài dịch, bảng thành tích nâng cao, cá nhân hoá lộ trình bằng AI — **chưa** triển khai, đúng định hướng "Phiên bản 2/3" của đặc tả.

## Ghi chú kỹ thuật

- Phát âm 🔊 dùng Web Speech API (`speechSynthesis`, giọng `zh-CN`) thay vì phải quản lý file audio riêng cho từng từ/câu — hoạt động trên hầu hết trình duyệt Chrome/Edge hiện đại.
- Shadowing dùng `MediaRecorder` để thu âm học sinh và phát lại so sánh với giọng mẫu (TTS); chưa có chấm điểm AI (đúng như đặc tả phiên bản 1).
- Dữ liệu lưu ở file JSON (`backend/data/db.json`) theo mặc định, hoặc PostgreSQL khi khai báo `DATABASE_URL` — xem mục "Cơ sở dữ liệu" ở trên. Toàn bộ route/logic đi qua `backend/src/db/` (không gọi thẳng file/DB), nên đổi engine không cần sửa API.
