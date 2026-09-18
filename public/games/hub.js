import { el, sayBubble, BACK_ARROW } from './dom.js';
import { esc } from '../util.js';
import { t } from '../i18n.js';
import { renderTreasure } from './treasure.js';
import { renderWordQuest } from './wordquest.js';
import { renderDetective } from './detective.js';
import { renderChess } from './chess/ui.js';

const GO_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

const GAMES = [
  {
    id: 'treasure', cls: 'treasure', emoji: '🗺️',
    title: { vi: 'Kho báu số học', en: 'Treasure Number' },
    desc: {
      vi: 'Giải toán để mở Kho báu thất truyền — vượt 5 chặng, lấp đầy khay kim cương!',
      en: 'Solve math to unlock the Lost Treasure — cross 5 checkpoints and fill your gem tray!',
    },
    render: renderTreasure,
  },
  {
    id: 'wordquest', cls: 'wordquest', emoji: '📚',
    title: { vi: 'Hành trình chữ', en: 'Word Quest' },
    desc: {
      vi: 'Sắp các thẻ chữ về đúng thứ tự để niệm chú thuật và nuôi lớn tinh thể phép thuật.',
      en: 'Put the mixed-up words back in order to cast the spell and grow your magic crystal.',
    },
    render: renderWordQuest,
  },
  {
    id: 'detective', cls: 'detective', emoji: '🕵️',
    title: { vi: 'Thám tử nhỏ', en: 'Puzzle Detective' },
    desc: {
      vi: 'Đọc manh mối, suy luận từng bước cùng Sparkle và tự tay phá 3 vụ án.',
      en: 'Read the clues, reason step by step with Sparkle, and crack all 3 cases yourself.',
    },
    render: renderDetective,
  },
  {
    id: 'chess', cls: 'chessgame', emoji: '♟️',
    title: { vi: 'Cờ vua cùng Sparkle', en: 'Chess with Sparkle' },
    desc: {
      vi: 'Đấu với Sparkle Bot — chạm quân xem nước đi hợp lệ, cần gợi ý cứ bấm!',
      en: 'Play the Sparkle Bot — tap a piece to see its moves, ask for a hint any time!',
    },
    render: renderChess,
  },
];

let current = null; // 'hub' | gameId
let ctx = null;     // { profileId, lang, onExit }

export function showGames(profileId, lang, onExit) {
  ctx = { profileId, lang, onExit };
  current = 'hub';
  renderHub();
}

export function hideGames() {
  const v = document.getElementById('gamesView');
  if (v) v.innerHTML = '';
  current = null;
  ctx = null;
}

export function refreshGames(lang) {
  if (!ctx || !current) return;
  ctx.lang = lang;
  if (current === 'hub') renderHub();
  else openGame(current);
}

function view() { return document.getElementById('gamesView'); }

function topbar() {
  const bar = el('div', 'games-topbar');
  const back = el('button', 'gback', BACK_ARROW + esc(t(ctx.lang, 'gameBackChat')));
  back.type = 'button';
  back.addEventListener('click', () => {
    if (ctx && typeof ctx.onExit === 'function') ctx.onExit();
  });
  bar.appendChild(back);
  return bar;
}

function renderHub() {
  const v = view();
  v.innerHTML = '';
  const inner = el('div', 'games-inner');
  inner.appendChild(topbar());
  inner.insertAdjacentHTML('beforeend', sayBubble(t(ctx.lang, 'gamesSay')));
  const hub = el('div', 'game-hub');
  for (const g of GAMES) {
    const card = el('button', 'game-card ' + g.cls);
    card.type = 'button';
    card.innerHTML =
      '<span class="gc-badge" aria-hidden="true">' + g.emoji + '</span>' +
      '<div class="gc-title">' + esc(g.title[ctx.lang]) + '</div>' +
      '<div class="gc-desc">' + esc(g.desc[ctx.lang]) + '</div>' +
      '<span class="gc-go">' + esc(t(ctx.lang, 'gameGo')) + ' ' + GO_SVG + '</span>';
    card.addEventListener('click', () => openGame(g.id));
    hub.appendChild(card);
  }
  inner.appendChild(hub);
  v.appendChild(inner);
}

function openGame(id) {
  const g = GAMES.find((x) => x.id === id);
  if (!g) return;
  current = id;
  const v = view();
  v.innerHTML = '';
  const inner = el('div', 'games-inner');
  inner.appendChild(topbar());
  const panel = el('div', 'game ' + g.cls);
  const top = el('div', 'game-top',
    '<span class="gt-emoji" aria-hidden="true">' + g.emoji + '</span>' +
    '<span><div class="gt-title">' + esc(g.title[ctx.lang]) + '</div></span>');
  const body = el('div', 'game-body');
  panel.appendChild(top);
  panel.appendChild(body);
  inner.appendChild(panel);
  v.appendChild(inner);
  g.render(body, {
    lang: ctx.lang,
    profileId: ctx.profileId,
    top,
    back: () => { current = 'hub'; renderHub(); },
  });
}
