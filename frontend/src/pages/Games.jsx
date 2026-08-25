import { Link, useParams } from 'react-router-dom';
import { Link2, Puzzle, Zap, Volume2, LayoutGrid, Hammer, Gamepad2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const GAMES = [
  { path: 'match', icon: Link2, label: 'Ghép đôi', desc: '你好 ↔ Xin chào', color: '#DC2626' },
  { path: 'arrange', icon: Puzzle, label: 'Sắp xếp câu', desc: '好 / 你 → 你好', color: '#2563EB' },
  { path: 'quiz', icon: Zap, label: 'Chọn nhanh', desc: 'Trả lời có giới hạn thời gian', color: '#D97706' },
  { path: 'listen', icon: Volume2, label: 'Tìm đáp án đúng', desc: 'Nghe audio → chọn chữ Hán', color: '#059669' },
  { path: 'memory', icon: LayoutGrid, label: 'Memory', desc: 'Lật thẻ tìm cặp 汉字 ↔ Nghĩa', color: '#7C3AED' },
  { path: 'build', icon: Hammer, label: 'Xây câu', desc: '我 / 是 / 学生 → 我是学生。', color: '#EA580C' }
];

export default function Games() {
  const { lessonId } = useParams();
  return (
    <div>
      <PageHeader icon={Gamepad2} color="#7C3AED" title="Game ôn tập" subtitle="Chọn một trò chơi để ôn lại bài học" backTo={`/lessons/${lessonId}`} />
      <div className="module-grid">
        {GAMES.map((g) => {
          const Icon = g.icon;
          return (
            <Link to={`/lessons/${lessonId}/games/${g.path}`} key={g.path} className="module-card">
              <span className="module-card-icon" style={{ background: g.color }}><Icon size={21} /></span>
              <span>{g.label}</span>
              <span className="level-card-sub" style={{ fontWeight: 500, textTransform: 'none' }}>{g.desc}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
