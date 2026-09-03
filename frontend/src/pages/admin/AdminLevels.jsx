import AdminCrud from '../../components/AdminCrud';

const CATEGORY_OPTIONS = [
  { value: 'hsk_hskk', label: 'HSK & HSKK' },
  { value: 'kids', label: 'Tiếng Trung trẻ em' },
  { value: 'conversation', label: 'Tiếng Trung giao tiếp' }
];

const GROUP_OPTIONS = [
  { value: '', label: '-- Không có nhóm con --' },
  { value: 'HSK 3.0', label: 'HSK 3.0 (chỉ dùng trong danh mục HSK & HSKK)' },
  { value: 'HSKK', label: 'HSKK (chỉ dùng trong danh mục HSK & HSKK)' }
];

const CATEGORY_LABEL = Object.fromEntries(CATEGORY_OPTIONS.map((o) => [o.value, o.label]));

const FIELDS = [
  { name: 'code', label: 'Mã cấp độ (VD: HSK1, CONVO-BASIC)', required: true },
  { name: 'name', label: 'Tên hiển thị', required: true },
  { name: 'type', label: 'Loại (VD: HSK, HSKK, YCT, KIDS, CONVO...)', required: true },
  { name: 'category', label: 'Danh mục ở sidebar', type: 'select', options: CATEGORY_OPTIONS, required: true },
  {
    name: 'group', label: 'Nhóm con', type: 'select', options: GROUP_OPTIONS,
    hint: 'Chỉ danh mục "HSK & HSKK" có 2 nhóm con (HSK 3.0 / HSKK); các danh mục khác để trống.'
  },
  { name: 'order', label: 'Thứ tự trong nhóm', type: 'number' }
];

const COLUMNS = [
  { key: 'code', label: 'Mã' },
  { key: 'name', label: 'Tên' },
  { key: 'category', label: 'Danh mục', render: (item) => CATEGORY_LABEL[item.category] || '—' },
  { key: 'group', label: 'Nhóm con', render: (item) => item.group || '—' },
  { key: 'order', label: 'TT' }
];

export default function AdminLevels() {
  return <AdminCrud title="Quản lý cấp độ / khoá học" endpoint="/levels" fields={FIELDS} listColumns={COLUMNS} />;
}
