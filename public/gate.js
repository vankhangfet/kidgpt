import { esc } from './util.js';
import { t } from './i18n.js';
import {
  starSvg, cloudSvg, HILLS, SPARKLE_MASCOT, HERO_BADGE, HERO_BADGE_SAD,
  BUDDY_ROBOT, BUDDY_OWL, GOOGLE_ICON, SPINNER, BRAND_MARK,
  ICON_SHIELD, ICON_CHECK, ICON_LOCK, ICON_NOTE, ICON_GAMES, ICON_PERSON, ICON_BOOK, ICON_ATOM,
} from './gate-art.js';
import {
  isFirebaseConfigured, signInWithGoogle, signOutGoogle, watchAuth,
  listProfiles, createProfile, updateProfile, deleteProfile, MAX_PROFILES,
} from './auth.js';

const PROFILE_COLORS = ['#f5876f', '#f2b04c', '#8bc34a', '#4dc3b5', '#5aa0e8', '#9a7fe8', '#e87fb4', '#7ad0c8'];

let gateEl = null;
let onUnlock = null;
let currentUser = null;
let editingId = null; // null = đang tạo mới; string = đang sửa profile đó
let currentLang = () => (document.documentElement.lang === 'en' ? 'en' : 'vi');

export function initGate(callbacks) {
  onUnlock = callbacks.onUnlock;
  gateEl = document.getElementById('gate');
  gateEl.innerHTML = '<div class="g-dots" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>'
    + '<div class="g-screens"></div>';
  if (!isFirebaseConfigured()) {
    renderConfigError();
    return;
  }
  watchAuth(async (user) => {
    currentUser = user;
    if (!user) { renderLogin(); return; }
    await route();
  });
}

export function reopenGate() {
  if (currentUser) route();
}

async function route() {
  if (!currentUser) { renderLogin(); return; }
  try {
    const profiles = await listProfiles(currentUser.uid);
    if (!profiles.length) renderManager(profiles, true);
    else renderPicker(profiles);
  } catch (e) {
    renderLoadError();
  }
}

function renderLoadError() {
  const lang = currentLang();
  show(
    '<div class="gate-card">' +
      HERO_BADGE_SAD +
      '<p class="gate-body">' + esc(t(lang, 'actionError')) + '</p>' +
      '<div class="gate-actions"><button class="btn-ghost" id="gate-retry" type="button">' + esc(t(lang, 'retry')) + '</button></div>' +
    '</div>');
  document.getElementById('gate-retry').addEventListener('click', () => route());
}

function renderConfigError() {
  show('<div class="gate-card">' + HERO_BADGE_SAD + '<p class="gate-body">' +
    esc(t(currentLang(), 'gateConfigError')) + '</p></div>');
}

function renderLogin() {
  const lang = currentLang();
  show(
    '<main class="g-auth" aria-label="KidGPT">' +
      '<section class="g-world">' +
        '<div class="g-sky" aria-hidden="true"><span class="g-sun"></span>' +
          starSvg('s1') + starSvg('s2') + starSvg('s3') + starSvg('s4') +
          cloudSvg('c1') + cloudSvg('c2') + cloudSvg('c3') + HILLS + '</div>' +
        '<div class="g-brand"><span class="g-brand-mark" aria-hidden="true">' + BRAND_MARK + '</span>' +
          '<span class="g-brand-name">Kid<span>GPT</span></span></div>' +
        '<div class="g-stage" aria-hidden="true">' +
          '<span class="g-token t1">7</span>' +
          '<span class="g-token t2">' + ICON_BOOK + '</span>' +
          '<span class="g-token t3">' + ICON_ATOM + '</span>' +
          '<span class="g-token t4">A</span>' +
          BUDDY_ROBOT + BUDDY_OWL + SPARKLE_MASCOT +
        '</div>' +
        '<div class="g-copy">' +
          '<span class="g-eyebrow">' + esc(t(lang, 'signInEyebrow')) + '</span>' +
          '<h1>' + t(lang, 'signInH1') + '</h1>' +
          '<p class="g-lede">' + esc(t(lang, 'signInLede')) + '</p>' +
          '<div class="g-trust">' +
            '<span class="tchip"><span aria-hidden="true">' + ICON_SHIELD + '</span>' + esc(t(lang, 'trustSafe')) + '</span>' +
            '<span class="tchip"><span aria-hidden="true">' + ICON_CHECK + '</span>' + esc(t(lang, 'trustParent')) + '</span>' +
            '<span class="tchip"><span aria-hidden="true">' + ICON_LOCK + '</span>' + esc(t(lang, 'trustPrivate')) + '</span>' +
          '</div>' +
        '</div>' +
      '</section>' +
      '<section class="g-panel">' +
        '<div class="g-hero">' + HERO_BADGE +
          '<h2>' + esc(t(lang, 'signInTitle')) + '</h2>' +
          '<p>' + esc(t(lang, 'signInBody')) + '</p></div>' +
        '<button class="g-google" id="gate-signin" type="button" data-state="idle">' +
          GOOGLE_ICON + SPINNER +
          '<span id="gate-signin-label">' + esc(t(lang, 'signInButton')) + '</span></button>' +
        '<p class="gate-privacy gate-error" id="gate-signin-error" hidden></p>' +
        '<div class="g-safe"><span aria-hidden="true">' + ICON_SHIELD + '</span>' + esc(t(lang, 'signInSafe')) + '</div>' +
        '<ul class="g-benefits">' +
          '<li><span class="g-ico i1" aria-hidden="true">' + ICON_NOTE + '</span>' +
            '<span><strong>' + esc(t(lang, 'benefit1T')) + '</strong><span class="b-d">' + esc(t(lang, 'benefit1D')) + '</span></span></li>' +
          '<li><span class="g-ico i2" aria-hidden="true">' + ICON_GAMES + '</span>' +
            '<span><strong>' + esc(t(lang, 'benefit2T')) + '</strong><span class="b-d">' + esc(t(lang, 'benefit2D')) + '</span></span></li>' +
          '<li><span class="g-ico i3" aria-hidden="true">' + ICON_PERSON + '</span>' +
            '<span><strong>' + esc(t(lang, 'benefit3T')) + '</strong><span class="b-d">' + esc(t(lang, 'benefit3D')) + '</span></span></li>' +
        '</ul>' +
        '<p class="g-foot"><b>' + esc(t(lang, 'gateFoot')) + '</b></p>' +
      '</section>' +
    '</main>');
  const btn = document.getElementById('gate-signin');
  const label = document.getElementById('gate-signin-label');
  const errEl = document.getElementById('gate-signin-error');
  btn.addEventListener('click', async () => {
    if (btn.dataset.state !== 'idle') return;
    btn.dataset.state = 'loading';
    label.textContent = t(lang, 'signInConnecting');
    errEl.textContent = '';
    errEl.hidden = true;
    try {
      await signInWithGoogle(); // thành công: watchAuth tự re-render gate
    } catch (e) {
      const code = (e && e.code) || '';
      if (!code.includes('popup-closed-by-user') && !code.includes('cancelled-popup-request')) {
        errEl.textContent = t(lang, 'signInError');
        errEl.hidden = false;
      }
    } finally {
      btn.dataset.state = 'idle';
      label.textContent = t(lang, 'signInButton');
    }
  });
}

