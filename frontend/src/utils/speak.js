// Phát âm tiếng Trung bằng Web Speech API (không cần lưu trữ file audio riêng cho từng từ/câu)
export function speak(text, lang = 'zh-CN') {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = lang;
  utter.rate = 0.85;
  const voices = window.speechSynthesis.getVoices();
  const zhVoice = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('zh'));
  if (zhVoice) utter.voice = zhVoice;
  window.speechSynthesis.speak(utter);
}

export function canSpeak() {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}
