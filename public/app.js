import { esc, checkAnswer } from './util.js';
import { renderAid } from './aids.js';
import { t, SUBJECTS, subjectLabel, placeholderFor, suggestsFor, STRINGS, resolveLang } from './i18n.js';
import { initGate, reopenGate } from './gate.js';
import { HERO_BADGE } from './gate-art.js';
import { getAuthToken } from './auth.js';
import { showGames, hideGames, refreshGames } from './games/hub.js';

const I = {
  spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="3.2"/></svg>',
  kid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6"/></svg>',
  math: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 9h4M9 7v4M14 8.5h3M7 15.5h4M14.5 14l2.5 2.5M17 14l-2.5 2.5"/></svg>',
  reading: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5C10.5 5 8 4.5 4 5v13c4-.5 6.5 0 8 1.5 1.5-1.5 4-2 8-1.5V5c-4-.5-6.5 0-8 1.5z"/><path d="M12 6.5v13"/></svg>',
  english: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-8 8H4l2.5-2.5A8 8 0 1 1 21 12z"/><path d="M8.5 10.5h7M8.5 13.5h4.5"/></svg>',
  science: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6.5L5.5 17a2 2 0 0 0 1.8 3h9.4a2 2 0 0 0 1.8-3L14 9.5V3"/><path d="M8.5 14h7"/></svg>',
  curio: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.5 1.5c0 1.7-2.5 2-2.5 3.5"/><path d="M12 17.5h.01"/></svg>',
  games: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="8" width="20" height="10" rx="5"/><path d="M7 11v4M5 13h4"/><circle cx="15.5" cy="12" r=".9" fill="currentColor" stroke="none"/><circle cx="18.5" cy="14" r=".9" fill="currentColor" stroke="none"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.4 1 2.5h6c0-1.1.3-1.8 1-2.5A6 6 0 0 0 12 3z"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="15" r="4.5"/><path d="M11 12l8-8M17 4l2 2M14 7l2 2"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12l16-8-6 16-3-6-7-2z"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6L3.4 9.3l6-.7z"/></svg>',
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.prototype.slice.call(r.querySelectorAll(s));

const stream = $('#stream');
const input = $('#input');

let lang = resolveLang(localStorage.getItem('kidgpt-lang'));

let history = [];          // [{role, content}] — trim 10 lượt
let active = null;         // { plan, question, revealed, stepEls, nextBtn }
let forcedSubject = null;
let hintLevel = 0;
let failStreak = 0;
let currentProfile = null;
let busy = false;
let session = 0;

function scrollDown() { stream.scrollTop = stream.scrollHeight; }

function addMsg(who, content) {
  const wrap = document.createElement('div');
  wrap.className = 'msg ' + who;
  const av = document.createElement('div');
  av.className = 'avatar';
  av.setAttribute('aria-hidden', 'true');
  av.innerHTML = who === 'you' ? I.kid : I.spark;
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  if (typeof content === 'string') bubble.innerHTML = content;
  else content(bubble);
  wrap.appendChild(av);
  wrap.appendChild(bubble);
  stream.appendChild(wrap);
  scrollDown();
  return bubble;
}

function addCheer(text, kind) {
  const el = document.createElement('div');
  el.className = 'cheer' + (kind === 'try' ? ' try' : '');
  el.innerHTML = I.star + '<span>' + esc(text) + '</span>';
  stream.appendChild(el);
  scrollDown();
}

function showThinking() {
  const wrap = document.createElement('div');
  wrap.className = 'msg tutor';
  wrap.innerHTML = '<div class="avatar" aria-hidden="true">' + I.spark + '</div><div class="bubble"><div class="thinking"><span></span><span></span><span></span></div></div>';
  stream.appendChild(wrap);
  scrollDown();
  return wrap;
}

function randomCheer() {
  const list = STRINGS[lang].cheers;
  return list[Math.floor(Math.random() * list.length)];
}

/* ------------------------------------------------ plan rendering */

function renderTurn(plan) {
  hintLevel = 0;
  active = { plan, question: active && active.question, revealed: 1, stepEls: [] };
  addMsg('tutor', (b) => {
    const lead = document.createElement('p');
    lead.className = 'lead';
    lead.textContent = plan.intro;
    b.appendChild(lead);

    const aidHtml = renderAid(plan.aid, lang);
    if (aidHtml) {
      const holder = document.createElement('div');
      holder.innerHTML = aidHtml;
      b.appendChild(holder.firstElementChild);
    }

    const steps = document.createElement('div');
    steps.className = 'steps';
    plan.steps.forEach((s, i) => {
      const step = document.createElement('div');
      step.className = 'step' + (i === 0 ? ' revealed current' : '');
      step.innerHTML = '<div class="num">' + (i + 1) + '</div><div class="body"><div class="q">' + esc(s.question) + '</div><div class="tip">' + I.bulb + ' ' + esc(s.tip) + '</div></div>';
      steps.appendChild(step);
      active.stepEls.push(step);
    });
    b.appendChild(steps);

    const chips = document.createElement('div');
    chips.className = 'chips';
    const next = document.createElement('button');
    next.className = 'chip';
    next.type = 'button';
    next.innerHTML = I.check + ' ' + esc(t(lang, 'nextStep'));
    next.addEventListener('click', onNextStep);
    const hint = document.createElement('button');
    hint.className = 'chip hint';
    hint.type = 'button';
    hint.innerHTML = I.bulb + ' ' + esc(t(lang, 'needHint'));
    hint.addEventListener('click', onHint);
    chips.appendChild(next);
    chips.appendChild(hint);
    if (plan.answer && plan.answer.explanation) {
      const reveal = document.createElement('button');
      reveal.className = 'chip reveal';
      reveal.type = 'button';
      reveal.innerHTML = I.key + ' ' + esc(t(lang, 'reveal'));
      reveal.addEventListener('click', onReveal);
      chips.appendChild(reveal);
    }
    b.appendChild(chips);
    active.nextBtn = next;
  });
}

function onNextStep() {
  if (!active) return;
  const curEl = active.stepEls[active.revealed - 1];
  if (curEl) {
    curEl.classList.remove('current');
    curEl.classList.add('done');
  }
  if (active.revealed < active.plan.steps.length) {
    hintLevel = 0;
    const el = active.stepEls[active.revealed];
    el.classList.add('revealed', 'current');
    active.revealed += 1;
    scrollDown();
  } else {
    active.nextBtn.disabled = true;
    active.nextBtn.style.opacity = 0.4;
    addCheer(t(lang, 'allDone'), 'ok');
  }
}

function onHint() {
  if (!active) return;
  let msg;
  const step = active.plan.steps[active.revealed - 1];
  if (hintLevel === 0 && step && step.tip) msg = step.tip;
  else if (hintLevel === 1) msg = t(lang, 'hintGeneric1');
  else msg = t(lang, 'hintGeneric2');
  hintLevel += 1;
  addMsg('tutor', '<p class="lead">' + I.bulb + ' ' + esc(t(lang, 'hintLead')) + '</p><p>' + esc(msg) + '</p>');
}

function onReveal() {
  if (!active || !active.plan.answer) return;
  active.stepEls.forEach((el) => { el.classList.add('revealed', 'done'); el.classList.remove('current'); });
  addMsg('tutor', (b) => {
    const l = document.createElement('p');
    l.className = 'lead';
    l.innerHTML = I.key + ' ' + esc(t(lang, 'revealLead'));
    b.appendChild(l);
    const ans = document.createElement('p');
    ans.style.marginTop = '8px';
    ans.innerHTML = '<strong>' + esc(active.plan.answer.value) + '</strong> — ' + esc(active.plan.answer.explanation);
    b.appendChild(ans);
    const cheer = document.createElement('p');
    cheer.style.marginTop = '8px';
    cheer.textContent = active.plan.answer.celebration;
    b.appendChild(cheer);
    const tail = document.createElement('p');
    tail.style.marginTop = '8px';
    tail.style.color = 'var(--muted)';
    tail.textContent = t(lang, 'tryAnother');
    b.appendChild(tail);
  });
  active = null;
}

function renderFallbackPlan() {
  const fb = STRINGS[lang].fallbackPlan;
  renderTurn({
    type: 'plan',
    subject: 'curio',
    intro: fb.intro,
    aid: null,
    steps: fb.steps.map((s) => ({ question: s.question, tip: s.tip, check: null })),
    answer: null,
  });
  addMsg('tutor', '<p>' + esc(fb.answerLine) + '</p>');
}

function showErrorBubble(retryText) {
  addMsg('tutor', (b) => {
    const p = document.createElement('p');
    p.className = 'err';
    p.textContent = t(lang, 'errorOnce');
    b.appendChild(p);
    const btn = document.createElement('button');
    btn.className = 'chip';
    btn.type = 'button';
    btn.style.marginTop = '8px';
    btn.textContent = t(lang, 'retry');
    btn.addEventListener('click', () => { btn.remove(); planFlow(retryText); });
    b.appendChild(btn);
  });
}

/* ------------------------------------------------ api calls */

async function planFlow(text) {
  if (busy) return;
  busy = true;
  const gen = session;
  active = null;
  const think = showThinking();
  try {
    const token = await getAuthToken();
    if (!token) { reopenGate(); return; }
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        message: text,
        history: history.slice(-10),
        lang,
        subject: forcedSubject,
        profileName: currentProfile ? currentProfile.name : null,
        ageBand: currentProfile ? currentProfile.ageBand : null,
      }),
    });
    if (res.status === 401) { reopenGate(); return; }
    if (!res.ok) {
      const err = new Error('http_' + res.status);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    if (gen !== session) return;
    failStreak = 0;
    history.push({ role: 'user', content: text });
    const plan = data.plan;
    if (plan.type === 'refusal') {
      addMsg('tutor', esc(plan.message));
      history.push({ role: 'assistant', content: plan.message });
    } else {
      history.push({ role: 'assistant', content: plan.intro });
      history = history.slice(-10);
      active = { question: text };
      if (!forcedSubject) highlightSubject(plan.subject);
      renderTurn(plan);
    }
    history = history.slice(-10);
  } catch (e) {
    if (gen !== session) return;
    failStreak += 1;
    if (failStreak >= 2) {
      failStreak = 0;
      renderFallbackPlan();
    } else if (e && e.status === 429) {
      addMsg('tutor', '<p class="err">' + esc(t(lang, 'rateLimited')) + '</p>');
    } else {
      showErrorBubble(text);
    }
  } finally {
    think.remove();
    busy = false;
  }
}

