import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { ScanHistoryItem, ProtectionSettings, TranscriptItem } from './types';

// Initialize Firebase App instance safely
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Initialize Firestore with named database support
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export interface UserProfileData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  providerId: string;
  createdAt?: any;
  lastLoginAt?: any;
  role?: string;
}

/**
 * Perform Google OAuth Popup Sign-In
 */
export async function loginWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await syncUserProfile(user);
    return user;
  } catch (error: any) {
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

/**
 * Sign out of current Firebase session
 */
export async function logoutUser(): Promise<void> {
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
export async function syncUserProfile(user: User): Promise<UserProfileData> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  const profileData: UserProfileData = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || 'Forensic Analyst',
    photoURL: user.photoURL || null,
    providerId: user.providerData?.[0]?.providerId || 'google.com',
    lastLoginAt: serverTimestamp(),
  };

  if (!snap.exists()) {
    // New user initial profile setup
    await setDoc(userRef, {
      ...profileData,
      createdAt: serverTimestamp(),
      role: 'Forensic Investigator',
    });
  } else {
    // Update existing user doc
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
export async function saveScanRecord(uid: string, scan: ScanHistoryItem): Promise<void> {
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
export async function deleteScanRecord(uid: string, scanId: string): Promise<void> {
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
export function subscribeUserScans(
  uid: string,
  onScansUpdate: (scans: ScanHistoryItem[]) => void
): () => void {
  const scansCol = collection(db, 'users', uid, 'scans');
  const q = query(scansCol);

  return onSnapshot(
    q,
    (snapshot) => {
      const loadedScans: ScanHistoryItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as ScanHistoryItem;
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
export async function saveUserSettingsToCloud(
  uid: string,
  settings: ProtectionSettings
): Promise<void> {
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
export async function loadUserSettingsFromCloud(
  uid: string
): Promise<ProtectionSettings | null> {
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists() && snap.data().settings) {
      return snap.data().settings as ProtectionSettings;
    }
  } catch (err) {
    console.error('Failed to load user settings:', err);
  }
  return null;
}

/**
 * Save a transcript item into Firestore
 */
export async function saveTranscriptRecord(
  uid: string,
  transcript: TranscriptItem
): Promise<void> {
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
export function subscribeUserTranscripts(
  uid: string,
  onUpdate: (transcripts: TranscriptItem[]) => void
) {
  const transcriptsCol = collection(db, 'users', uid, 'transcripts');
  const q = query(transcriptsCol);

  return onSnapshot(
    q,
    (snapshot) => {
      const items: TranscriptItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as any;
        items.push({
          id: docSnap.id,
          text: data.text || '',
          model: data.model || 'gemini-3.5-transcribe',
          duration: data.duration || '0:00',
          wordCount: data.wordCount || 0,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
          language: data.language || 'English',
        });
      });
      // Sort newest first
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
export async function deleteTranscriptRecord(
  uid: string,
  transcriptId: string
): Promise<void> {
  try {
    const transcriptRef = doc(db, 'users', uid, 'transcripts', transcriptId);
    await deleteDoc(transcriptRef);
  } catch (err) {
    console.error('Failed to delete transcript:', err);
  }
}

