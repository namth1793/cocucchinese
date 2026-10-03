import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

/**
 * Bảng nhập nhiều dòng (vd. các câu thoại của bài khoá) thay cho gõ JSON mảng.
 * columns: [{ key, label, cn?: true (ô chữ Hán), wide?: true }]
 */
export default function RowsEditor({ value, onChange, columns, addLabel = 'Thêm dòng' }) {
  const rows = Array.isArray(value) ? value : [];
  const update = (i, key, v) => onChange(rows.map((r, idx) => (idx === i ? { ...r, [key]: v } : r)));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => onChange([...rows, Object.fromEntries(columns.map((c) => [c.key, '']))]);

  return (
    <div className="rows-editor">
      {rows.map((row, i) => (
        <div key={i} className="rows-editor-row">
          <span className="rows-editor-num">{i + 1}</span>
          <div className="rows-editor-cells">
            {columns.map((c) => (
              <input
                key={c.key}
                className={`${c.cn ? 'word-grid-hanzi' : ''} ${c.wide ? 'wide' : ''}`}
                value={row[c.key] || ''}
                placeholder={c.label}
                title={c.label}
                onChange={(e) => update(i, c.key, e.target.value)}
              />
            ))}
          </div>
          <span className="q-editor-tools">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} title="Lên"><ArrowUp size={14} /></button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === rows.length - 1} title="Xuống"><ArrowDown size={14} /></button>
            <button type="button" className="danger" onClick={() => onChange(rows.filter((_, idx) => idx !== i))} title="Xoá dòng"><Trash2 size={14} /></button>
          </span>
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={add}><Plus size={14} /> {addLabel}</button>
    </div>
  );
}
