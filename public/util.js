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
    const tokens = String(userText).matchAll(/[-−]?\d+(?:[.,]\d+)?/g);
    for (const m of tokens) {
      let raw = m[0].replace('−', '-');
      if (/^\d{1,3}(\.\d{3})+$/.test(raw)) raw = raw.replace(/\./g, '');
      if (Number(raw.replace(',', '.')) === check) return true;
    }
    return false;
  }
  return normalize(userText) === normalize(check);
}
