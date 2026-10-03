import { API_ORIGIN } from '../api/client';

/**
 * Phát âm tiếng Trung. Nếu giáo viên đã tải file nghe cho đúng chữ/câu đó (audioUrl trên từ
 * vựng, câu, hội thoại) thì phát file thật; nếu chưa có thì dùng giọng đọc Web Speech API.
 * Bản đồ chữ -> file nghe được tự nạp từ mọi phản hồi API (xem registerAudioFromData ở
 * api/client.js), nên các trang học chỉ cần gọi speak(text) như cũ.
 */
const audioByText = new Map();
const blobCache = new Map();
let current = null;

const norm = (text) => String(text || '').trim();

export function registerAudio(text, url) {
  const key = norm(text);
  if (!key) return;
  if (url) audioByText.set(key, url);
  else audioByText.delete(key);
}

/** Duyệt (giới hạn độ sâu) dữ liệu trả về từ API, ghi nhận mọi cặp {hanzi|tts, audioUrl}. */
export function registerAudioFromData(data, depth = 0) {
  if (!data || typeof data !== 'object' || depth > 5) return;
  if (Array.isArray(data)) { data.forEach((x) => registerAudioFromData(x, depth + 1)); return; }
  if (typeof data.audioUrl === 'string' && data.audioUrl) {
    if (data.hanzi) registerAudio(data.hanzi, data.audioUrl);
    if (data.tts) registerAudio(data.tts, data.audioUrl);
  }
  Object.values(data).forEach((v) => { if (v && typeof v === 'object') registerAudioFromData(v, depth + 1); });
}

/** URL dạng /uploads/media/... (chế độ lưu cục bộ) cần gửi kèm token nên tải về thành blob trước. */
async function resolvePlayableUrl(url) {
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  if (blobCache.has(url)) return blobCache.get(url);
  const token = localStorage.getItem('cocuc_token');
  const res = await fetch(`${API_ORIGIN}${url}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error('audio fetch failed');
  const objectUrl = URL.createObjectURL(await res.blob());
  blobCache.set(url, objectUrl);
  return objectUrl;
}

export function stopSpeaking() {
  if (current) { current.pause(); current = null; }
  if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
}

/** Phát 1 file nghe; trả về Promise kết thúc khi bắt đầu phát (lỗi -> reject). */
export async function playAudioUrl(url) {
  stopSpeaking();
  const audio = new Audio(await resolvePlayableUrl(url));
  current = audio;
  await audio.play();
  return audio;
}

function speakTts(text, lang) {
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

export function speak(text, lang = 'zh-CN') {
  const url = audioByText.get(norm(text));
  if (url) {
    playAudioUrl(url).catch(() => speakTts(text, lang));
    return;
  }
  stopSpeaking();
  speakTts(text, lang);
}

export function canSpeak() {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}
