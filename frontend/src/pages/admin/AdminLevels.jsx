import AdminCrud from '../../components/AdminCrud';
import { LEVEL_TYPE_OPTIONS, placementLabel } from '../../constants/courseCategories';

const FIELDS = [
  { name: 'code', label: 'Mã cấp độ (VD: HSK1, CONVO-BASIC)', required: true },
  { name: 'name', label: 'Tên hiển thị', required: true },
  {
    name: 'type', label: 'Loại', type: 'select', options: LEVEL_TYPE_OPTIONS, required: true,
    hint: 'Sidebar sẽ tự sắp xếp cấp độ vào đúng mục/nhóm con dựa theo Loại đã chọn.'
  },
  { name: 'order', label: 'Thứ tự trong nhóm', type: 'number' }
];

const COLUMNS = [
  { key: 'code', label: 'Mã' },
  { key: 'name', label: 'Tên' },
  { key: 'type', label: 'Loại' },
  { key: 'placement', label: 'Vị trí ở sidebar', render: (item) => placementLabel(item) },
  { key: 'order', label: 'TT' }
];

export default function AdminLevels() {
  return <AdminCrud title="Quản lý cấp độ / khoá học" endpoint="/levels" fields={FIELDS} listColumns={COLUMNS} />;
}
