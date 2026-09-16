import { esc } from './util.js';
import { t } from './i18n.js';

const ICONS = {
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18a4.5 4.5 0 1 1 .8-8.9A6 6 0 0 1 19 11a3.5 3.5 0 0 1-1 7H7z"/></svg>',
  rain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 15a4.5 4.5 0 1 1 .8-8.9A6 6 0 0 1 19 8a3.5 3.5 0 0 1-1 7H7z"/><path d="M8 19l-1 2M12 19l-1 2M16 19l-1 2"/></svg>',
  drop: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3s6 6.6 6 11a6 6 0 0 1-12 0c0-4.4 6-11 6-11z"/></svg>',
  seed: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20v-7"/><ellipse cx="12" cy="10" rx="5" ry="6"/></svg>',
  sprout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21v-8"/><path d="M12 13C12 9 9 7 5 7c0 4 3 6 7 6z"/><path d="M12 13c0-4 3-6 7-6 0 4-3 6-7 6z"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h15M13 6l6 6-6 6"/></svg>',
  question: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.5 1.5c0 1.7-2.5 2-2.5 3.5"/><path d="M12 17.5h.01"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.3l6-.7z"/></svg>',
};

const VI_VOWELS = 'aàáảãạăằắẳẵặâầấẩẫậeèéẻẽẹêềếểễệiìíỉĩịoòóỏõọôồốổỗộơờớởỡợuùúủũụưừứửữựyỳýỷỹỵ';

function aidWrap(title, inner) {
  return `<div class="aid"><h4><span class="aid-ic" aria-hidden="true">${ICONS.star}</span>${esc(title)}</h4>${inner}</div>`;
}

function isInt(n, min, max) {
  return Number.isInteger(n) && n >= min && n <= max;
}

function numberBlocks(aid, lang) {
  const nums = Array.isArray(aid.numbers) ? aid.numbers : [];
  const [a, b] = nums;
  if (!isInt(a, 0, 9999) || !isInt(b, 0, 9999)) return '';
  const sign = aid.operation === 'sub' ? '−' : '+';
  function group(n) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    let rods = '';
    for (let i = 0; i < tens; i++) rods += `<span class="rod" style="animation-delay:${Math.min(i * 0.05, 1.5)}s"></span>`;
    let cubes = '';
    for (let i = 0; i < ones; i++) cubes += `<span class="cube" style="animation-delay:${Math.min(0.3 + i * 0.05, 1.8)}s"></span>`;
    return `<div class="block-group"><div class="cap">${n}</div><div class="tens">${rods}</div>${ones ? `<div class="ones">${cubes}</div>` : ''}</div>`;
  }
  return aidWrap(t(lang, 'aidBlocks'),
    `<div class="blocks">${group(a)}<span class="plus-sign">${sign}</span>${group(b)}</div>`);
}

function groupDots(aid, lang) {
  const { groups, perGroup } = aid;
  if (!isInt(groups, 1, 12) || !isInt(perGroup, 1, 12)) return '';
  let out = '';
  for (let g = 0; g < groups; g++) {
    let dots = '';
    for (let i = 0; i < perGroup; i++) {
      dots += `<span class="dot" style="animation-delay:${(g * perGroup + i) * 0.04}s"></span>`;
    }
    out += `<div class="dot-group">${dots}</div>`;
  }
  return aidWrap(t(lang, 'aidGroups'), `<div class="dot-groups">${out}</div>`);
}

function letterTiles(aid, lang) {
  const word = String(aid.word || '');
  if (!word || word.length > 24 || !/^[^\s]+$/.test(word)) return '';
  const tiles = word.split('').map((ch, i) => {
    const isVowel = VI_VOWELS.includes(ch.toLowerCase());
    const cls = isVowel ? ' tile vowel' : ' tile';
    return `<span class="${cls.trim()}" style="animation-delay:${i * 0.06}s">${esc(ch.toUpperCase())}</span>`;
  }).join('');
  return aidWrap(t(lang, 'aidTiles'), `<div class="tiles">${tiles}</div>`);
}

function stepFlow(aid, lang) {
  const steps = Array.isArray(aid.steps)
    ? aid.steps.filter((s) => s && typeof s === 'object').slice(0, 6)
    : [];
  if (!steps.length) return '';
  const parts = steps.map((s) => {
    const icon = Object.hasOwn(ICONS, s.icon) ? ICONS[s.icon] : ICONS.question;
    return `<div class="flow-step"><span class="flow-ic" aria-hidden="true">${icon}</span><span class="flow-label">${esc(String(s.label || '').slice(0, 40))}</span></div>`;
  });
  const arrow = `<span class="flow-arrow">${ICONS.arrow}</span>`;
  return aidWrap(t(lang, 'aidFlow'), `<div class="flow">${parts.join(arrow)}</div>`);
}

export function renderAid(aid, lang) {
  if (!aid || typeof aid !== 'object') return '';
  switch (aid.type) {
    case 'number-blocks': return numberBlocks(aid, lang);
    case 'group-dots': return groupDots(aid, lang);
    case 'letter-tiles': return letterTiles(aid, lang);
    case 'step-flow': return stepFlow(aid, lang);
    default: return '';
  }
}

export { ICONS };
