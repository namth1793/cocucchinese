import { createContext, useContext, useState, useCallback } from 'react';

const PinyinContext = createContext(null);

// Trạng thái ẩn/hiện Pinyin dùng chung cho toàn bộ website (mục "Yêu cầu chức năng ẩn/hiện Pinyin")
export function PinyinProvider({ children }) {
  const [showPinyin, setShowPinyin] = useState(() => localStorage.getItem('cocuc_pinyin') !== 'hidden');

  const toggle = useCallback(() => {
    setShowPinyin((prev) => {
      const next = !prev;
      localStorage.setItem('cocuc_pinyin', next ? 'shown' : 'hidden');
      return next;
    });
  }, []);

  return (
    <PinyinContext.Provider value={{ showPinyin, toggle }}>
      {children}
    </PinyinContext.Provider>
  );
}

export function usePinyin() {
  return useContext(PinyinContext);
}
