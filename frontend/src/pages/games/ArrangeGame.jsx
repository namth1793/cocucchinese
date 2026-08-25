import { useParams } from 'react-router-dom';
import { Puzzle } from 'lucide-react';
import TokenSentenceGame from '../../components/TokenSentenceGame';
import PageHeader from '../../components/PageHeader';

export default function ArrangeGame() {
  const { lessonId } = useParams();
  return (
    <div>
      <PageHeader icon={Puzzle} color="#2563EB" title="Sắp xếp câu" backTo={`/lessons/${lessonId}/games`} backLabel="Chọn game khác" />
      <TokenSentenceGame lessonId={lessonId} type="arrange" moduleKey="game" title="好 / 你 → 你好" />
    </div>
  );
}
