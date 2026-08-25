import AdminCrud from '../../components/AdminCrud';

const FIELDS = [
  { name: 'code', label: 'Mã cấp độ (VD: HSK1, YCT2)', required: true },
  { name: 'name', label: 'Tên hiển thị', required: true },
  { name: 'type', label: 'Loại', type: 'select', options: [{ value: 'HSK', label: 'HSK' }, { value: 'YCT', label: 'YCT' }], required: true },
  { name: 'order', label: 'Thứ tự', type: 'number' }
];

const COLUMNS = [
  { key: 'code', label: 'Mã' },
  { key: 'name', label: 'Tên' },
  { key: 'type', label: 'Loại' },
  { key: 'order', label: 'TT' }
];

export default function AdminLevels() {
  return <AdminCrud title="Quản lý cấp độ HSK/YCT" endpoint="/levels" fields={FIELDS} listColumns={COLUMNS} />;
}