async function judgeFlow(text) {
  if (!active || !active.plan || !active.question) {
    await planFlow(text);
    return;
  }
  busy = true;
  const step = active.plan.steps[active.revealed - 1];
  const gen = session;
  const think = showThinking();
  try {
    const token = await getAuthToken();
    if (!token) { reopenGate(); return; }
    const res = await fetch('/api/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({
        question: active.question,
        stepQuestion: step.question,
        childAnswer: text,
        lang,
      }),
    });
    if (res.status === 401) { reopenGate(); return; }
    if (!res.ok) throw new Error('http_' + res.status);
    const data = await res.json();
    if (gen !== session) return;
    const judge = data.judge;
    if (judge.verdict === 'new_question') {
      busy = false;
      think.remove();
      await planFlow(text);
      return;
    }
    if (judge.verdict === 'correct') {
      addCheer(judge.praise || randomCheer(), 'ok');
      setTimeout(onNextStep, 350);
    } else {
      addMsg('tutor', '<p>' + esc(judge.feedback || t(lang, 'tryAgain')) + '</p>');
      addCheer(t(lang, 'tryAgain'), 'try');
    }
  } catch (e) {
    if (gen !== session) return;
    addCheer(t(lang, 'judgeFail'), 'try');
  } finally {
    think.remove();
    busy = false;
  }
}

