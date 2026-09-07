import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ScanHistoryItem } from '../types';

interface ProfileModalProps {
  scansCount: number;
  onNavigateToScans?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ scansCount, onNavigateToScans }) => {
  const {
    user,
    userProfile,
    loading,
    authError,
    signIn,
    signOut,
    isProfileOpen,
    setIsProfileOpen,
    clearAuthError,
  } = useAuth();

  if (!isProfileOpen) return null;

  const displayName = userProfile?.displayName || user?.displayName || 'Investigator';
  const email = userProfile?.email || user?.email || 'No email associated';
  const photoURL = userProfile?.photoURL || user?.photoURL;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-[#171c22] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-[#0f141a]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#54e98a] text-[20px]">
              badge
            </span>
            <h3 className="font-headline-sm text-[16px] text-[#dee3eb] font-semibold">
              Investigator Profile &amp; Auth
            </h3>
          </div>
          <button
            onClick={() => setIsProfileOpen(false)}
            aria-label="Close"
            className="w-8 h-8 rounded-full flex items-center justify-center bg-[#252a31] text-[#bbcbbb] hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Error Banner if any */}
          {authError && (
            <div className="p-3 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffdad6] text-[12px] flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-[#ffb4ab] text-[18px] shrink-0">
                  error
                </span>
                <span className="leading-snug">{authError}</span>
              </div>
              <button
                onClick={clearAuthError}
                className="text-[#ffdad6] hover:text-white text-[14px]"
              >
                ✕
              </button>
            </div>
          )}

          {user ? (
            /* Signed In User View */
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="p-4 rounded-xl bg-[#0a0f15] border border-white/5 flex items-center gap-3.5">
                <div className="relative">
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt={displayName}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-[#54e98a]/40"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-[#252a31] flex items-center justify-center text-[#54e98a] text-xl font-bold font-mono">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div
                    className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#005027] border-2 border-[#0a0f15] flex items-center justify-center"
                    title="Verified Google Account"
                  >
                    <span className="material-symbols-outlined text-[#54e98a] text-[12px]">
                      check
                    </span>
                  </div>
                </div>

                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-headline-sm text-[16px] text-[#dee3eb] font-bold truncate">
                      {displayName}
                    </h4>
                  </div>
                  <p className="font-body-sm text-[12px] text-[#869486] truncate font-mono">
                    {email}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="font-label-sm text-[9px] uppercase px-2 py-0.5 rounded-full bg-[#54e98a]/10 text-[#54e98a] font-semibold border border-[#54e98a]/20">
                      OAuth 2.0 Verified
                    </span>
                    <span className="font-label-sm text-[9px] uppercase px-2 py-0.5 rounded-full bg-[#7dd0ff]/10 text-[#7dd0ff] font-semibold border border-[#7dd0ff]/20">
                      Google Auth
                    </span>
                  </div>
                </div>
              </div>

              {/* Firestore Cloud Sync Status */}
              <div className="p-3.5 rounded-xl bg-[#1b2026] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#bbcbbb] flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#54e98a] animate-pulse" />
                    Firestore Cloud Persistence
                  </span>
                  <span className="text-[#54e98a] font-mono font-bold">ACTIVE</span>
                </div>
                <div className="text-[11px] text-[#869486] font-mono bg-[#0a0f15] p-2 rounded-lg border border-white/5 space-y-1">
                  <div className="flex justify-between">
                    <span>Database ID:</span>
                    <span className="text-[#dee3eb] truncate max-w-[180px]">
                      ai-studio-voiceguardai
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>User Auth UID:</span>
                    <span className="text-[#dee3eb] truncate max-w-[180px]">
                      {user.uid.slice(0, 14)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Synced Scans:</span>
                    <span className="text-[#54e98a] font-bold">
                      {scansCount} Records Persisted
                    </span>
                  </div>
                </div>
              </div>

              {/* Profile Details List */}
              <div className="space-y-2 text-[12px]">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#252a31] border border-white/5">
                  <span className="text-[#bbcbbb]">Role &amp; Clearance:</span>
                  <span className="text-[#dee3eb] font-semibold">Forensic Biometric Analyst</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#252a31] border border-white/5">
                  <span className="text-[#bbcbbb]">Data Retention:</span>
                  <span className="text-[#dee3eb] font-semibold">Persistent Cloud Storage</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col gap-2">
                {onNavigateToScans && (
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      onNavigateToScans();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#252a31] hover:bg-[#30353c] text-[#7dd0ff] font-label-md text-[13px] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-white/5"
                  >
                    <span className="material-symbols-outlined text-[18px]">query_stats</span>
                    <span>View Cloud Scans Archive ({scansCount})</span>
                  </button>
                )}

                <button
                  onClick={signOut}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#93000a]/20 hover:bg-[#93000a]/40 text-[#ffdad6] font-label-md text-[13px] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer border border-[#ffb4ab]/20"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Sign Out of VoiceGuard</span>
                </button>
              </div>
            </div>
          ) : (
            /* Signed Out / Guest View */
            <div className="space-y-4 text-center py-2">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-[#54e98a]/10 border border-[#54e98a]/30 flex items-center justify-center text-[#54e98a]">
                <span className="material-symbols-outlined text-[32px]">shield_person</span>
              </div>

              <div className="space-y-1">
                <h4 className="font-headline-sm text-[18px] text-[#dee3eb] font-bold">
                  Sign In with Google
                </h4>
                <p className="font-body-sm text-[12px] text-[#bbcbbb] max-w-xs mx-auto">
                  Authenticate using Google OAuth to sync your forensic voice scans and settings to Firestore database.
                </p>
              </div>

              {/* Key Features */}
              <div className="text-left p-3.5 rounded-xl bg-[#0a0f15] border border-white/5 space-y-2 text-[12px]">
                <div className="flex items-center gap-2 text-[#dee3eb]">
                  <span className="material-symbols-outlined text-[#54e98a] text-[18px]">cloud_sync</span>
                  <span>Persistent audio deepfake scan history in Firestore</span>
                </div>
                <div className="flex items-center gap-2 text-[#dee3eb]">
                  <span className="material-symbols-outlined text-[#7dd0ff] text-[18px]">lock</span>
                  <span>Secure profile: Name, Email &amp; Avatar verification</span>
                </div>
                <div className="flex items-center gap-2 text-[#dee3eb]">
                  <span className="material-symbols-outlined text-[#ffc37d] text-[18px]">tune</span>
                  <span>Personalized acoustic sentry alert preferences</span>
                </div>
              </div>

              {/* Google Sign In CTA Button */}
              <button
                onClick={signIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] font-headline-sm text-[14px] font-bold shadow-lg transition-all flex items-center justify-center gap-3 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {/* Google "G" Vector Icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loading ? 'Connecting Google OAuth...' : 'Continue with Google'}</span>
              </button>

              <p className="text-[11px] text-[#869486]">
                By signing in, your scans and settings are stored in Firestore database.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
