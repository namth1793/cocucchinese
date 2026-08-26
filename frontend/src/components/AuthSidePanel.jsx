import { GraduationCap } from 'lucide-react';

/**
 * Panel minh hoạ bên cạnh form đăng nhập/đăng ký. Dùng con dấu thương hiệu +
 * bong bóng chào hỏi thay cho hình mascot, và một câu thành ngữ Hán cổ (tục
 * ngữ dân gian, không thuộc quyền sở hữu của bất kỳ ai) làm điểm nhấn nội
 * dung học thuật, phù hợp chủ đề học tiếng Trung.
 */
export default function AuthSidePanel() {
  return (
    <div className="auth-panel-brand">
      <div className="auth-illustration">
        <div className="auth-illustration-circle">
          <span className="auth-illustration-seal">汉</span>
          <div className="auth-illustration-bubble">
            <span className="ab-hanzi">你好</span>
            <span className="ab-pinyin">nǐ hǎo</span>
          </div>
        </div>
        <div className="auth-illustration-badge">
          <GraduationCap size={14} /> Lộ trình chuẩn HSK · YCT
        </div>
      </div>
      <p className="auth-proverb-cn">千里之行，始于足下</p>
      <h2>Vạn dặm đường xa,<br />bắt đầu từ bước chân đầu tiên</h2>
      <p>Mỗi buổi học hôm nay là một bước tiến gần hơn tới mục tiêu chinh phục tiếng Trung của bạn.</p>
    </div>
  );
}
