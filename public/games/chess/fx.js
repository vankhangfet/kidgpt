// Hiệu ứng cờ vua — hàm thuần, test được (không chạm DOM).

// FLIP: quân mới ở ô đích cần dịch về vị trí ô nguồn rồi transition về 0
export function glideDelta(fromRect, toRect) {
  return { dx: fromRect.left - toRect.left, dy: fromRect.top - toRect.top };
}

// Toạ độ % (SVG viewBox 0 0 100 100) cho mũi tên ô nguồn → ô đích.
// Pad bị kẹp theo độ dài để nước đi ngắn (1 ô, mã, 2 ô) không bị đảo
// đầu mũi tên; đuôi lùi `p` từ tâm nguồn, đầu lùi `p + headLen` từ tâm đích.
// Điều kiện: from ≠ to, boardRect đã layout (width/height > 0).
export function arrowPct(boardRect, fromRect, toRect, padPct) {
  if (!(boardRect.width > 0) || !(boardRect.height > 0)) return { x1: 0, y1: 0, x2: 0, y2: 0 };
  const pct = (rect) => ({
    x: ((rect.left + rect.width / 2 - boardRect.left) / boardRect.width) * 100,
    y: ((rect.top + rect.height / 2 - boardRect.top) / boardRect.height) * 100,
  });
  const a = pct(fromRect);
  const b = pct(toRect);
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  const p = Math.min(padPct || 6, Math.max(0, (len - 8) / 2));
  const headLen = Math.min(4, Math.max(0, len - 2 * p - 1));
  const ux = (b.x - a.x) / len;
  const uy = (b.y - a.y) / len;
  return {
    x1: a.x + ux * p,
    y1: a.y + uy * p,
    x2: b.x - ux * (p + headLen),
    y2: b.y - uy * (p + headLen),
  };
}

// Tam giác đầu mũi tên (polygon points) tại (x2,y2) hướng theo mũi tên
export function arrowHead(x1, y1, x2, y2) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const hx = Math.cos(ang);
  const hy = Math.sin(ang);
  const px = hy;
  const py = -hx;
  const f = (n) => n.toFixed(1).replace(/\.0$/, '');
  const tip = f(x2 + hx * 4) + ',' + f(y2 + hy * 4);
  const b1 = f(x2 - hx * 2 + px * 2.5) + ',' + f(y2 - hy * 2 + py * 2.5);
  const b2 = f(x2 - hx * 2 - px * 2.5) + ',' + f(y2 - hy * 2 - py * 2.5);
  return tip + ' ' + b1 + ' ' + b2;
}

export const CONFETTI_COLORS = ['#ef6a4e', '#30a5a2', '#e8bf59', '#5a5fd1', '#e05a92', '#37b86b'];

// 24 mảnh pháo giấy; rand cho phép seed để test (mặc định Math.random)
export function confettiSpec(rand) {
  const r = typeof rand === 'function' ? rand : Math.random;
  const out = [];
  for (let i = 0; i < 24; i++) {
    out.push({
      left: Math.floor(r() * 100),
      delay: Math.round(r() * 300),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotate: Math.round(r() * 360),
      duration: 1100 + Math.round(r() * 500),
    });
  }
  return out;
}

// moves: [{mover:'w'|'b', capT: loại quân bị ăn | null}] theo thứ tự
export function traysFromMoves(moves) {
  const byW = [];
  const byB = [];
  for (const m of moves) {
    if (m.capT) (m.mover === 'w' ? byW : byB).push(m.capT);
  }
  return { byW, byB };
}

export function prefersReducedMotion(win) {
  try {
    const w = win || window;
    return !!(w && w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) {
    return false;
  }
}
