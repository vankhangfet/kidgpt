import { WQ_SENTENCES } from './content.js';
import { el, SPARK_ICON, BACK_ARROW } from './dom.js';
import { esc } from '../util.js';
import { t } from '../i18n.js';
import { loadProgress, saveProgress, clearProgress } from './progress.js';

export function shuffleWords(words) {
  if (words.length < 2 || words.every((w) => w === words[0])) return words.slice();
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

const CRYSTAL_SVG = '<svg viewBox="0 0 120 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
  + '<defs><linearGradient id="wqcry" x1="0" y1="0" x2="1" y2="1">'
  + '<stop offset="0" stop-color="oklch(78% 0.12 300)"/><stop offset="1" stop-color="oklch(52% 0.18 320)"/>'
  + '</linearGradient></defs>'
  + '<polygon points="60,8 96,52 76,142 44,142 24,52" fill="url(#wqcry)" stroke="#fff" stroke-width="2.5"/>'
  + '<polygon points="60,8 76,142 60,120" fill="#fff" opacity="0.25"/>'
  + '<polygon points="24,52 60,8 60,120" fill="#fff" opacity="0.14"/>'
  + '<path d="M60 8 24 52M60 8 96 52M24 52 60 120M96 52 60 120" stroke="#fff" stroke-width="1.2" opacity="0.5"/></svg>';

export function renderWordQuest(body, ctx) {
  const L = ctx.lang;
  let save = loadProgress(ctx.profileId, 'wordquest') || { zone: 1, maxZone: 1, stage: 0, done: 0 };
  let sentence = null;   // câu hiện tại
  let bank = [];         // [{word, used}] — mỗi thẻ là 1 instance của từ
  let placed = [];       // slot → index trong bank (null = trống)
  let selected = null;   // index trong bank đang chọn
  let pending = null;    // timer id cho chuyển câu

  const score = el('span', 'gt-score', '🔮 ' + save.done);
  ctx.top.appendChild(score);

  const levelRow = el('div', 'level-row');
  const say = el('div', 'game-say');
  const scene = el('div', 'wq-scene');
  const slotsEl = el('div', 'wq-slots');
  const bankEl = el('div', 'wq-bank');
  const crystal = el('div', 'wq-crystal stage-' + Math.min(save.stage + 1, 4), CRYSTAL_SVG);
  const actions = el('div', 'game-actions');

  function persist() {
    saveProgress(ctx.profileId, 'wordquest', save);
    score.textContent = '🔮 ' + save.done;
  }

  function sayMsg(html, kind) {
    say.className = 'game-say' + (kind ? ' ' + kind : '');
    say.innerHTML = '<div class="gs-av">' + SPARK_ICON + '</div><div class="gs-text">' + html + '</div>';
  }

  function drawLevels() {
    levelRow.innerHTML = '';
    for (let z = 1; z <= 5; z++) {
      const pill = el('button', 'level-pill magic' + (z === save.zone ? ' active' : ''));
      pill.type = 'button';
      pill.textContent = t(L, 'wqZone' + z);
      if (z > save.maxZone) {
        pill.classList.add('locked');
        pill.disabled = true;
        pill.title = L === 'en' ? 'Clear the earlier lands first!' : 'Qua các vùng trước đã nhé!';
      } else if (z !== save.zone) {
        pill.title = t(L, 'gameGo');
        pill.addEventListener('click', () => {
          save.zone = z; save.stage = 0;
          persist(); drawLevels(); newSentence();
        });
    }
      levelRow.appendChild(pill);
    }
  }

  function clearPending() {
    if (pending) { clearTimeout(pending); pending = null; }
  }

  function newSentence() {
    clearPending();
    const list = sentencesInZone(save.zone);
    sentence = list[save.stage];
    bank = shuffleWords(sentence.words).map((w) => ({ word: w, used: false }));
    placed = sentence.words.map(() => null);
    selected = null;
    crystal.className = 'wq-crystal stage-' + Math.min(save.stage + 1, 4);
    castBtn.disabled = false;
    hintBtn.disabled = false;
    sayMsg(L === 'en'
      ? '🧙‍♀️ The Magic Book lost its words! Tap a word card, then tap a slot to place it in the <strong>right order</strong>.'
      : '🧙‍♀️ Quyển sách phép thuật làm rơi tung từ! Chạm một thẻ chữ, rồi chạm ô trống để xếp vào <strong>đúng thứ tự</strong> nhé.');
    drawScene();
  }

  function drawScene() {
    slotsEl.innerHTML = '';
    bankEl.innerHTML = '';
    placed.forEach((bi, i) => {
      const slot = el('div', 'wq-slot' + (bi !== null ? ' filled' : ''));
      if (bi !== null) slot.appendChild(el('span', 'word-card', esc(bank[bi].word)));
      slot.addEventListener('click', (e) => {
        if (bi === null) return;   // ô trống: listener đặt thẻ (phía dưới) xử lý
        e.stopPropagation();       // ô đã xếp: trả thẻ về bank
        bank[bi].used = false;
        placed[i] = null;
        drawScene();
      });
      slotsEl.appendChild(slot);
    });
    bank.forEach((b, i) => {
      if (b.used) return;
      const card = el('button', 'word-card' + (selected === i ? ' selected' : ''));
      card.type = 'button';
      card.textContent = b.word;
      card.addEventListener('click', () => {
        selected = selected === i ? null : i;
        drawScene();
      });
      bankEl.appendChild(card);
    });
  }

  // đặt thẻ đang chọn vào ô trống được chạm (tap-then-tap)
  slotsEl.addEventListener('click', (e) => {
    if (selected === null) return;
    const slotEls = Array.prototype.slice.call(slotsEl.children);
    const idx = slotEls.indexOf(e.target.closest('.wq-slot'));
    if (idx < 0 || placed[idx] !== null) return;
    placed[idx] = selected;
    bank[selected].used = true;
    selected = null;
    drawScene();
  });

  function cast() {
    if (placed.some((bi) => bi === null)) {
      sayMsg(L === 'en'
        ? '🪄 There is an empty slot — read the words out loud and find the missing one!'
        : '🪄 Còn ô trống kìa — đọc to các từ đã xếp xem còn thiếu từ nào!', 'warn');
      return;
    }
    const words = placed.map((bi) => (bi === null ? null : bank[bi].word));
    const wrongAt = firstWrongSlot(words, sentence.words);
    if (wrongAt >= 0) {
      sayMsg(L === 'en'
        ? '🪄 Hmm, slot ' + (wrongAt + 1) + ' sounds odd. Say it out loud — which word should come <strong>before</strong> it?'
        : '🪄 Hình như ô thứ ' + (wrongAt + 1) + ' nghe chưa thuận tai. Đọc to thử xem — từ nào nên đứng <strong>trước</strong> nhỉ?', 'warn');
      return;
    }
    // đúng!
    save.done += 1;
    const zoneLen = sentencesInZone(save.zone).length;
    if (save.stage >= zoneLen - 1) {
      if (save.zone >= 5) {
        save.zone = 1; save.stage = 0; save.maxZone = 5;
      } else {
        save.zone += 1; save.stage = 0;
        save.maxZone = Math.max(save.maxZone, save.zone);
      }
    } else {
      save.stage += 1;
    }
    persist();
    drawLevels();
    crystal.className = 'wq-crystal stage-4';
    slotsEl.querySelectorAll('.word-card').forEach((c) => c.classList.add('locked'));
    castBtn.disabled = true;
    hintBtn.disabled = true;
    sayMsg('✨ <strong>' + (L === 'en' ? 'Magic spell activated!' : 'Chú thuật đã khởi động!') + '</strong> '
      + esc(sentence.en) + ' 🔮 ' + (L === 'en' ? 'Your crystal grows!' : 'Tinh thể của bạn lớn thêm!'), 'win');
    pending = setTimeout(newSentence, 900);
  }

  const castBtn = el('button', 'gbtn primary', '✨ ' + esc(t(L, 'wqCast')));
  castBtn.type = 'button';
  castBtn.addEventListener('click', cast);

  const hintBtn = el('button', 'gbtn hint', '💡 ' + esc(t(L, 'needHint')));
  hintBtn.type = 'button';
  hintBtn.addEventListener('click', () => {
    if (!sentence) return;
    sayMsg(L === 'en'
      ? '💡 This sentence means: <strong>' + esc(sentence.vi) + '</strong> — now find the first word!'
      : '💡 Câu này nghĩa là: <strong>' + esc(sentence.vi) + '</strong> — thử tìm từ đầu tiên nhé!', 'warn');
  });

  const resetBtn = el('button', 'gbtn ghost', esc(t(L, 'gameReset')));
  resetBtn.type = 'button';
  resetBtn.addEventListener('click', () => {
    clearPending();
    clearProgress(ctx.profileId, 'wordquest');
    save = { zone: 1, maxZone: 1, stage: 0, done: 0 };
    persist(); drawLevels(); newSentence();
  });

  const backBtn = el('button', 'gbtn', BACK_ARROW + esc(t(L, 'gameBack')));
  backBtn.type = 'button';
  backBtn.addEventListener('click', () => { clearPending(); ctx.back(); });

  actions.appendChild(castBtn);
  actions.appendChild(hintBtn);
  actions.appendChild(backBtn);
  actions.appendChild(resetBtn);

  scene.appendChild(slotsEl);
  scene.appendChild(bankEl);

  body.appendChild(levelRow);
  body.appendChild(say);
  body.appendChild(scene);
  body.appendChild(crystal);
  body.appendChild(actions);

  drawLevels();
  newSentence();
}
