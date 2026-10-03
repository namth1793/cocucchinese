import {
  Presentation, BookOpen, Layers, GraduationCap, Gamepad2, Headphones,
  BookText, Mic2, Repeat, PenLine, MessagesSquare, PenTool, FileCode2, Paperclip
} from 'lucide-react';

/**
 * Các phần (module) trong 1 bài học, theo thứ tự mặc định. Admin sắp xếp lại / ẩn bớt cho
 * từng bài ở tab "Bố cục bài học" (lưu vào lesson.sections). "html" và "docs" chỉ hiện
 * khi bài thực sự có bài học HTML / tài liệu đính kèm.
 */
export const LESSON_MODULES = [
  { key: 'html', icon: FileCode2, label: 'Bài học tương tác', path: 'html', color: '#C2410C', onlyWhenContent: true },
  { key: 'ppt', icon: Presentation, label: 'PPT / Bài giảng', path: 'ppt', color: '#B91C1C' },
  { key: 'vocab', icon: BookOpen, label: 'Từ vựng', path: 'vocab', color: '#DC2626' },
  { key: 'hanzi', icon: PenTool, label: 'Chữ Hán', path: 'hanzi', color: '#6B21A8' },
  { key: 'flashcard', icon: Layers, label: 'Flashcard', path: 'flashcards', color: '#D97706' },
  { key: 'text', icon: MessagesSquare, label: 'Bài khoá', path: 'text', color: '#0D7377' },
  { key: 'grammar', icon: GraduationCap, label: 'Ngữ pháp', path: 'grammar', color: '#2563EB' },
  { key: 'games', icon: Gamepad2, label: 'Game ôn tập', path: 'games', color: '#7C3AED' },
  { key: 'listening', icon: Headphones, label: 'Luyện nghe', path: 'listening', color: '#059669' },
  { key: 'reading', icon: BookText, label: 'Luyện đọc', path: 'reading', color: '#0D9488' },
  { key: 'speaking', icon: Mic2, label: 'Luyện nói', path: 'speaking', color: '#EA580C' },
  { key: 'translate', icon: Repeat, label: 'Luyện dịch', path: 'translate', color: '#DB2777' },
  { key: 'writing', icon: PenLine, label: 'Luyện viết', path: 'writing', color: '#9D174D' },
  { key: 'docs', icon: Paperclip, label: 'Tài liệu đính kèm', path: 'docs', color: '#475569', onlyWhenContent: true }
];

const BY_KEY = Object.fromEntries(LESSON_MODULES.map((m) => [m.key, m]));

/**
 * Thứ tự + trạng thái hiện của các phần theo cấu hình của bài (lesson.sections =
 * [{ key, visible }]). Phần mới thêm vào hệ thống sau khi bài đã cấu hình sẽ tự nối vào cuối.
 */
export function resolveSections(sections) {
  const saved = Array.isArray(sections) ? sections.filter((s) => BY_KEY[s.key]) : [];
  const seen = new Set(saved.map((s) => s.key));
  return [
    ...saved.map((s) => ({ ...BY_KEY[s.key], visible: s.visible !== false })),
    ...LESSON_MODULES.filter((m) => !seen.has(m.key)).map((m) => ({ ...m, visible: true }))
  ];
}