function profileCard(p, lang) {
  const color = PROFILE_COLORS[p.color % 8] || PROFILE_COLORS[0];
  const initials = esc(String(p.name || '?').trim().slice(0, 2).toUpperCase() || '?');
  return '<button class="profile-card" type="button" data-id="' + esc(p.id) + '" style="--pc:' + color + '">' +
    '<span class="profile-avatar" aria-hidden="true">' + initials + '</span>' +
    '<span class="profile-name">' + esc(p.name) + '</span>' +
    '<span class="profile-band">' + esc(t(lang, p.ageBand === '6-8' ? 'ageBand6to8' : 'ageBand9to12')) + '</span>' +
  '</button>';
}

function renderPicker(profiles) {
  const lang = currentLang();
  show(
    '<div class="gate-card gate-wide">' +
      HERO_BADGE +
      '<h2 class="gate-title">' + esc(t(lang, 'chooseProfile')) + '</h2>' +
      '<p class="gate-body">' + esc(t(lang, 'chooseProfileLead')) + '</p>' +
      '<div class="profile-grid">' + profiles.map((p) => profileCard(p, lang)).join('') + '</div>' +
      '<div class="gate-actions">' +
        '<button class="btn-ghost" id="gate-manage" type="button">' + esc(t(lang, 'manageProfiles')) + '</button>' +
        '<button class="btn-ghost" id="gate-logout" type="button">' + esc(t(lang, 'signOut')) + '</button>' +
      '</div>' +
    '</div>');
  gateEl.querySelectorAll('.profile-card').forEach((card) => {
    card.addEventListener('click', () => {
      const p = profiles.find((x) => x.id === card.dataset.id);
      try { localStorage.setItem('kidgpt-profile:' + currentUser.uid, p.id); } catch (e) { /* private mode */ }
      if (onUnlock) onUnlock(p);
      hide();
    });
  });
  document.getElementById('gate-manage').addEventListener('click', async () => {
    renderManager(await listProfiles(currentUser.uid));
  });
  document.getElementById('gate-logout').addEventListener('click', async () => {
    try { await signOutGoogle(); } catch (e) { /* giữ màn picker */ }
  });
}

function bandButtons(lang, selected) {
  const mk = (band, key) =>
    '<button class="age-band-btn' + (selected === band ? ' selected' : '') + '" type="button" data-band="' + band + '">' +
    (band === '6-8' ? '🌱 ' : '🚀 ') + esc(t(lang, key)) + '</button>';
  return mk('6-8', 'ageBand6to8') + mk('9-12', 'ageBand9to12');
}

