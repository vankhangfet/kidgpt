import { esc } from './util.js';
import { t } from './i18n.js';
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
  const profiles = await listProfiles(currentUser.uid);
  if (!profiles.length) renderManager(profiles, true);
  else renderPicker(profiles);
}

function renderConfigError() {
  show('<div class="gate-card"><h2 class="gate-title">⚠️</h2><p class="gate-body">' +
    esc(t(currentLang(), 'gateConfigError')) + '</p></div>');
}

function renderLogin() {
  const lang = currentLang();
  show(
    '<div class="gate-card">' +
      '<div class="gate-logo" aria-hidden="true">✨</div>' +
      '<h2 class="gate-title">' + esc(t(lang, 'signInTitle')) + '</h2>' +
      '<p class="gate-body">' + esc(t(lang, 'signInBody')) + '</p>' +
      '<button class="btn-google" id="gate-signin" type="button">' +
        '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="#4285F4" d="M23 12.2c0-.8-.1-1.6-.2-2.3H12v4.4h6.2c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.2-2 3.4-5 3.4-8.3z"/><path fill="#34A853" d="M12 24c3.1 0 5.8-1 7.7-2.8l-3.7-2.8c-1 .7-2.3 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9H1.6v2.9C3.6 21.3 7.5 24 12 24z"/><path fill="#FBBC05" d="M5.4 14.6c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V7.1H1.6C.6 8.9 0 10.9 0 12.3s.6 3.4 1.6 5.2l3.8-2.9z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.3-3.3C17.9 1.2 15.1 0 12 0 7.5 0 3.6 2.7 1.6 6.6l3.8 2.9c.9-2.8 3.5-4.7 6.6-4.7z"/></svg>' +
        '<span>' + esc(t(lang, 'signInButton')) + '</span>' +
      '</button>' +
      '<p class="gate-privacy gate-error" id="gate-signin-error" hidden></p>' +
      '<p class="gate-privacy">' + esc(t(lang, 'signInPrivacy')) + '</p>' +
    '</div>');
  document.getElementById('gate-signin').addEventListener('click', async () => {
    const errEl = document.getElementById('gate-signin-error');
    errEl.textContent = '';
    errEl.hidden = true;
    try {
      await signInWithGoogle();
    } catch (e) {
      const code = (e && e.code) || '';
      if (!code.includes('popup-closed-by-user') && !code.includes('cancelled-popup-request')) {
        errEl.textContent = t(lang, 'signInError');
        errEl.hidden = false;
      }
    }
  });
}

function profileCard(p, lang) {
  const color = PROFILE_COLORS[p.color % 8];
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
      localStorage.setItem('kidgpt-profile:' + currentUser.uid, p.id);
      hide();
      onUnlock(p);
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
      '<h2 class="gate-title">' + esc(t(lang, firstTime ? 'addProfile' : 'manageProfiles')) + '</h2>' +
      (profiles.length
        ? '<div class="profile-list">' + profiles.map((p) =>
            '<div class="profile-row" style="--pc:' + PROFILE_COLORS[p.color % 8] + '">' +
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
  gateEl.innerHTML = html;
  gateEl.hidden = false;
}
function hide() {
  gateEl.hidden = true;
  gateEl.innerHTML = '';
}
