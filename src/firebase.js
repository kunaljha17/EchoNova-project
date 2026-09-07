import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App instance safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with named database support
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

/**
 * Perform Google OAuth Popup Sign-In
 */
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await syncUserProfile(user);
    return user;
  } catch (error) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

/**
 * Sign out of current Firebase session
 */
export async function logoutUser() {
  try {
    await fbSignOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
}

/**
 * Synchronize user profile into Firestore users collection
 */
export async function syncUserProfile(user) {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  const profileData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || 'Forensic Analyst',
    photoURL: user.photoURL || null,
    providerId: user.providerData?.[0]?.providerId || 'google.com',
    lastLoginAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    await setDoc(userRef, {
      ...profileData,
      createdAt: serverTimestamp(),
      role: 'Forensic Investigator',
    });
  } else {
    await setDoc(
      userRef,
      {
        email: user.email,
        displayName: user.displayName || snap.data().displayName || 'Forensic Analyst',
        photoURL: user.photoURL || snap.data().photoURL,
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  return profileData;
}

/**
 * Save a forensic audio scan record to Firestore
 */
export async function saveScanRecord(uid, scan) {
  try {
    const scanRef = doc(db, 'users', uid, 'scans', scan.id);
    await setDoc(scanRef, {
      ...scan,
      savedAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Error saving scan to Firestore:', err);
  }
}

/**
 * Delete a forensic audio scan record from Firestore
 */
export async function deleteScanRecord(uid, scanId) {
  try {
    const scanRef = doc(db, 'users', uid, 'scans', scanId);
    await deleteDoc(scanRef);
  } catch (err) {
    console.error('Error deleting scan from Firestore:', err);
  }
}

/**
 * Subscribe to real-time user scan history
 */
export function subscribeUserScans(uid, onScansUpdate) {
  const scansCol = collection(db, 'users', uid, 'scans');
  const q = query(scansCol);

  return onSnapshot(
    q,
    (snapshot) => {
      const loadedScans = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        loadedScans.push({
          ...data,
          id: docSnap.id,
        });
      });
      onScansUpdate(loadedScans);
    },
    (err) => {
      console.warn('Firestore onSnapshot subscription warning:', err);
    }
  );
}

/**
 * Persist user settings to Firestore
 */
export async function saveUserSettingsToCloud(uid, settings) {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { settings }, { merge: true });
  } catch (err) {
    console.error('Failed to persist user settings:', err);
  }
}

/**
 * Load user settings from Firestore
 */
export async function loadUserSettingsFromCloud(uid) {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists() && snap.data().settings) {
      return snap.data().settings;
    }
  } catch (err) {
    console.error('Failed to load user settings:', err);
  }
  return null;
}

/**
 * Save a transcript item into Firestore
 */
export async function saveTranscriptRecord(uid, transcript) {
  try {
    const transcriptRef = doc(db, 'users', uid, 'transcripts', transcript.id);
    await setDoc(transcriptRef, {
      id: transcript.id,
      text: transcript.text,
      model: transcript.model || 'gemini-3.5-transcribe',
      duration: transcript.duration,
      wordCount: transcript.wordCount,
      timestamp: serverTimestamp(),
      language: transcript.language || 'auto-detected',
    });
  } catch (err) {
    console.error('Failed to save transcript to Firestore:', err);
  }
}

/**
 * Subscribe to user's transcripts from Firestore
 */
export function subscribeUserTranscripts(uid, onUpdate) {
  const transcriptsCol = collection(db, 'users', uid, 'transcripts');
  const q = query(transcriptsCol);

  return onSnapshot(
    q,
    (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          text: data.text || '',
          model: data.model || 'gemini-3.5-transcribe',
          duration: data.duration || '0:00',
          wordCount: data.wordCount || 0,
          timestamp: data.timestamp?.toDate
            ? data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Recent',
          language: data.language || 'English',
        });
      });
      onUpdate(items);
    },
    (err) => {
      console.warn('Firestore transcripts subscription warning:', err);
    }
  );
}

/**
 * Delete a transcript from Firestore
 */
export async function deleteTranscriptRecord(uid, transcriptId) {
  try {
    const transcriptRef = doc(db, 'users', uid, 'transcripts', transcriptId);
    await deleteDoc(transcriptRef);
  } catch (err) {
    console.error('Failed to delete transcript:', err);
  }
}
