/** Loại bài trong courseTests (khớp backend/src/utils/testKinds.js) và tab tương ứng ở trang khoá học. */
export const TEST_KINDS = [
  { value: 'test', label: 'Bài kiểm tra', tab: 'bai-kiem-tra' },
  { value: 'sample', label: 'Đề thi mẫu', tab: 'de-thi-mau' },
  { value: 'real', label: 'Đề thi thật', tab: 'de-thi-that' }
];
export const testKindOf = (value) => TEST_KINDS.find((k) => k.value === value) || TEST_KINDS[0];
