import { useParams } from 'react-router-dom';
import { Hammer } from 'lucide-react';
import TokenSentenceGame from '../../components/TokenSentenceGame';
import PageHeader from '../../components/PageHeader';

export default function BuildSentenceGame() {
  const { lessonId } = useParams();
  return (
    <div>
      <PageHeader icon={Hammer} color="#EA580C" title="Xây câu" backTo={`/lessons/${lessonId}/games`} backLabel="Chọn game khác" />
      <TokenSentenceGame lessonId={lessonId} type="build-sentence" moduleKey="game" title="我 / 是 / 学生 → 我是学生。" />
    </div>
  );
}
