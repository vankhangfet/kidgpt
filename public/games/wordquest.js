import { WQ_SENTENCES } from './content.js';

export function shuffleWords(words) {
  if (words.length < 2) return words.slice();
  let out;
  do {
    out = words.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
  } while (out.every((w, i) => w === words[i]));
  return out;
}

export function sentencesInZone(zone) {
  return WQ_SENTENCES.filter((s) => s.zone === zone);
}

export function firstWrongSlot(placed, target) {
  for (let i = 0; i < target.length; i++) {
    if (placed[i] !== target[i]) return i;
  }
  return -1;
}

export function renderWordQuest() {}
