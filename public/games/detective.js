import { el, SPARK_ICON, BACK_ARROW } from './dom.js';
import { esc } from '../util.js';
import { t } from '../i18n.js';
import { loadProgress, saveProgress, clearProgress } from './progress.js';
import { DETECTIVE_CASES } from './content.js';

export function renderDetective(body, ctx) {
  const L = ctx.lang;
  let save = loadProgress(ctx.profileId, 'detective') || { caseIdx: 0, solved: 0 };
  save.caseIdx = Math.min(Math.max(save.caseIdx || 0, 0), DETECTIVE_CASES.length - 1);
  let stepIdx = 0;
  let canAccuse = false;
  let finished = false;
  let locked = false;   // đang trong cửa sổ chuyển tiếp
  let pending = null;

  const c = () => DETECTIVE_CASES[save.caseIdx];

  const score = el('span', 'gt-score', '🔎 ' + t(L, 'dgCase') + ' ' + (save.caseIdx + 1) + '/' + DETECTIVE_CASES.length);
  ctx.top.appendChild(score);

  const say = el('div', 'game-say');
  const suspectsEl = el('div', 'suspects');
  const clueList = el('div', 'clue-list');
  const stepBox = el('div');
  const actions = el('div', 'game-actions');

  function persist() {
    saveProgress(ctx.profileId, 'detective', save);
    score.textContent = '🔎 ' + t(L, 'dgCase') + ' ' + (Math.min(save.caseIdx, DETECTIVE_CASES.length - 1) + 1) + '/' + DETECTIVE_CASES.length;
  }

  function clearPending() {
    if (pending) { clearTimeout(pending); pending = null; }
  }

  function sayMsg(html, kind) {
    say.className = 'game-say' + (kind ? ' ' + kind : '');
    say.innerHTML = '<div class="gs-av">' + SPARK_ICON + '</div><div class="gs-text">' + html + '</div>';
  }

  function drawSuspects(pickable, resultCls, accusedIdx) {
    suspectsEl.innerHTML = '';
    c().suspects.forEach((s, i) => {
      let cls = 'suspect';
      let tag = 'div';
      if (pickable && !locked) { cls += ' pickable'; tag = 'button'; }
      if (resultCls === 'win' && i === c().culprit) cls += ' culprit';
      if (resultCls === 'win' && i !== c().culprit) cls += ' cleared';
      if (resultCls === 'wrong' && i === accusedIdx) cls += ' accused';
      const elx = el(tag, cls, '<div class="sp-face">' + s.emoji + '</div><div class="sp-name">' + esc(s.name) + '</div>');
      if (tag === 'button') {
        elx.type = 'button';
        elx.addEventListener('click', () => accuse(i));
      }
      suspectsEl.appendChild(elx);
    });
  }

  function drawClues() {
    clueList.innerHTML = '';
    c().clues.forEach((cl) => {
      const s = c().suspects[cl.who];
      clueList.appendChild(el('div', 'clue' + (cl.flag ? ' flag' : ''),
        '<div class="cl-face">' + s.emoji + '</div><div class="cl-text"><span class="cl-who">' + esc(s.name) + ':</span> ' + esc(cl.text[L]) + '</div>'));
    });
  }

  function drawStep() {
    stepBox.innerHTML = '';
    if (stepIdx >= c().steps.length) { openAccuse(); return; }
    const st = c().steps[stepIdx];
    sayMsg('<strong>' + (L === 'en' ? 'Step ' : 'Bước ') + (stepIdx + 1) + '.</strong> ' + esc(st.q[L]));
    const row = el('div', 'opt-row');
    st.options.forEach((o) => {
      const b = el('button', 'opt reason', esc(o.text[L]));
      b.type = 'button';
      b.addEventListener('click', () => {
        if (locked) return;
        if (o.correct) {
          b.classList.add('right');
          row.querySelectorAll('button').forEach((x) => { x.disabled = true; });
          locked = true;
          stepIdx += 1;
          pending = setTimeout(() => { locked = false; drawStep(); }, 600);
        } else {
          b.classList.add('wrong');
          sayMsg('💡 ' + esc(st.hint[L]), 'warn');
        }
      });
      row.appendChild(b);
    });
    stepBox.appendChild(row);
  }

  function openAccuse() {
    canAccuse = true;
    stepBox.innerHTML = '';
    drawSuspects(true);
    sayMsg('🕵️ ' + (L === 'en'
      ? "You've reasoned it through. Now make your call — <strong>who did it?</strong> Tap a suspect to accuse."
      : 'Bạn đã suy luận xong rồi. Giờ ra quyết định — <strong>ai là thủ phạm?</strong> Chạm vào một nghi phạm để tố cáo.'));
  }

  function accuse(i) {
    if (!canAccuse || finished || locked) return;
    if (i === c().culprit) {
      finished = true;
      drawSuspects(false, 'win', i);
      sayMsg(c().closing[L], 'win');
      save.solved += 1;
      const next = el('button', 'gbtn primary', '➜ ' + esc(t(L, 'dgNextCase')));
      next.type = 'button';
      next.addEventListener('click', () => {
        clearPending();
        save.caseIdx += 1;
        if (save.caseIdx >= DETECTIVE_CASES.length) {
          save.caseIdx = 0;
          persist();
          locked = true;
          next.disabled = true;
          sayMsg('🎖️ ' + (L === 'en'
            ? 'All 3 cases closed — you are a <strong>Chief Detective</strong>! The case files start over whenever you want.'
            : 'Cả 3 vụ án đều đã phá xong — bạn là <strong>Thám tử trưởng</strong>! Hồ sơ sẽ mở lại bất cứ lúc nào bạn muốn.'), 'win');
          pending = setTimeout(() => { locked = false; restartCase(); }, 1600);
          return;
        }
        persist();
        restartCase();
      });
      stepBox.innerHTML = '';
      stepBox.appendChild(next);
      persist();
    } else {
      locked = true;
      drawSuspects(false, 'wrong', i);
      sayMsg('🤔 ' + esc(c().nudge[L]), 'warn');
      pending = setTimeout(() => { locked = false; drawSuspects(true); }, 900);
    }
  }

  function restartCase() {
    clearPending();
    stepIdx = 0;
    canAccuse = false;
    finished = false;
    locked = false;
    init();
  }

  function init() {
    sayMsg('🔎 <strong>' + esc(c().title[L]) + '</strong><br>' + c().intro[L]);
    drawSuspects(false);
    drawClues();
    drawStep();
  }

  const resetBtn = el('button', 'gbtn ghost', esc(t(L, 'gameReset')));
  resetBtn.type = 'button';
  resetBtn.addEventListener('click', () => {
    clearProgress(ctx.profileId, 'detective');
    save = { caseIdx: 0, solved: 0 };
    persist();
    restartCase();
  });

  const backBtn = el('button', 'gbtn', BACK_ARROW + esc(t(L, 'gameBack')));
  backBtn.type = 'button';
  backBtn.addEventListener('click', () => { clearPending(); ctx.back(); });

  actions.appendChild(backBtn);
  actions.appendChild(resetBtn);

  body.appendChild(say);
  body.appendChild(suspectsEl);
  body.appendChild(clueList);
  body.appendChild(stepBox);
  body.appendChild(actions);

  init();
}
