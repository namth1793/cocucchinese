/**
 * Cây danh mục khoá học dùng chung cho sidebar học viên và sidebar admin, để
 * hai bên luôn khớp nhau (chỉ danh mục "HSK & HSKK" có 2 nhóm con).
 */
export const COURSE_CATEGORIES = [
  {
    key: 'hsk_hskk', label: 'HSK & HSKK', emoji: '🎯',
    groups: [
      { key: 'HSK 3.0', label: 'HSK 3.0', emoji: '🌟' },
      { key: 'HSKK', label: 'HSKK', emoji: '🗣️' }
    ]
  },
  { key: 'kids', label: 'Tiếng Trung trẻ em', emoji: '👶' },
  { key: 'conversation', label: 'Tiếng Trung giao tiếp', emoji: '🗣️' }
];

/**
 * "Loại" cấp độ luôn quyết định cấp độ đó rơi vào mục nào ở sidebar - admin
 * chỉ cần chọn Loại, backend tự gán category/group tương ứng (xem
 * backend/src/routes/levels.js). Danh sách này phải khớp với TYPE_PLACEMENT
 * bên backend.
 */
export const LEVEL_TYPE_OPTIONS = [
  { value: 'HSK', label: 'HSK (→ HSK & HSKK / HSK 3.0)' },
  { value: 'HSKK', label: 'HSKK (→ HSK & HSKK / HSKK)' },
  { value: 'YCT', label: 'YCT (→ Tiếng Trung trẻ em)' },
  { value: 'KIDS', label: 'Trẻ em khác (→ Tiếng Trung trẻ em)' },
  { value: 'CONVO', label: 'Giao tiếp (→ Tiếng Trung giao tiếp)' }
];

const CATEGORY_LABEL_BY_KEY = Object.fromEntries(COURSE_CATEGORIES.map((c) => [c.key, c.label]));

export function placementLabel(level) {
  const catLabel = CATEGORY_LABEL_BY_KEY[level.category] || level.category || '—';
  return level.group ? `${catLabel} / ${level.group}` : catLabel;
}
