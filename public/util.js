export function esc(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function normalize(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s\-_/]/g, '');
}

export function checkAnswer(userText, check) {
  if (check === null || check === undefined) return false;
  if (typeof check === 'number') {
    const m = String(userText).match(/-?\d+(?:[.,]\d+)?/);
    if (!m) return false;
    return Number(m[0].replace(',', '.')) === check;
  }
  return normalize(userText) === normalize(check);
}
