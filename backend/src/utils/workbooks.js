/**
 * Sách bài tập là 1 cấp độ riêng (soạn bài như khoá thường) nhưng hiển thị bên trong khoá chính,
 * mục "Sách bài tập" - không hiện thành khoá riêng ở trang công khai.
 * level.workbookOf: id khoá chính; '' = không phải sách bài tập; chưa đặt = tự nhận theo mã
 * "<MÃ KHOÁ>-SBT" (VD: HSK1-SBT là sách bài tập của HSK1).
 */
function workbookParentId(level, levels) {
  if (typeof level.workbookOf === 'string') {
    return level.workbookOf && levels.some((l) => l.id === level.workbookOf) ? level.workbookOf : null;
  }
  const m = /^(.+)-SBT$/i.exec(String(level.code || '').trim());
  if (!m) return null;
  const parent = levels.find((l) => l.id !== level.id && String(l.code || '').trim().toUpperCase() === m[1].toUpperCase());
  return parent ? parent.id : null;
}

const isWorkbook = (level, levels) => workbookParentId(level, levels) !== null;

module.exports = { workbookParentId, isWorkbook };
