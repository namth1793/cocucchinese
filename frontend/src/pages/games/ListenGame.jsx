import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Volume2 } from 'lucide-react';
import api from '../../api/client';
import ExerciseRunner from '../../components/ExerciseRunner';
import PageHeader from '../../components/PageHeader';

export default function ListenGame() {
  const { lessonId } = useParams();
  const [items, setItems] = useState(null);

  useEffect(() => {
    api.get(`/exercises/${lessonId}/listen-choose`, { params: { count: 8 } }).then((res) => {
      setItems(res.data.items.map((it) => ({ ...it, promptType: 'listen', reviewId: it.id })));
    });
  }, [lessonId]);

  return (
    <div>
      <PageHeader icon={Volume2} color="#059669" title="Tìm đáp án đúng" backTo={`/lessons/${lessonId}/games`} backLabel="Chọn game khác" />
      {items ? (
        <ExerciseRunner items={items} lessonId={lessonId} moduleKey="game" itemType="word" title="Nghe rồi chọn chữ Hán đúng" />
      ) : <p className="empty-state">Đang tải...</p>}
    </div>
  );
}
