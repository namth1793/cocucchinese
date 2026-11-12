/** Loại bài trong courseTests: bài kiểm tra (mặc định), đề thi mẫu, đề thi thật - mỗi loại là 1 mục riêng trong trang khoá học. */
const TEST_KINDS = ['test', 'sample', 'real'];
const testKind = (t) => (TEST_KINDS.includes(t.kind) ? t.kind : 'test');
const cleanKind = (kind) => (TEST_KINDS.includes(kind) ? kind : 'test');

module.exports = { TEST_KINDS, testKind, cleanKind };
