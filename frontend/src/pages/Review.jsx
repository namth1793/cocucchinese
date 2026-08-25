import { useEffect, useState } from 'react';
import { RotateCcw, Check } from 'lucide-react';
import api from '../api/client';
import Hanzi from '../components/Hanzi';
import AuthImage from '../components/AuthImage';
import PageHeader from '../components/PageHeader';

export default function Review() {
  const [data, setData] = useState({ words: [], sentences: [] });
  const [tab, setTab] = useState('words');

  const load = () => api.get('/progress/review/all').then((res) => setData(res.data));

  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    await api.delete(`/progress/review/${id}`);
    load();
  };

  return (
    <div>
      <PageHeader icon={RotateCcw} color="#DC2626" title="Ôn tập lại" subtitle="Các từ/câu bạn đã làm sai được tự động lưu tại đây để ôn tập" />

      <div className="tabs">
        <button type="button" className={`tab-btn ${tab === 'words' ? 'active' : ''}`} onClick={() => setTab('words')}>Từ ({data.words.length})</button>
        <button type="button" className={`tab-btn ${tab === 'sentences' ? 'active' : ''}`} onClick={() => setTab('sentences')}>Câu ({data.sentences.length})</button>
      </div>

      {tab === 'words' && (
        data.words.length === 0 ? <p className="empty-state">Không có từ nào cần ôn tập. Tuyệt vời!</p> : (
          <div className="word-grid">
            {data.words.map((w) => (
              <div key={w.id} className="card word-card">
                {w.imageUrl && <AuthImage className="word-card-img" src={w.imageUrl} alt={w.meaningVi} />}
                <div className="word-card-body">
                  <Hanzi hanzi={w.hanzi} pinyin={w.pinyin} meaning={w.meaningVi} />
                </div>
                <button type="button" className="btn-secondary" onClick={() => remove(w.id)}><Check size={14} /> Đã thuộc</button>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'sentences' && (
        data.sentences.length === 0 ? <p className="empty-state">Không có câu nào cần ôn tập. Tuyệt vời!</p> : (
          <div className="word-grid">
            {data.sentences.map((s) => (
              <div key={s.id} className="card">
                <Hanzi hanzi={s.hanzi} pinyin={s.pinyin} meaning={s.vi} />
                <button type="button" className="btn-secondary" style={{ marginTop: 10 }} onClick={() => remove(s.id)}><Check size={14} /> Đã thuộc</button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