/* ------------------------------------------------ user input */

function tryClientCheck(text) {
  const step = active.plan.steps[active.revealed - 1];
  if (!step || step.check === null || step.check === undefined) return false;
  if (checkAnswer(text, step.check)) {
    addCheer(randomCheer(), 'ok');
    setTimeout(onNextStep, 350);
  } else {
    addCheer(t(lang, 'tryAgain'), 'try');
    setTimeout(onHint, 350);
  }
  return true;
}

function handleUserText(text) {
  text = (text || '').trim();
  if (!text) return;
  if (busy) {
    input.value = text;
    $('#send').disabled = false;
    return;
  }
  addMsg('you', esc(text));
  if (active && active.plan) {
    if (tryClientCheck(text)) return;
    judgeFlow(text);
    return;
  }
  planFlow(text);
}

/* ------------------------------------------------ subject rail + i18n ui */

function highlightSubject(subject) {
  $$('#rail .subject').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.subject === subject));
  });
}

function renderRail() {
  const rail = $('#rail');
  rail.innerHTML = '';
  const title = document.createElement('span');
  title.className = 'rail-title';
  title.textContent = t(lang, 'railTitle');
  rail.appendChild(title);
  for (const s of SUBJECTS) {
    const btn = document.createElement('button');
    btn.className = 'subject';
    btn.dataset.subject = s;
    btn.type = 'button';
    btn.setAttribute('aria-pressed', String(s === forcedSubject));
    btn.innerHTML = '<span class="ic" aria-hidden="true">' + I[s] + '</span><span class="label">' + esc(subjectLabel(lang, s)) + '</span>';
    btn.addEventListener('click', () => {
      if (!$('#gamesView').hidden) setView(false);
      forcedSubject = s;
      highlightSubject(s);
      input.placeholder = placeholderFor(lang, s);
      renderSuggests(s);
    });
    rail.appendChild(btn);
  }
  const gbtn = document.createElement('button');
  gbtn.className = 'subject';
  gbtn.dataset.subject = 'games';
  gbtn.type = 'button';
  gbtn.setAttribute('aria-pressed', String($('#gamesView').hidden ? false : true));
  gbtn.innerHTML = '<span class="ic" aria-hidden="true">' + I.games + '</span><span class="label">' + esc(t(lang, 'gamesLabel')) + '</span>';
  gbtn.addEventListener('click', toggleGames);
  rail.appendChild(gbtn);
}

