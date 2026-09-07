import React from 'react';
import { ScreenType } from '../types';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  showBack?: boolean;
  onBack?: () => void;
  titleOverride?: string;
}

export const SHIELD_LOGO_URL =
  'https://lh3.googleusercontent.com/aida/AEtjO1WvE2AA43ZFp75k6o1KJ0kySOcY5ZiKnyrRUdUlEk916PaEhpjvI2kszLRQtEC008n1PfC5gTFwH5faUOJGilAOl2wKLAm-SXJaXHCEWsK0NZ1bpxM7v_uE2m-yG0QZg2ANg9EXbx-SHaBofgVTmB5s_uVkUuiTIfw_9qgqGyDJcZ7J01jNZW4AnrIXgtiVYfDYVvWXlGti5i2ZLGQKXFBBlyi9xx926jRPWyJ4CE7jD6Zw80Yn4hOU9w';

export const PROFILE_AVATAR_URL =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB7i5sv9aGAuaB-gbTOEwSrxX824dXNCj_Ahy-hc5f24lavMw1sukQfxXu9SPzOWIPLn7PckOrehUXvXeY1p_eB3PYTEwCvj7-eB-7opy-XudF_W9UKcn9vEIh0esc3mHCSHYTrzC31VzavMuD5BrKVa1pzPdimyvBliNzuwiIdBlM5f5-JO6YuY45Ahj6XBFWaFls6wtB_pPMEQyDTSEeX8mz3PNFd9mD9TgeUQ19yxpC8XdmqGWTr';

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  showBack = false,
  onBack,
  titleOverride,
}) => {
  const { user, userProfile, signIn, setIsProfileOpen, loading } = useAuth();

  const getScreenLabel = () => {
    if (titleOverride) return titleOverride;
    switch (currentScreen) {
      case 'home':
        return 'Home';
      case 'scan_record':
        return 'Live Sentry';
      case 'analyze_upload':
        return 'File Upload';
      case 'samples':
        return 'Forensics Lab';
      case 'alerts':
        return 'History & Alerts';
      case 'scanning_stream':
        return 'Live Analysis Stream';
      case 'incident_report':
        return 'Incident Details';
      case 'transcribe':
        return 'Audio Transcription';
      default:
        return 'VoiceGuard';
    }
  };

  const isFullTitleHeader = currentScreen === 'scanning_stream' || currentScreen === 'incident_report';

  const navLinks: { label: string; screen: ScreenType; icon: string }[] = [
    { label: 'Home', screen: 'home', icon: 'home' },
    { label: 'Transcribe', screen: 'transcribe', icon: 'speech_to_text' },
    { label: 'Live Sentry', screen: 'scan_record', icon: 'mic' },
    { label: 'Upload File', screen: 'analyze_upload', icon: 'upload_file' },
    { label: 'Forensics Lab', screen: 'samples', icon: 'grid_view' },
    { label: 'Alerts & Rules', screen: 'alerts', icon: 'notifications' },
  ];

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-[#0f141a]/90 backdrop-blur-xl shadow-[0_1px_16px_rgba(0,0,0,0.4)] border-b border-[#1b2026]">
      <div className="flex justify-between items-center px-4 sm:px-6 lg:px-8 h-16 w-full max-w-7xl mx-auto">
        {/* Left: Back button + Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          {showBack && (
            <button
              onClick={onBack || (() => onNavigate('home'))}
              aria-label="Go back"
              className="min-w-[36px] min-h-[36px] -ml-1 flex items-center justify-center rounded-full bg-[#171c22] hover:bg-[#252a31] text-[#dee3eb] transition-colors active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
          )}

          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => onNavigate('home')}
          >
            <img
              src={SHIELD_LOGO_URL}
              alt="VoiceGuard Shield Logo"
              className="h-8 sm:h-9 w-auto object-contain drop-shadow-[0_0_8px_rgba(84,233,138,0.25)]"
              referrerPolicy="no-referrer"
            />
            {isFullTitleHeader ? (
              <div className="flex items-center gap-2">
                <h1 className="font-headline-sm text-[#dee3eb] font-semibold tracking-tight text-[15px] sm:text-[18px]">
                  {getScreenLabel()}
                </h1>
                <span className="hidden md:inline-flex font-label-sm bg-[#171c22] text-[#7dd0ff] px-2 py-0.5 rounded-full uppercase tracking-wider text-[9px] border border-white/5">
                  Deepfake Inspection
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-headline-sm text-[#dee3eb] tracking-tight font-bold text-[17px] sm:text-[20px]">
                  VoiceGuard
                </span>
                <span className="font-label-sm bg-[#252a31] text-[#54e98a] px-1.5 py-0.5 rounded-md uppercase tracking-wider font-semibold text-[10px] border border-[#54e98a]/20">
                  AI
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Desktop Navigation Bar (Visible on md and above) */}
        <nav className="hidden md:flex items-center gap-1 bg-[#171c22]/90 p-1 rounded-full border border-white/5 shadow-inner">
          {navLinks.map((item) => {
            const isActive =
              currentScreen === item.screen ||
              (item.screen === 'scan_record' && (currentScreen === 'scan_record' || currentScreen === 'scanning_stream')) ||
              (item.screen === 'alerts' && currentScreen === 'incident_report');

            return (
              <button
                key={item.screen}
                onClick={() => onNavigate(item.screen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-label-md text-[11px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#252a31] text-[#54e98a] font-semibold shadow-sm'
                    : 'text-[#bbcbbb] hover:text-[#dee3eb] hover:bg-white/5'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Telemetry pill & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Desktop status pill */}
          <div className="hidden lg:flex items-center gap-2 bg-[#171c22] px-3 py-1 rounded-full border border-white/5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#54e98a] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#54e98a]" />
            </span>
            <span className="font-label-sm text-[10px] text-[#dee3eb] uppercase tracking-wider font-mono">
              SpectralNeural v4.2
            </span>
          </div>

          {!isFullTitleHeader && (
            <span className="font-label-md text-[11px] text-[#bbcbbb] md:hidden">
              {getScreenLabel()}
            </span>
          )}

          {user ? (
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-[#171c22] hover:bg-[#252a31] border border-white/10 transition-all cursor-pointer group"
              title={`${user.displayName || 'User'} (${user.email}) - View Profile`}
            >
              <div className="relative flex items-center justify-center">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User profile'}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-[#54e98a]/50"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#252a31] flex items-center justify-center text-[#54e98a] text-xs font-bold font-mono ring-1 ring-[#54e98a]/40">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#54e98a] rounded-full ring-2 ring-[#0f141a]"></span>
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="font-label-md text-[11px] text-[#dee3eb] font-semibold leading-tight group-hover:text-white max-w-[100px] truncate">
                  {user.displayName?.split(' ')[0] || 'Investigator'}
                </span>
                <span className="font-label-sm text-[9px] text-[#54e98a] font-mono leading-none">
                  OAuth Synced
                </span>
              </div>
            </button>
          ) : (
            <button
              onClick={() => signIn()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] font-label-md text-[11px] font-bold shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
              title="Sign in with Google OAuth"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
              <span>{loading ? '...' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
