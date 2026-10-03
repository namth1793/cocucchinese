import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Minus, Plus, Trash2, X } from 'lucide-react';
import api from '../../api/client';
import AuthImage from '../../components/AuthImage';
import AudioField from '../../components/AudioField';

const FONT_KEY = 'hsk360_admin_words_font_size';
const COLS_KEY = 'hsk360_admin_words_custom_columns';
const MIN_FONT = 12;
const MAX_FONT = 24;
const DEFAULT_FONT = 15;

function loadFontSize() {
  const n = Number(localStorage.getItem(FONT_KEY));
  return n >= MIN_FONT && n <= MAX_FONT ? n : DEFAULT_FONT;
}

function loadCustomColumns() {
  try {
    const raw = JSON.parse(localStorage.getItem(COLS_KEY) || '[]');
    return Array.isArray(raw) ? raw.filter((c) => c && c.key && c.label) : [];
  } catch (e) {
    return [];
  }
}

function slugify(label, existingKeys) {
  const base = label.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // bỏ dấu tiếng Việt
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'cot';
  let key = base;
  let i = 2;
  while (existingKeys.includes(key)) { key = `${base}_${i}`; i += 1; }
  return key;
}

/** Chuyển bản ghi từ server thành dòng chỉnh sửa cục bộ (tách example lồng nhau thành 3 ô phẳng cho dễ nhập). */
function toRow(word) {
  return {
    id: word.id,
    hanzi: word.hanzi || '',
    pinyin: word.pinyin || '',
    meaningVi: word.meaningVi || '',
    type: word.type || '',
    imageUrl: word.imageUrl || '',
    audioUrl: word.audioUrl || '',
    exampleHanzi: word.example?.hanzi || '',
    examplePinyin: word.example?.pinyin || '',
    exampleVi: word.example?.vi || '',
    extra: word.extra && typeof word.extra === 'object' ? word.extra : {},
    isNew: false
  };
}

function emptyRow() {
  return {
    id: null, hanzi: '', pinyin: '', meaningVi: '', type: '', imageUrl: '', audioUrl: '',
    exampleHanzi: '', examplePinyin: '', exampleVi: '', extra: {}, isNew: true
  };
}

function toPayload(row, lessonId) {
  return {
    lessonId,
    hanzi: row.hanzi.trim(),
    pinyin: row.pinyin.trim(),
    meaningVi: row.meaningVi.trim(),
    type: row.type.trim(),
    imageUrl: row.imageUrl || null,
    audioUrl: row.audioUrl || null,
    example: { hanzi: row.exampleHanzi.trim(), pinyin: row.examplePinyin.trim(), vi: row.exampleVi.trim() },
    extra: row.extra || {}
  };
}

const hasRequired = (row) => row.hanzi.trim() && row.pinyin.trim() && row.meaningVi.trim();

/**
 * Quản lý từ vựng dạng lưới (spreadsheet) - sửa trực tiếp từng ô thay vì mở form riêng
 * cho từng từ, vì giáo viên thường nhập rất nhiều từ liên tiếp cho 1 bài học. Mỗi ô tự
 * lưu khi rời khỏi ô (blur); dòng mới chỉ thực sự tạo trên server khi đã đủ 3 trường bắt
 * buộc (汉字/Pinyin/Nghĩa). Cột tuỳ biến (+ Thêm cột) lưu vào field `extra` của từ - dữ
 * liệu vẫn ở trên server, chỉ riêng DANH SÁCH cột đang hiển thị được nhớ ở máy này
 * (localStorage) vì "words" là kho dữ liệu tự do (JSONB), không có khái niệm cột cố định.
 */