function renderSuggests(subject) {
  const box = $('#suggests');
  box.innerHTML = '';
  for (const s of suggestsFor(lang, subject)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = s;
    b.addEventListener('click', () => handleUserText(s));
    box.appendChild(b);
  }
}

function setView(games) {
  $('#chatView').hidden = games;
  $('#gamesView').hidden = !games;
  if (games) {
    highlightSubject(null);
    showGames(currentProfile ? currentProfile.id : 'guest', lang, () => setView(false));
  } else {
    hideGames();
    highlightSubject(forcedSubject);
  }
  const gb = $('#rail .subject[data-subject="games"]');
  if (gb) gb.setAttribute('aria-pressed', String(games));
}

function toggleGames() { setView($('#gamesView').hidden); }

function applyLang() {
  document.documentElement.lang = lang;
  $('#tagline').textContent = t(lang, 'tagline');
  $('#resetLabel').textContent = t(lang, 'startOver');
  $('#langToggle').textContent = t(lang, 'langToggle');
  $('#langToggle').setAttribute('aria-label', t(lang, 'langAria'));
  $('#rail').setAttribute('aria-label', t(lang, 'railTitle'));
  $('#input').setAttribute('aria-label', t(lang, 'inputLabel'));
  $('#send').setAttribute('aria-label', t(lang, 'sendAria'));
  input.placeholder = forcedSubject ? placeholderFor(lang, forcedSubject) : t(lang, 'inputPlaceholder');
  renderRail();
  renderSuggests(forcedSubject);
  refreshGames(lang);
}

function welcome() {
  addMsg('tutor', (b) => {
    const badge = document.createElement('div');
    badge.className = 'welcome-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML = HERO_BADGE;
    b.appendChild(badge);

    const lead = document.createElement('p');
    lead.className = 'lead';
    lead.textContent = t(lang, 'welcomeLead');
    b.appendChild(lead);
    const body = document.createElement('p');
    body.style.marginTop = '8px';
    body.innerHTML = STRINGS[lang].welcomeBody;
    b.appendChild(body);
    const chips = document.createElement('div');
    chips.className = 'chips';
    for (const s of SUBJECTS) {
      const c = document.createElement('button');
      c.className = 'chip';
      c.type = 'button';
      c.innerHTML = I[s] + esc(subjectLabel(lang, s));
      c.addEventListener('click', () => {
        forcedSubject = s;
        highlightSubject(s);
        input.placeholder = placeholderFor(lang, s);
        renderSuggests(s);
      });
      chips.appendChild(c);
    }
    const gc = document.createElement('button');
    gc.className = 'chip';
    gc.type = 'button';
    gc.innerHTML = I.games + esc(t(lang, 'gamesLabel'));
    gc.addEventListener('click', () => setView(true));
    chips.appendChild(gc);
    b.appendChild(chips);
  });
}

function init() {
  $('#send').innerHTML = I.send;
  $('#send').disabled = true;
  $('#langToggle').addEventListener('click', () => {
    lang = lang === 'vi' ? 'en' : 'vi';
    localStorage.setItem('kidgpt-lang', lang);
    applyLang();
  });
  $('#reset').addEventListener('click', () => {
    session += 1;
    stream.innerHTML = '';
    active = null;
    forcedSubject = null;
    history = [];
    hintLevel = 0;
    failStreak = 0;
    highlightSubject(null);
    welcome();
    renderSuggests(null);
    input.placeholder = t(lang, 'inputPlaceholder');
  });
  $('#composer').addEventListener('submit', (e) => {
    e.preventDefault();
    const v = input.value;
    input.value = '';
    input.style.height = 'auto';
    $('#send').disabled = true;
    handleUserText(v);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      $('#composer').requestSubmit();
    }
  });
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
    $('#send').disabled = !input.value.trim();
  });
  applyLang();
  initGate({
    onUnlock: (profile) => {
      // gate có thể đã đổi ngôn ngữ qua nút EN/VI — đồng bộ vào app
      const gateLang = resolveLang(document.documentElement.lang === 'vi' ? 'vi' : 'en');
      if (gateLang !== lang) {
        lang = gateLang;
        applyLang();
      }
      const changed = currentProfile && currentProfile.id !== profile.id;
      currentProfile = profile;
      const chip = $('#profileChip');
      chip.hidden = false;
      $('#profileChipName').textContent = profile.name;
      chip.onclick = () => reopenGate();
      if (changed || stream.children.length === 0) {
        if (!$('#gamesView').hidden) setView(false);
        session += 1;
        stream.innerHTML = '';
        active = null;
        forcedSubject = null;
        history = [];
        hintLevel = 0;
        failStreak = 0;
        highlightSubject(null);
        welcome();
        renderSuggests(null);
        input.placeholder = t(lang, 'inputPlaceholder');
      }
    },
  });
}

init();
