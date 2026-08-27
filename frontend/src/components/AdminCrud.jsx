import { useEffect, useState } from 'react';
import api from '../api/client';

function parseValue(fld, raw) {
  if (fld.type === 'json') return raw ? JSON.parse(raw) : (fld.default ?? null);
  if (fld.type === 'number') return raw === '' ? null : Number(raw);
  if (fld.type === 'boolean') return raw === 'true';
  return raw;
}

function toFormValue(fld, val) {
  if (fld.type === 'json') return JSON.stringify(val ?? fld.default ?? null, null, 2);
  if (fld.type === 'boolean') return String(!!val);
  if (val === undefined || val === null) return '';
  return val;
}

/**
 * Form/bảng CRUD dùng chung cho toàn bộ CMS quản trị (bài học, từ vựng, ngữ pháp,
 * câu, bài hát, video...) - tránh viết trang riêng cho từng loại nội dung.
 */
export default function AdminCrud({ title, endpoint, fields, filterKey, filterOptions, filterValue, onFilterChange, listColumns, hint, fixedValues, renderRowExtra }) {
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  const load = () => {
    const params = { ...(filterKey && filterValue ? { [filterKey]: filterValue } : {}), ...(fixedValues || {}) };
    api.get(endpoint, { params }).then((res) => setItems(res.data));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [filterValue, JSON.stringify(fixedValues || {})]);

  const emptyForm = () => {
    const f = {};
    fields.forEach((fld) => { f[fld.name] = toFormValue(fld, fld.type === 'boolean' ? false : ''); });
    if (filterKey) f[filterKey] = filterValue || '';
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
              {fld.type === 'select' || fld.type === 'boolean' ? (
                <select value={form[fld.name] ?? ''} onChange={(e) => setForm({ ...form, [fld.name]: e.target.value })} required={fld.required}>
                  <option value="">-- Chọn --</option>
                  {(fld.type === 'boolean' ? [{ value: 'true', label: 'Có' }, { value: 'false', label: 'Không' }] : fld.options).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              ) : fld.type === 'textarea' || fld.type === 'json' ? (
                <textarea
                  rows={fld.type === 'json' ? 6 : 3}
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
              {listColumns.map((c) => <th key={c.key}>{c.label}</th>)}
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
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
