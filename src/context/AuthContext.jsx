import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser, syncUserProfile } from '../firebase.js';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await syncUserProfile(currentUser);
          setUserProfile(profile);
        } catch (err) {
          console.warn('Could not sync user profile with Firestore:', err);
          setUserProfile({
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            providerId: currentUser.providerData?.[0]?.providerId || 'google.com',
          });
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    setAuthError(null);
    try {
      const loggedUser = await loginWithGoogle();
      const profile = await syncUserProfile(loggedUser);
      setUserProfile(profile);
    } catch (err) {
      console.error('Sign-in failed:', err);
      if (err.code === 'auth/popup-blocked') {
        setAuthError(
          'Popup window was blocked by your browser. Please allow popups for this site and try again.'
        );
      } else if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Sign-in cancelled by user.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignored
      } else {
        setAuthError(err.message || 'Authentication failed. Please try again.');
      }
    }
  };

  const signOut = async () => {
    try {
      await logoutUser();
      setUser(null);
      setUserProfile(null);
      setIsProfileOpen(false);
    } catch (err) {
      console.error('Sign-out failed:', err);
      setAuthError(err.message || 'Sign out failed.');
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        authError,
        signIn,
        signOut,
        isProfileOpen,
        setIsProfileOpen,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