export default function AdminWords({ lessonId }) {
  const [rows, setRows] = useState([]);
  const [customColumns, setCustomColumns] = useState(loadCustomColumns);
  const [fontSize, setFontSize] = useState(loadFontSize);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const savedSnapshots = useRef({}); // id -> JSON string của lần lưu gần nhất, để tránh PUT thừa

  const load = () => {
    setLoading(true);
    api.get('/words', { params: { lessonId } }).then((res) => {
      const loaded = res.data.map(toRow);
      setRows(loaded);
      savedSnapshots.current = Object.fromEntries(loaded.map((r) => [r.id, JSON.stringify(r)]));
    }).finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [lessonId]);

  useEffect(() => { localStorage.setItem(FONT_KEY, String(fontSize)); }, [fontSize]);
  useEffect(() => { localStorage.setItem(COLS_KEY, JSON.stringify(customColumns)); }, [customColumns]);

  const changeFont = (delta) => setFontSize((v) => Math.min(MAX_FONT, Math.max(MIN_FONT, v + delta)));

  const addColumn = () => {
    const label = window.prompt('Tên cột mới (VD: Ghi chú, HSK cấp độ, Bộ thủ...):');
    if (!label || !label.trim()) return;
    const key = slugify(label, customColumns.map((c) => c.key));
    setCustomColumns((cols) => [...cols, { key, label: label.trim() }]);
  };

  const removeColumn = (key) => {
    const col = customColumns.find((c) => c.key === key);
    if (!window.confirm(`Bỏ hiển thị cột "${col?.label}"? Dữ liệu đã nhập ở cột này vẫn được giữ trên hệ thống, chỉ ẩn khỏi bảng - có thể thêm lại cột cùng tên bất cứ lúc nào để xem lại.`)) return;
    setCustomColumns((cols) => cols.filter((c) => c.key !== key));
  };

  const addRow = () => setRows((rs) => [...rs, emptyRow()]);

  const updateRow = (idx, patch) => setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  const updateExtra = (idx, key, value) => setRows((rs) => rs.map((r, i) => (i === idx ? { ...r, extra: { ...r.extra, [key]: value } } : r)));

  const removeRow = async (idx) => {
    const row = rows[idx];
    if (!row.isNew) {
      if (!window.confirm(`Xoá từ "${row.hanzi}"? Hành động không thể hoàn tác.`)) return;
      try {
        await api.delete(`/words/${row.id}`);
        delete savedSnapshots.current[row.id];
      } catch (e) {
        setError(e?.response?.data?.error || 'Xoá thất bại, vui lòng thử lại.');
        return;
      }
    }
    setRows((rs) => rs.filter((_, i) => i !== idx));
  };

  /** Lưu 1 dòng khi rời ô (blur) - tạo mới nếu đủ trường bắt buộc, cập nhật nếu đã có id và có thay đổi thật. */
  const persistRow = async (idx) => {
    const row = rows[idx];
    if (!hasRequired(row)) return; // chưa đủ thông tin tối thiểu, chưa lưu (áp dụng cho cả dòng mới lẫn dòng đang sửa dở)
    setError('');
    try {
      if (row.isNew) {
        const { data } = await api.post('/words', toPayload(row, lessonId));
        const saved = toRow(data);
        savedSnapshots.current[saved.id] = JSON.stringify(saved);
        setRows((rs) => rs.map((r, i) => (i === idx ? saved : r)));
      } else {
        const snapshot = JSON.stringify(row);
        if (savedSnapshots.current[row.id] === snapshot) return; // không đổi gì, khỏi gọi API
        const { data } = await api.put(`/words/${row.id}`, toPayload(row, lessonId));
        const saved = toRow(data);
        savedSnapshots.current[saved.id] = JSON.stringify(saved);
        setRows((rs) => rs.map((r, i) => (i === idx ? saved : r)));
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Lưu thất bại, vui lòng thử lại.');
    }
  };

  const uploadImage = async (idx, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', 'tu-vung');
    try {
      const { data: uploaded } = await api.post('/images', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      // Ảnh cần lưu ngay (không đợi blur ô khác) - lưu trực tiếp thay vì gọi lại persistRow()
      // qua setTimeout, vì setTimeout chạy sau khi component re-render nên đọc closure `rows`
      // cũ (chưa có state mới nhất) - gọi thẳng ở đây đảm bảo dùng đúng dòng vừa cập nhật ảnh.
      const row = { ...rows[idx], imageUrl: uploaded.url };
      updateRow(idx, { imageUrl: uploaded.url });
      if (!row.isNew) {
        const { data: saved } = await api.put(`/words/${row.id}`, toPayload(row, lessonId));
        const savedRow = toRow(saved);
        savedSnapshots.current[savedRow.id] = JSON.stringify(savedRow);
        setRows((rs) => rs.map((r, i) => (i === idx ? savedRow : r)));
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Tải ảnh lên thất bại.');
    }
  };

  /** File nghe lưu ngay khi xác nhận trong AudioField (giống ảnh), không đợi rời ô. */
  const saveAudio = async (idx, url) => {
    const row = { ...rows[idx], audioUrl: url || '' };
    const { data: saved } = await api.put(`/words/${row.id}`, toPayload(row, lessonId));
    const savedRow = toRow(saved);
    savedSnapshots.current[savedRow.id] = JSON.stringify(savedRow);
    setRows((rs) => rs.map((r, i) => (i === idx ? savedRow : r)));
  };

  const thumbSize = useMemo(() => Math.round(Math.min(fontSize * 2.6, 56)), [fontSize]);
  const unsavedCount = rows.filter((r) => r.isNew).length;

  if (loading) return <p className="empty-state">Đang tải danh sách từ vựng...</p>;

  return (
    <div>
      <div className="word-grid-toolbar">
        <h2 style={{ margin: 0 }}>Quản lý từ vựng</h2>
        <div className="word-grid-toolbar-actions">
          <div className="word-grid-font-control" title="Chỉnh cỡ chữ trong bảng">
            <button type="button" onClick={() => changeFont(-1)} disabled={fontSize <= MIN_FONT} aria-label="Giảm cỡ chữ"><Minus size={13} /></button>
            <span>{fontSize}px</span>
            <button type="button" onClick={() => changeFont(1)} disabled={fontSize >= MAX_FONT} aria-label="Tăng cỡ chữ"><Plus size={13} /></button>
          </div>
          <button type="button" className="btn-secondary" onClick={addColumn}>+ Thêm cột</button>
          <button type="button" className="btn-primary" onClick={addRow}>+ Thêm hàng</button>
        </div>
      </div>
      <p className="page-sub" style={{ marginTop: -4 }}>
        Sửa trực tiếp trong bảng, rời khỏi ô (Tab/click ra ngoài) để tự lưu. Cột tuỳ biến và cỡ chữ chỉ ghi nhớ trên máy này.
        {unsavedCount > 0 && <> · <b>{unsavedCount} dòng mới chưa đủ thông tin để lưu</b> (cần điền 汉字, Pinyin, Nghĩa).</>}
      </p>
      {error && <div className="form-error">{error}</div>}

      <div className="word-grid-scroll" style={{ fontSize: `${fontSize}px` }}>
        <table className="word-grid-table">
          <thead>
            <tr>
              <th className="word-grid-col-hanzi">汉字</th>
              <th className="word-grid-col-pinyin">Pinyin</th>
              <th>Nghĩa</th>
              <th>Loại từ</th>
              <th>Ảnh</th>
              <th>File nghe</th>
              <th>VD 汉字</th>
              <th>VD Pinyin</th>
              <th>VD nghĩa</th>
              {customColumns.map((c) => (
                <th key={c.key}>
                  <span className="word-grid-col-label">{c.label}</span>
                  <button type="button" className="word-grid-col-remove" title="Bỏ hiển thị cột này" onClick={() => removeColumn(c.key)}><X size={12} /></button>
                </th>
              ))}
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id ?? `new-${idx}`} className={row.isNew ? 'word-grid-row-new' : undefined}>
                <td className="word-grid-col-hanzi">
                  <input
                    className={`word-grid-input word-grid-hanzi ${!row.hanzi.trim() ? 'invalid' : ''}`}
                    value={row.hanzi} placeholder="你好"
                    onChange={(e) => updateRow(idx, { hanzi: e.target.value })}
                    onBlur={() => persistRow(idx)}
                  />
                </td>
                <td className="word-grid-col-pinyin">
                  <input
                    className={`word-grid-input ${!row.pinyin.trim() ? 'invalid' : ''}`}
                    value={row.pinyin} placeholder="nǐ hǎo"
                    onChange={(e) => updateRow(idx, { pinyin: e.target.value })}
                    onBlur={() => persistRow(idx)}
                  />
                </td>
                <td>
                  <input
                    className={`word-grid-input ${!row.meaningVi.trim() ? 'invalid' : ''}`}
                    value={row.meaningVi} placeholder="Xin chào"
                    onChange={(e) => updateRow(idx, { meaningVi: e.target.value })}
                    onBlur={() => persistRow(idx)}
                  />
                </td>
                <td>
                  <input
                    className="word-grid-input" value={row.type} placeholder="Danh từ..."
                    onChange={(e) => updateRow(idx, { type: e.target.value })}
                    onBlur={() => persistRow(idx)}
                  />
                </td>
                <td>
                  <div className="word-grid-image-cell">
                    {row.imageUrl
                      ? <AuthImage src={row.imageUrl} style={{ width: thumbSize, height: thumbSize, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                      : <span className="word-grid-image-placeholder" style={{ width: thumbSize, height: thumbSize }} />}
                    <label className={`word-grid-upload-btn ${row.isNew ? 'disabled' : ''}`} title={row.isNew ? 'Điền 汉字/Pinyin/Nghĩa trước rồi mới tải ảnh được' : 'Tải ảnh lên'}>
                      <ImagePlus size={14} />
                      <input type="file" accept="image/*" hidden disabled={row.isNew} onChange={(e) => uploadImage(idx, e.target.files[0])} />
                    </label>
                  </div>
                </td>
                <td className="word-grid-audio-cell">
                  {row.isNew
                    ? <span className="audio-field-empty" title="Điền 汉字/Pinyin/Nghĩa trước rồi mới tải file nghe được">—</span>
                    : <AudioField compact value={row.audioUrl} onChange={(url) => saveAudio(idx, url)} />}
                </td>
                <td>
                  <input
                    className="word-grid-input word-grid-hanzi" value={row.exampleHanzi} placeholder="你好！"
                    onChange={(e) => updateRow(idx, { exampleHanzi: e.target.value })}
                    onBlur={() => persistRow(idx)}
                  />
                </td>
                <td>
                  <input
                    className="word-grid-input" value={row.examplePinyin} placeholder="nǐ hǎo!"
                    onChange={(e) => updateRow(idx, { examplePinyin: e.target.value })}
                    onBlur={() => persistRow(idx)}
                  />
                </td>
                <td>
                  <input
                    className="word-grid-input" value={row.exampleVi} placeholder="Xin chào!"
                    onChange={(e) => updateRow(idx, { exampleVi: e.target.value })}
                    onBlur={() => persistRow(idx)}
                  />
                </td>
                {customColumns.map((c) => (
                  <td key={c.key}>
                    <input
                      className="word-grid-input" value={row.extra?.[c.key] || ''}
                      onChange={(e) => updateExtra(idx, c.key, e.target.value)}
                      onBlur={() => persistRow(idx)}
                    />
                  </td>
                ))}
                <td>
                  <button type="button" className="word-grid-row-delete" title="Xoá dòng" onClick={() => removeRow(idx)}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && <p className="empty-state">Chưa có từ vựng nào. Bấm "+ Thêm hàng" để bắt đầu nhập.</p>}
    </div>
  );
}
