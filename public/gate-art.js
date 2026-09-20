// Nghệ thuật SVG cho màn gate — port nguyên văn từ mock/authen-mock.html.
// Mọi class đặt tiền tố g- để không đụng style của app chính.

export function starSvg(cls) {
  return '<svg class="g-star ' + cls + '" viewBox="0 0 24 24"><path d="M12 1c.7 4.5 2.5 6.3 7 7-4.5.7-6.3 2.5-7 7-.7-4.5-2.5-6.3-7-7 4.5-.7 6.3-2.5 7-7Z"/></svg>';
}
export function cloudSvg(cls) {
  return '<svg class="g-cloud ' + cls + '" viewBox="0 0 64 28"><path d="M16 26a10 10 0 0 1 .6-19.9A13 13 0 0 1 42 8a9 9 0 0 1 5 17H16Z"/></svg>';
}

export const HILLS = '<svg class="g-hills" viewBox="0 0 600 240" preserveAspectRatio="none">'
  + '<path d="M0 150 Q120 90 260 140 T600 120 V240 H0 Z" fill="oklch(72% 0.13 150 / .95)"/>'
  + '<path d="M0 190 Q160 130 320 180 T600 170 V240 H0 Z" fill="oklch(66% 0.12 172 / .95)"/>'
  + '<ellipse cx="120" cy="230" rx="30" ry="14" fill="oklch(60% 0.11 160 / .6)"/>'
  + '<ellipse cx="480" cy="234" rx="36" ry="16" fill="oklch(58% 0.11 168 / .6)"/></svg>';

export const SPARKLE_MASCOT = '<svg class="g-sparkle" viewBox="0 0 132 132" role="img" aria-label="Sparkle">'
  + '<defs><radialGradient id="gbody" cx="42%" cy="34%" r="72%">'
  + '<stop offset="0%" stop-color="#ffe79a"/><stop offset="55%" stop-color="#ffcf5c"/><stop offset="100%" stop-color="#ff9f43"/>'
  + '</radialGradient></defs>'
  + '<path d="M66 8c6 30 22 42 52 52-30 10-46 22-52 52-6-30-22-42-52-52 30-10 46-22 52-52Z"'
  + ' fill="url(#gbody)" stroke="#f79021" stroke-width="2.5" stroke-linejoin="round"/>'
  + '<ellipse cx="66" cy="64" rx="27" ry="24" fill="#fff" opacity=".95"/>'
  + '<circle cx="56" cy="61" r="4.6" fill="#2b2352"/><circle cx="76" cy="61" r="4.6" fill="#2b2352"/>'
  + '<circle cx="57.6" cy="59.4" r="1.5" fill="#fff"/><circle cx="77.6" cy="59.4" r="1.5" fill="#fff"/>'
  + '<circle cx="49" cy="70" r="4.6" fill="#ff9aa0" opacity=".7"/><circle cx="83" cy="70" r="4.6" fill="#ff9aa0" opacity=".7"/>'
  + '<path d="M58 71c3 4 13 4 16 0" fill="none" stroke="#2b2352" stroke-width="3" stroke-linecap="round"/></svg>';

export const HERO_BADGE = '<svg class="g-badge" viewBox="0 0 96 96" role="img" aria-label="Sparkle">'
  + '<defs><radialGradient id="ghero" cx="42%" cy="34%" r="72%">'
  + '<stop offset="0%" stop-color="#ffe79a"/><stop offset="55%" stop-color="#ffcf5c"/><stop offset="100%" stop-color="#ff9f43"/>'
  + '</radialGradient></defs>'
  + '<path d="M48 8c4.4 21.6 15.6 30 38 34-22.4 7.2-33 16-38 38-4.4-21.6-15.6-30-38-34 22.4-7.2 33-16 38-38Z"'
  + ' fill="url(#ghero)" stroke="#f79021" stroke-width="2" stroke-linejoin="round"/>'
  + '<ellipse cx="48" cy="46" rx="20" ry="18" fill="#fff" opacity=".95"/>'
  + '<circle cx="41" cy="44" r="3.4" fill="#2b2352"/><circle cx="56" cy="44" r="3.4" fill="#2b2352"/>'
  + '<circle cx="36" cy="51" r="3.4" fill="#ff9aa0" opacity=".7"/><circle cx="61" cy="51" r="3.4" fill="#ff9aa0" opacity=".7"/>'
  + '<path d="M42 51c2.4 3 9.6 3 12 0" fill="none" stroke="#2b2352" stroke-width="2.4" stroke-linecap="round"/></svg>';

