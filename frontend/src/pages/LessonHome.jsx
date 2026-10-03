import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Trophy } from 'lucide-react';
import api from '../api/client';
import ProgressBar from '../components/ProgressBar';
import { resolveSections } from '../constants/lessonModules';

export default function LessonHome() {
  const { lessonId } = useParams();
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get(`/lessons/${lessonId}/full`).then((res) => setData(res.data));
    api.get(`/progress/${lessonId}/summary`).then((res) => setSummary(res.data));
  }, [lessonId]);

  const lesson = data?.lesson;
  // "html"/"docs" chỉ hiện khi bài thực sự có nội dung tương ứng; thứ tự + ẩn/hiện theo cấu hình admin.
  const counts = { html: data?.htmlPages?.length || 0, docs: data?.documents?.length || 0 };
  const modules = data
    ? resolveSections(lesson.sections).filter((m) => m.visible && (!m.onlyWhenContent || counts[m.key] > 0))
    : [];
  const htmlTarget = counts.html === 1 ? `html/${data.htmlPages[0].id}` : 'html';

  return (
    <div>
      <Link to={lesson ? `/levels/${lesson.levelId}` : '/'} className="top-back-link">← Danh sách bài học</Link>
      <h1 className="page-title">{lesson ? lesson.title : '...'}</h1>
      {summary && <ProgressBar percent={summary.overallPercent} label="Tiến độ tổng" />}

      {lesson?.content && <div className="card lesson-intro">{lesson.content}</div>}

      <div className="module-list" style={{ marginTop: 18 }}>
        {modules.map((m) => {
          const Icon = m.icon;
          const path = m.key === 'html' ? htmlTarget : m.path;
          return (
            <Link to={`/lessons/${lessonId}/${path}`} key={m.key} className="module-row">
              <span className="module-row-icon" style={{ background: m.color }}><Icon size={20} /></span>
              <span className="module-row-body">
                <span className="module-row-label">{m.label}</span>
                {counts[m.key] > 1 && <span className="module-row-sub">{counts[m.key]} mục</span>}
              </span>
              <ChevronRight size={18} className="module-row-chevron" />
            </Link>
          );
        })}
      </div>

      <Link to={`/lessons/${lessonId}/result`} className="btn-primary btn-block" style={{ display: 'flex', textAlign: 'center', marginTop: 18 }}>
        <Trophy size={17} />
        Xem kết quả cuối bài
      </Link>
    </div>
  );
}
