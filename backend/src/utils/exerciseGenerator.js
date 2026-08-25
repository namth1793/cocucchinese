/**
 * Sinh nhiều dạng bài tập khác nhau từ CÙNG một bộ dữ liệu từ vựng/câu.
 * Đây là "hệ thống dạng bài dùng chung" theo mục 15 của đặc tả: giáo viên chỉ
 * nhập dữ liệu gốc (từ, câu, nghĩa, ví dụ...), hệ thống tự sinh Trung->Việt,
 * Việt->Trung, Pinyin->Hán tự, Nghe->chọn, Ghép đôi, Sắp xếp câu, v.v.
 */

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(pool, exclude, count) {
  return shuffle(pool.filter((w) => w.id !== exclude.id)).slice(0, count);
}

function mcqFromWords(words, direction) {
  return words.map((word) => {
    const distractors = pickDistractors(words, word, Math.min(3, words.length - 1));
    const options = shuffle([word, ...distractors]).map((w) => ({
      id: w.id,
      label: direction === 'cn-vi' ? w.meaningVi : w.hanzi
    }));
    return {
      id: word.id,
      type: direction === 'cn-vi' ? 'vocab-cn-vi' : 'vocab-vi-cn',
      prompt: direction === 'cn-vi' ? word.hanzi : word.meaningVi,
      pinyin: word.pinyin,
      options,
      answerId: word.id,
      explanation: `${word.hanzi} (${word.pinyin}) = ${word.meaningVi}`
    };
  });
}

function pinyinToHanzi(words) {
  return words.map((word) => {
    const distractors = pickDistractors(words, word, Math.min(3, words.length - 1));
    const options = shuffle([word, ...distractors]).map((w) => ({ id: w.id, label: w.hanzi }));
    return {
      id: word.id,
      type: 'pinyin-hanzi',
      prompt: word.pinyin,
      options,
      answerId: word.id,
      explanation: `${word.pinyin} = ${word.hanzi} (${word.meaningVi})`
    };
  });
}

function listenChoose(words) {
  return words.map((word) => {
    const distractors = pickDistractors(words, word, Math.min(3, words.length - 1));
    const options = shuffle([word, ...distractors]).map((w) => ({ id: w.id, label: w.hanzi, pinyin: w.pinyin }));
    return {
      id: word.id,
      type: 'listen-choose',
      tts: word.hanzi,
      options,
      answerId: word.id,
      explanation: `${word.hanzi} (${word.pinyin}) = ${word.meaningVi}`
    };
  });
}

function matchingPairs(words, count = 6) {
  const chosen = shuffle(words).slice(0, count);
  return {
    left: shuffle(chosen.map((w) => ({ id: w.id, label: w.hanzi, pinyin: w.pinyin }))),
    right: shuffle(chosen.map((w) => ({ id: w.id, label: w.meaningVi })))
  };
}

function memoryPairs(words, count = 6) {
  const chosen = shuffle(words).slice(0, count);
  const cards = [];
  chosen.forEach((w) => {
    cards.push({ cardId: `${w.id}-cn`, pairId: w.id, label: w.hanzi, pinyin: w.pinyin });
    cards.push({ cardId: `${w.id}-vi`, pairId: w.id, label: w.meaningVi });
  });
  return shuffle(cards);
}

function arrangeSentence(sentence) {
  const tokens = sentence.hanzi.replace(/[。！？，]/g, '').split('').filter(Boolean);
  return {
    id: sentence.id,
    type: 'arrange',
    tokens: shuffle(tokens),
    answerTokens: tokens,
    pinyin: sentence.pinyin,
    meaningVi: sentence.vi,
    explanation: `${sentence.hanzi} (${sentence.pinyin}) = ${sentence.vi}`
  };
}

function buildSentence(sentence) {
  const tokens = sentence.hanzi.replace(/[。！？，]/g, '').split('').filter(Boolean);
  return { id: sentence.id, tokens: shuffle(tokens), answerTokens: tokens, meaningVi: sentence.vi };
}

module.exports = {
  shuffle, mcqFromWords, pinyinToHanzi, listenChoose,
  matchingPairs, memoryPairs, arrangeSentence, buildSentence
};
