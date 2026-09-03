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
