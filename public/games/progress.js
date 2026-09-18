// Tiến trình game theo profile — localStorage, fallback in-memory khi
// private mode throw. Key: kidgpt-games:<profileId>:<game>
const mem = new Map();

function key(profileId, game) {
  return 'kidgpt-games:' + profileId + ':' + game;
}

export function loadProgress(profileId, game) {
  const k = key(profileId, game);
  try {
    const raw = localStorage.getItem(k);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* private mode — rơi về mem */ }
  return mem.has(k) ? mem.get(k) : null;
}

export function saveProgress(profileId, game, data) {
  const k = key(profileId, game);
  mem.set(k, data);
  try { localStorage.setItem(k, JSON.stringify(data)); } catch (e) { /* bỏ qua */ }
}

export function clearProgress(profileId, game) {
  const k = key(profileId, game);
  mem.delete(k);
  try { localStorage.removeItem(k); } catch (e) { /* bỏ qua */ }
}
