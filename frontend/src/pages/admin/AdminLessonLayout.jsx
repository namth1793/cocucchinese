import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Eye, EyeOff } from 'lucide-react';
import api from '../../api/client';
import { resolveSections } from '../../constants/lessonModules';

/**
 * Thông tin chung + bố cục 1 bài học: tên, mô tả, nội dung giới thiệu (hiện đầu trang bài học),
 * thứ tự và ẩn/hiện từng phần (Từ vựng, Ngữ pháp, Luyện nghe...). Lưu vào bản ghi lesson.
 */
export default function AdminLessonLayout({ lessonId, onSaved }) {
  const [form, setForm] = useState(null);
  const [sections, setSections] = useState([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/lessons/${lessonId}`).then((res) => {
      const l = res.data;
      setForm({ title: l.title || '', description: l.description || '', content: l.content || '', order: l.order ?? 1, published: l.published !== false });
      setSections(resolveSections(l.sections));
    });
  }, [lessonId]);

  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= sections.length) return;
    const next = [...sections];
    [next[i], next[j]] = [next[j], next[i]];
    setSections(next);
  };
  const toggle = (i) => setSections((s) => s.map((x, idx) => (idx === i ? { ...x, visible: !x.visible } : x)));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.put(`/lessons/${lessonId}`, {
        ...form,
        title: form.title.trim(),
        order: Number(form.order) || 1,
        sections: sections.map((s) => ({ key: s.key, visible: s.visible }))
      });
      setMessage('Đã lưu - trang bài học của học viên đã được cập nhật.');
      if (onSaved) onSaved(data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Lưu thất bại, vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <p className="empty-state">Đang tải...</p>;

  return (
    <form onSubmit={save} className="lesson-layout-grid">
      <div className="admin-form" style={{ maxWidth: 'none' }}>
        <h3 style={{ marginTop: 0 }}>Thông tin bài học</h3>
        <div className="form-field">
          <label>Tên bài học</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>
        <div className="form-field">
          <label>Thứ tự bài trong khoá</label>
          <input type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} />
        </div>
        <div className="form-field">
          <label>Mô tả ngắn (hiện ở lộ trình khoá học)</label>
          <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="form-field">
          <label>Nội dung / giới thiệu bài học (hiện ở đầu trang bài, giữ nguyên xuống dòng)</label>
          <textarea rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="VD: Mục tiêu bài học, kiến thức trọng tâm, hướng dẫn học..." />
        </div>
        <label className="check-label">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Xuất bản bài học
        </label>
      </div>

      <div className="admin-form" style={{ maxWidth: 'none' }}>
        <h3 style={{ marginTop: 0 }}>Thứ tự các phần trong bài</h3>
        <p className="page-sub" style={{ marginTop: -4 }}>Dùng mũi tên để sắp xếp, con mắt để ẩn/hiện phần đó với học viên. "Bài học tương tác" và "Tài liệu" chỉ hiện khi bài có nội dung tương ứng.</p>
        <ol className="section-order-list">
          {sections.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.key} className={s.visible ? '' : 'is-hidden'}>
                <span className="section-order-icon" style={{ background: s.color }}><Icon size={15} /></span>
                <span className="section-order-label">{s.label}</span>
                <span className="q-editor-tools">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Lên"><ArrowUp size={14} /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === sections.length - 1} title="Xuống"><ArrowDown size={14} /></button>
                  <button type="button" onClick={() => toggle(i)} title={s.visible ? 'Ẩn phần này' : 'Hiện phần này'}>
                    {s.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="lesson-layout-actions">
        {error && <div className="form-error">{error}</div>}
        {message && <span className="save-ok"><Check size={15} /> {message}</span>}
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
      </div>
    </form>
  );
}