export const HERO_BADGE_SAD = HERO_BADGE
  .replace('M42 51c2.4 3 9.6 3 12 0', 'M42 55c2.4 -3 9.6 -3 12 0');

export const BUDDY_ROBOT = '<svg class="g-buddy b-left" viewBox="0 0 64 64" aria-hidden="true">'
  + '<rect x="14" y="20" width="36" height="30" rx="12" fill="#7fd7e6" stroke="#3fa9bd" stroke-width="2"/>'
  + '<line x1="32" y1="12" x2="32" y2="20" stroke="#3fa9bd" stroke-width="2.4"/>'
  + '<circle cx="32" cy="10" r="4" fill="#ffd76b"/>'
  + '<circle cx="25" cy="34" r="4" fill="#2b2352"/><circle cx="39" cy="34" r="4" fill="#2b2352"/>'
  + '<circle cx="26.2" cy="32.6" r="1.3" fill="#fff"/><circle cx="40.2" cy="32.6" r="1.3" fill="#fff"/>'
  + '<path d="M26 42c3 3 9 3 12 0" fill="none" stroke="#2b2352" stroke-width="2.4" stroke-linecap="round"/></svg>';

export const BUDDY_OWL = '<svg class="g-buddy b-right" viewBox="0 0 64 64" aria-hidden="true">'
  + '<path d="M32 14c11 0 18 8 18 20s-8 18-18 18-18-6-18-18 7-20 18-20Z" fill="#c79ce8" stroke="#9b6fd0" stroke-width="2"/>'
  + '<path d="M18 18c0-4 4-6 7-4M46 18c0-4-4-6-7-4" stroke="#9b6fd0" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
  + '<circle cx="25" cy="33" r="7" fill="#fff"/><circle cx="39" cy="33" r="7" fill="#fff"/>'
  + '<circle cx="25" cy="33" r="3.4" fill="#2b2352"/><circle cx="39" cy="33" r="3.4" fill="#2b2352"/>'
  + '<path d="M29 41l3 3 3-3Z" fill="#ffb347"/></svg>';

export const BRAND_MARK = '<svg viewBox="0 0 24 24" fill="none">'
  + '<path d="M12 2.5c.5 3.2 1.8 4.5 5 5-3.2.5-4.5 1.8-5 5-.5-3.2-1.8-4.5-5-5 3.2-.5 4.5-1.8 5-5Z" fill="#ffd76b"/>'
  + '<path d="M18.5 13c.28 1.6.9 2.2 2.5 2.5-1.6.28-2.22.9-2.5 2.5-.28-1.6-.9-2.22-2.5-2.5 1.6-.3 2.22-.9 2.5-2.5Z" fill="#fff"/></svg>';

export const GOOGLE_ICON = '<svg class="g" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"/><path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84Z"/><path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 1.46 14.97.5 12 .5A11 11 0 0 0 2.18 7.05l3.66 2.84C6.71 6.68 9.14 4.75 12 4.75Z"/></svg>';
export const SPINNER = '<svg class="spin" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="var(--tutor)" stroke-width="3" stroke-opacity=".25"/><path d="M21 12a9 9 0 0 0-9-9" stroke="var(--tutor)" stroke-width="3" stroke-linecap="round"/></svg>';

export const ICON_SHIELD = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/><path d="m9 12 2 2 4-4"/></svg>';
export const ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 7 9 18l-5-5"/></svg>';
export const ICON_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>';
export const ICON_NOTE = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>';
export const ICON_GAMES = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="3"/><path d="M8 3v3M16 3v3M8 12h.01M12 12h.01M16 12h.01"/></svg>';
export const ICON_PERSON = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
export const ICON_BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V6a2 2 0 0 1 2-2h6v15H6a2 2 0 0 0-2 2Z"/><path d="M20 19V6a2 2 0 0 0-2-2h-6v15h6a2 2 0 0 1 2 2Z"/></svg>';
export const ICON_ATOM = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(28 12 12)"/></svg>';
