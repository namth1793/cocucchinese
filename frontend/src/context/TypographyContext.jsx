import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/client';
import { TYPOGRAPHY_DEFAULTS, applyTypography } from '../constants/typography';

const TypographyContext = createContext({ settings: TYPOGRAPHY_DEFAULTS, setSettings: () => {} });

const CACHE_KEY = 'hsk360_typography';

function cached() {
  try { return { ...TYPOGRAPHY_DEFAULTS, ...JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') }; } catch { return TYPOGRAPHY_DEFAULTS; }
}

/**
 * Kiểu chữ toàn site do admin cấu hình (font Trung/Việt, cỡ chữ Hán/pinyin/nghĩa, màu...).
 * Áp ngay bản lưu tạm trên máy để không bị nháy font, rồi cập nhật theo server.
 */
export function TypographyProvider({ children }) {
  const [settings, setState] = useState(cached);

  useEffect(() => { applyTypography(settings); }, [settings]);

  useEffect(() => {
    api.get('/settings/typography').then((res) => {
      setState(res.data);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(res.data)); } catch { /* bỏ qua */ }
    }).catch(() => {});
  }, []);

  const setSettings = useCallback((next) => {
    setState(next);
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* bỏ qua */ }
  }, []);

  return <TypographyContext.Provider value={{ settings, setSettings }}>{children}</TypographyContext.Provider>;
}

export const useTypography = () => useContext(TypographyContext);