function renderManager(profiles, firstTime, errorMsg) {
  const lang = currentLang();
  editingId = null;
  show(
    '<div class="gate-card gate-wide">' +
      (errorMsg ? '<p class="gate-privacy gate-error">' + esc(errorMsg) + '</p>' : '') +
      HERO_BADGE +
      '<h2 class="gate-title">' + esc(t(lang, firstTime ? 'addProfile' : 'manageProfiles')) + '</h2>' +
      (profiles.length
        ? '<div class="profile-list">' + profiles.map((p) =>
            '<div class="profile-row" style="--pc:' + (PROFILE_COLORS[p.color % 8] || PROFILE_COLORS[0]) + '">' +
              '<span class="profile-row-name">' + esc(p.name) + '</span>' +
              '<span class="profile-row-band">' + esc(t(lang, p.ageBand === '6-8' ? 'ageBand6to8' : 'ageBand9to12')) + '</span>' +
              '<button class="chip" data-edit="' + esc(p.id) + '" type="button">' + esc(t(lang, 'editProfile')) + '</button>' +
              '<button class="chip chip-danger" data-del="' + esc(p.id) + '" type="button">' + esc(t(lang, 'deleteProfile')) + '</button>' +
            '</div>').join('') + '</div>'
        : '') +
      (profiles.length >= MAX_PROFILES
        ? '<p class="gate-body">' + esc(t(lang, 'profilesMax')) + '</p>'
        : '<form id="gate-form" class="profile-form">' +
            '<p class="gate-privacy gate-error" id="gate-form-error" hidden></p>' +
            '<label class="field"><span class="form-label">' + esc(t(lang, 'profileNameLabel')) + '</span>' +
            '<input id="gate-name" type="text" maxlength="20" placeholder="' + esc(t(lang, 'profileNamePlaceholder')) + '" /></label>' +
            '<div class="form-label">' + esc(t(lang, 'ageBandLabel')) + '</div>' +
            '<div class="age-band-row" id="gate-bands">' + bandButtons(lang, '6-8') + '</div>' +
            '<button class="send gate-save" type="submit">' + esc(t(lang, 'saveProfile')) + '</button>' +
          '</form>') +
      (profiles.length && !firstTime
        ? '<div class="gate-actions"><button class="btn-ghost" id="gate-back" type="button">' + esc(t(lang, 'switchProfile')) + '</button></div>'
        : '') +
    '</div>');

  let band = '6-8';
  const bandsEl = gateEl.querySelector('#gate-bands');
  if (bandsEl) {
    bandsEl.querySelectorAll('.age-band-btn').forEach((b) => {
      b.addEventListener('click', () => {
        band = b.dataset.band;
        bandsEl.querySelectorAll('.age-band-btn').forEach((x) => x.classList.toggle('selected', x === b));
      });
    });
  }
  const form = gateEl.querySelector('#gate-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errEl = gateEl.querySelector('#gate-form-error');
      errEl.textContent = '';
      errEl.hidden = true;
      const name = (gateEl.querySelector('#gate-name').value || '').trim();
      if (!name) return;
        const saveBtn = form.querySelector('.gate-save');
        saveBtn.disabled = true;
        try {
        if (editingId) {
          await updateProfile(currentUser.uid, editingId, { name, ageBand: band });
        } else {
          await createProfile(currentUser.uid, { name, ageBand: band });
        }
        renderManager(await listProfiles(currentUser.uid), false);
      } catch (err2) {
        errEl.textContent = t(lang, 'actionError');
        errEl.hidden = false;
        saveBtn.disabled = false;
      }
    });
  }
  gateEl.querySelectorAll('[data-del]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await deleteProfile(currentUser.uid, btn.dataset.del);
        localStorage.removeItem('kidgpt-profile:' + currentUser.uid);
        renderManager(await listProfiles(currentUser.uid), false);
      } catch (err2) {
        renderManager(await listProfiles(currentUser.uid), false, t(lang, 'actionError'));
      }
    });
  });
  gateEl.querySelectorAll('[data-edit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const p = profiles.find((x) => x.id === btn.dataset.edit);
      editingId = p.id;
      const formEl = gateEl.querySelector('#gate-form');
      if (!formEl) return;
      gateEl.querySelector('#gate-name').value = p.name;
      band = p.ageBand;
      gateEl.querySelector('#gate-bands').querySelectorAll('.age-band-btn').forEach((x) => {
        x.classList.toggle('selected', x.dataset.band === p.ageBand);
      });
    });
  });
  const back = gateEl.querySelector('#gate-back');
  if (back) back.addEventListener('click', async () => renderPicker(await listProfiles(currentUser.uid)));
}

function show(html) {
  const screens = gateEl.querySelector('.g-screens');
  screens.innerHTML = html;
  gateEl.hidden = false;
  const app = document.querySelector('.app');
  if (app && 'inert' in app) app.inert = true;
  const first = gateEl.querySelector('button');
  if (first) first.focus();
}
function hide() {
  gateEl.hidden = true;
  const screens = gateEl.querySelector('.g-screens');
  if (screens) screens.innerHTML = '';
  const app = document.querySelector('.app');
  if (app && 'inert' in app) app.inert = false;
}
