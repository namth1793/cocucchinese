import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Trophy, RotateCcw, BookOpen, GraduationCap, Headphones,
  BookText, Repeat, Mic2, Presentation, Gamepad2, CheckCircle2
} from 'lucide-react';
import api from '../api/client';
import PageHeader from '../components/PageHeader';

const MODULE_META = {
  vocab: { label: 'Từ vựng', icon: BookOpen, color: '#DC2626' },
  grammar: { label: 'Ngữ pháp', icon: GraduationCap, color: '#2563EB' },
  listening: { label: 'Nghe', icon: Headphones, color: '#059669' },
  reading: { label: 'Đọc', icon: BookText, color: '#0D9488' },
  translate: { label: 'Dịch', icon: Repeat, color: '#DB2777' },
  shadowing: { label: 'Shadowing', icon: Mic2, color: '#EA580C' },
  ppt: { label: 'PPT / Bài giảng', icon: Presentation, color: '#B91C1C' },
  game: { label: 'Game ôn tập', icon: Gamepad2, color: '#7C3AED' }
};

export default function LessonResult() {
  const { lessonId } = useParams();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get(`/progress/${lessonId}/summary`).then((res) => setSummary(res.data));
  }, [lessonId]);

  if (!summary) return <p className="empty-state">Đang tải...</p>;

  const entries = Object.entries(summary.scores);

  return (
    <div>
      <PageHeader icon={Trophy} color="#D97706" title="Kết quả cuối bài" backTo={`/lessons/${lessonId}`} />

      <div className="card" style={{ textAlign: 'center' }}>
        <div className="result-ring" style={{ '--pct': summary.overallPercent }}>
          <span className="result-ring-value">{summary.overallPercent}%</span>
        </div>
        <p style={{ color: 'var(--ink-soft)', fontSize: 14 }}>
          {summary.overallPercent >= 80 ? 'Xuất sắc! Bạn đã nắm chắc bài học này.' : summary.overallPercent >= 50 ? 'Khá tốt — ôn thêm để nắm chắc hơn nhé.' : 'Hãy hoàn thành thêm các phần luyện tập của bài học.'}
        </p>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: 4 }}>Chi tiết theo từng phần</h3>
        {entries.length === 0 && <p className="empty-state">Chưa có dữ liệu — hãy hoàn thành các phần luyện tập của bài học.</p>}
        {entries.map(([key, val]) => {
          const meta = MODULE_META[key] || { label: key, icon: BookOpen, color: 'var(--primary)' };
          const Icon = meta.icon;
          const isBinary = key === 'shadowing' || key === 'ppt';
          return (
            <div className="result-row" key={key}>
              <span className="result-row-icon" style={{ background: meta.color }}><Icon size={16} /></span>
              <span className="result-row-label">{meta.label}</span>
              {isBinary ? (
                <span className={`result-row-value ${val === 100 ? 'ok' : ''}`}>
                  {val === 100 ? <><CheckCircle2 size={14} style={{ verticalAlign: -2, marginRight: 3 }} />Đã hoàn thành</> : 'Chưa hoàn thành'}
                </span>
              ) : (
                <>
                  <span className="result-row-track">
                    <span className="result-row-fill" style={{ width: `${val ?? 0}%`, background: meta.color }} />
                  </span>
                  <span className="result-row-value">{val === null ? '—' : `${val}%`}</span>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="result-stats">
        <div className="result-stat">
          <div className="result-stat-num">{summary.wrongWordsCount}</div>
          <div className="result-stat-label">Từ cần ôn lại</div>
        </div>
        <div className="result-stat">
          <div className="result-stat-num">{summary.wrongSentencesCount}</div>
          <div className="result-stat-label">Câu cần ôn lại</div>
        </div>
      </div>

      <Link to="/review" className="btn-primary btn-block" style={{ display: 'flex', marginTop: 16 }}>
        <RotateCcw size={17} />
        Đi tới Ôn tập
      </Link>
    </div>
  );
}
