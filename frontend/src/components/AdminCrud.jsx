import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import api from '../api/client';
import AudioField from './AudioField';
import QuestionsEditor from './QuestionsEditor';
import RowsEditor from './RowsEditor';

// Kiểu trường giữ nguyên giá trị gốc (không chuyển qua chuỗi) trong state của form.
const RAW_TYPES = ['audio', 'questions', 'example', 'rows'];
const EXAMPLE_KEYS = [['hanzi', '汉字 (câu ví dụ)'], ['pinyin', 'Pinyin'], ['vi', 'Nghĩa tiếng Việt']];
const exampleKeys = (fld) => fld.keys || EXAMPLE_KEYS;
const emptyObject = (fld) => Object.fromEntries(exampleKeys(fld).map(([k]) => [k, '']));

function parseValue(fld, raw) {
  if (fld.type === 'audio') return raw || null;
  if (fld.type === 'questions') return Array.isArray(raw) ? raw : [];
  if (fld.type === 'rows') return (Array.isArray(raw) ? raw : []).filter((r) => Object.values(r).some((v) => String(v || '').trim()));
  if (fld.type === 'example') {
    const obj = { ...emptyObject(fld), ...(raw || {}) };
    // Trường không bắt buộc (vd. chú thích bài khoá) để trống hết thì lưu null như trước.
    return fld.nullable && !Object.values(obj).some((v) => String(v || '').trim()) ? null : obj;
  }
  if (fld.type === 'list') return String(raw || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
  if (fld.type === 'json') return raw ? JSON.parse(raw) : (fld.default ?? null);
  if (fld.type === 'number') return raw === '' ? null : Number(raw);
  if (fld.type === 'boolean') return raw === 'true';
  return raw;
}

function toFormValue(fld, val) {
  if (RAW_TYPES.includes(fld.type)) {
    if (fld.type === 'questions' || fld.type === 'rows') return Array.isArray(val) ? val : [];
    if (fld.type === 'example') return { ...emptyObject(fld), ...(val && typeof val === 'object' ? val : {}) };
    return val || null;
  }
  if (fld.type === 'list') return Array.isArray(val) ? val.join('\n') : (val || '');
  if (fld.type === 'json') return JSON.stringify(val ?? fld.default ?? null, null, 2);
  if (fld.type === 'boolean') return String(!!val);
  if (val === undefined || val === null) return '';
  return val;
}

/** Kiểm tra câu hỏi trắc nghiệm trước khi lưu - trả về thông báo lỗi hoặc ''. */
function validateQuestions(fld, list) {
  const key = fld.questionKey || 'q';
  for (let i = 0; i < list.length; i += 1) {
    const q = list[i];
    if (!String(q[key] || '').trim()) return `${fld.label}: câu ${i + 1} chưa có nội dung câu hỏi.`;
    if ((q.options || []).filter((o) => String(o).trim()).length < 2) return `${fld.label}: câu ${i + 1} cần ít nhất 2 đáp án.`;
    if (!String((q.options || [])[q.answerIndex ?? 0] || '').trim()) return `${fld.label}: câu ${i + 1} - đáp án đúng đang để trống.`;
  }
  return '';
}

/**
 * Form/bảng CRUD dùng chung cho toàn bộ CMS quản trị (bài học, từ vựng, ngữ pháp,
 * câu, bài hát, video...) - tránh viết trang riêng cho từng loại nội dung.
 */
export default function AdminCrud({ title, endpoint, fields, filterKey, filterOptions, filterValue, onFilterChange, listColumns, hint, fixedValues, renderRowExtra, reloadToken, sortable = false }) {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  const load = () => {
    const params = { ...(filterKey && filterValue ? { [filterKey]: filterValue } : {}), ...(fixedValues || {}) };
    api.get(endpoint, { params }).then((res) => setItems(
      sortable ? [...res.data].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)) : res.data
    ));
  };

  // Đổi chỗ với mục liền kề rồi đánh số lại 1..n, chỉ gửi những mục thực sự đổi thứ tự.
  const move = async (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[index], next[j]] = [next[j], next[index]];
    const changed = next.map((it, i) => ({ it, order: i + 1 })).filter(({ it, order }) => Number(it.order) !== order);
    setItems(next.map((it, i) => ({ ...it, order: i + 1 })));
    await Promise.all(changed.map(({ it, order }) => api.put(`${endpoint}/${it.id}`, { order })));
    load();
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [filterValue, JSON.stringify(fixedValues || {}), reloadToken]);

  const emptyForm = () => {
    const f = {};
    fields.forEach((fld) => { f[fld.name] = toFormValue(fld, fld.type === 'boolean' ? false : (RAW_TYPES.includes(fld.type) ? null : '')); });
    if (filterKey) f[filterKey] = filterValue || '';
    if (sortable && fields.some((fld) => fld.name === 'order')) f.order = String(items.length + 1);
    return f;
  };

  const startNew = () => { setEditingId('new'); setForm(emptyForm()); setError(''); };

  const startEdit = (item) => {
    const f = {};
    fields.forEach((fld) => { f[fld.name] = toFormValue(fld, item[fld.name]); });
    setEditingId(item.id);
    setForm(f);
    setError('');
  };

  const cancel = () => { setEditingId(null); setForm({}); setError(''); };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    let payload;
    try {
      payload = { ...(fixedValues || {}) };
      fields.forEach((fld) => { payload[fld.name] = parseValue(fld, form[fld.name]); });
    } catch (e2) {
      setError('Định dạng JSON không hợp lệ ở một trong các trường (kiểm tra dấu ngoặc, dấu phẩy).');
      return;
    }
    for (const fld of fields) {
      if (fld.type === 'questions') {
        const msg = validateQuestions(fld, payload[fld.name]);
        if (msg) { setError(msg); return; }
      }
    }
    try {
      if (editingId === 'new') await api.post(endpoint, payload);
      else await api.put(`${endpoint}/${editingId}`, payload);
      cancel();
      load();
    } catch (e3) {
      setError(e3?.response?.data?.error || 'Có lỗi xảy ra, vui lòng thử lại.');
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Xoá mục này? Hành động không thể hoàn tác.')) return;
    await api.delete(`${endpoint}/${id}`);
    load();
  };

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {hint && <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: -6 }}>{hint}</p>}

      {filterOptions && (
        <div className="form-field">
          <label>Lọc theo bài học</label>
          <select value={filterValue || ''} onChange={(e) => onFilterChange(e.target.value)}>
            <option value="">-- Tất cả --</option>
            {filterOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      )}

      {editingId ? (
        <form className="admin-form" onSubmit={submit}>
          {error && <div className="form-error">{error}</div>}
          {fields.map((fld) => (
            <div className="form-field" key={fld.name}>
              <label>{fld.label}</label>
              {fld.type === 'audio' ? (
                <AudioField value={form[fld.name]} onChange={(url) => setForm((f) => ({ ...f, [fld.name]: url }))} />
              ) : fld.type === 'questions' ? (
                <QuestionsEditor
                  value={form[fld.name]}
                  questionKey={fld.questionKey}
                  extra={fld.questionExtra}
                  onChange={(list) => setForm((f) => ({ ...f, [fld.name]: list }))}
                />
              ) : fld.type === 'rows' ? (
                <RowsEditor
                  value={form[fld.name]}
                  columns={fld.columns}
                  addLabel={fld.addLabel}
                  onChange={(list) => setForm((f) => ({ ...f, [fld.name]: list }))}
                />
              ) : fld.type === 'example' ? (
                <div className="example-fields">
                  {exampleKeys(fld).map(([k, ph]) => (
                    <input
                      key={k}
                      className={k === 'hanzi' ? 'word-grid-hanzi' : ''}
                      value={form[fld.name]?.[k] || ''}
                      placeholder={ph}
                      onChange={(e) => setForm((f) => ({ ...f, [fld.name]: { ...f[fld.name], [k]: e.target.value } }))}
                    />
                  ))}
                </div>
              ) : fld.type === 'select' || fld.type === 'boolean' ? (
                <select value={form[fld.name] ?? ''} onChange={(e) => setForm({ ...form, [fld.name]: e.target.value })} required={fld.required}>
                  <option value="">-- Chọn --</option>
                  {(fld.type === 'boolean' ? [{ value: 'true', label: 'Có' }, { value: 'false', label: 'Không' }] : fld.options).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : fld.type === 'textarea' || fld.type === 'json' || fld.type === 'list' ? (
                <textarea
                  rows={fld.type === 'json' ? 6 : fld.rows || 3}
                  value={form[fld.name] ?? ''}
                  onChange={(e) => setForm({ ...form, [fld.name]: e.target.value })}
                  required={fld.required}
                />
              ) : (
                <input
                  type={fld.type === 'number' ? 'number' : 'text'}
                  value={form[fld.name] ?? ''}
                  onChange={(e) => setForm({ ...form, [fld.name]: e.target.value })}
                  required={fld.required}
                />
              )}
              {fld.hint && <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fld.hint}</span>}
            </div>
          ))}
          <div className="admin-actions">
            <button type="submit" className="btn-primary">{editingId === 'new' ? 'Tạo mới' : 'Lưu thay đổi'}</button>
            <button type="button" className="btn-secondary" onClick={cancel}>Huỷ</button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn-primary" onClick={startNew} style={{ marginBottom: 12 }}>+ Thêm mới</button>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              {sortable && <th>Thứ tự</th>}
              {listColumns.map((c) => <th key={c.key}>{c.label}</th>)}
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id}>
                {sortable && (
                  <td className="sort-cell">
                    <button type="button" onClick={() => move(index, -1)} disabled={index === 0} title="Đưa lên"><ArrowUp size={14} /></button>
                    <button type="button" onClick={() => move(index, 1)} disabled={index === items.length - 1} title="Đưa xuống"><ArrowDown size={14} /></button>
                  </td>
                )}
                {listColumns.map((c) => <td key={c.key}>{c.render ? c.render(item) : String(item[c.key] ?? '')}</td>)}
                <td className="admin-actions">
                  {renderRowExtra && renderRowExtra(item)}
                  <button type="button" className="btn-secondary" onClick={() => startEdit(item)}>Sửa</button>
                  <button type="button" className="btn-danger" onClick={() => remove(item.id)}>Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 && <p className="empty-state">Chưa có dữ liệu.</p>}
    </div>
  );
}
