import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js';
import {
  GoogleAuthProvider, getAuth, signInWithPopup, signOut, onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js';
import {
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
  query, orderBy, serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { FIREBASE_CONFIG } from './firebase-config.js';

export const MAX_PROFILES = 5;

let app = null;
let authInst = null;
let db = null;

export function isFirebaseConfigured() {
  const values = [FIREBASE_CONFIG.apiKey, FIREBASE_CONFIG.authDomain, FIREBASE_CONFIG.projectId, FIREBASE_CONFIG.appId];
  return values.every((v) => typeof v === 'string' && v.length > 0 && !/^YOUR_/.test(v));
}

function init() {
  if (!app) {
    app = initializeApp(FIREBASE_CONFIG);
    authInst = getAuth(app);
    db = getFirestore(app);
  }
}

export async function signInWithGoogle() {
  init();
  const provider = new GoogleAuthProvider();
  await signInWithPopup(authInst, provider);
}

export async function signOutGoogle() {
  init();
  await signOut(authInst);
}

export function watchAuth(cb) {
  init();
  return onAuthStateChanged(authInst, cb);
}

export async function getAuthToken() {
  init();
  return authInst.currentUser ? authInst.currentUser.getIdToken() : null;
}

function profilesRef(uid) {
  return collection(db, 'users', uid, 'profiles');
}

export async function listProfiles(uid) {
  init();
  const snap = await getDocs(query(profilesRef(uid), orderBy('createdAt', 'asc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function createProfile(uid, { name, ageBand }) {
  init();
  const existing = await listProfiles(uid);
  if (existing.length >= MAX_PROFILES) throw new Error('profiles_max');
  const cleanName = String(name).trim().slice(0, 20);
  const color = existing.length % 8;
  const ref = await addDoc(profilesRef(uid), {
    name: cleanName,
    ageBand,
    color,
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, name: cleanName, ageBand, color };
}

export async function updateProfile(uid, id, { name, ageBand }) {
  init();
  await updateDoc(doc(db, 'users', uid, 'profiles', id), {
    name: String(name).trim().slice(0, 20),
    ageBand,
  });
}

export async function deleteProfile(uid, id) {
  init();
  await deleteDoc(doc(db, 'users', uid, 'profiles', id));
}
