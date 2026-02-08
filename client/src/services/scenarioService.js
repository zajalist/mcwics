// ── Firestore Service Layer ─────────────────────────────────
// CRUD for user-deployed scenarios stored in Firestore.
//
// Collection: "scenarios"
// Document schema:
//   - uid:          string  (owner's Firebase UID)
//   - authorName:   string  (display name snapshot)
//   - title:        string
//   - description:  string
//   - visibility:   'public' | 'private'
//   - scenarioJson: object  (the full scenario JSON)
//   - createdAt:    Timestamp
//   - updatedAt:    Timestamp

import {
  collection, doc,
  addDoc, updateDoc, deleteDoc, getDoc, getDocs,
  query, where, orderBy, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

const COL = 'scenarios';

/* ── Strip undefined values (Firestore rejects them) ───── */
function stripUndefined(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* ── Deploy (create new) ─────────────────────────────────── */
export async function deployScenario({ uid, authorName, title, description, visibility, scenarioJson }) {
  const ref = await addDoc(collection(db, COL), {
    uid,
    authorName: authorName || 'Anonymous',
    title:       title       || scenarioJson.scenarios?.[0]?.title || 'Untitled',
    description: description || scenarioJson.scenarios?.[0]?.description || '',
    visibility:  visibility  || 'private',
    scenarioJson: stripUndefined(scenarioJson),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/* ── Update existing ─────────────────────────────────────── */
export async function updateScenario(docId, { title, description, visibility, scenarioJson }) {
  const updates = { updatedAt: serverTimestamp() };
  if (title       !== undefined) updates.title       = title;
  if (description  !== undefined) updates.description  = description;
  if (visibility   !== undefined) updates.visibility   = visibility;
  if (scenarioJson !== undefined) updates.scenarioJson = stripUndefined(scenarioJson);
  await updateDoc(doc(db, COL, docId), updates);
}

/* ── Delete ──────────────────────────────────────────────── */
export async function deleteScenario(docId) {
  await deleteDoc(doc(db, COL, docId));
}

/* ── Get single ──────────────────────────────────────────── */
export async function getScenario(docId) {
  const snap = await getDoc(doc(db, COL, docId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/* ── Fork (copy someone else's public scenario) ─────────── */
export async function forkScenario({ originalDocId, uid, authorName, scenarioJson }) {
  const ref = await addDoc(collection(db, COL), {
    uid,
    authorName: authorName || 'Anonymous',
    title:       scenarioJson.scenarios?.[0]?.title ? `${scenarioJson.scenarios[0].title} (remix)` : 'Forked Scenario',
    description: scenarioJson.scenarios?.[0]?.description || '',
    visibility:  'private',
    forkedFrom:  originalDocId,
    scenarioJson: stripUndefined(scenarioJson),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

/* ── List public scenarios ───────────────────────────────── */
export async function listPublicScenarios() {
  try {
    const q = query(
      collection(db, COL),
      where('visibility', '==', 'public'),
      orderBy('updatedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    // Fallback: query without orderBy (composite index may not exist yet)
    console.warn('Ordered query failed, falling back:', err.message);
    const q = query(
      collection(db, COL),
      where('visibility', '==', 'public'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
}

/* ── List user's own scenarios ───────────────────────────── */
export async function listMyScenarios(uid) {
  try {
    const q = query(
      collection(db, COL),
      where('uid', '==', uid),
      orderBy('updatedAt', 'desc'),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    // Fallback: query without orderBy (composite index may not exist yet)
    console.warn('Ordered query failed, falling back:', err.message);
    const q = query(
      collection(db, COL),
      where('uid', '==', uid),
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
}
