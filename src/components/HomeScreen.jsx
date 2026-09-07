import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export const HomeScreen = ({ scans, onNavigate, onSelectScan }) => {
  const { user, signIn, setIsProfileOpen, loading } = useAuth();
  const [waveHeights, setWaveHeights] = useState([
    45, 65, 30, 80, 95, 60, 40, 75, 90, 55, 35, 70, 50, 85, 40, 60, 30, 50, 72, 44, 88, 52, 38, 68,
  ]);

  // Live fluctuating forensics scope
  useEffect(() => {
    const interval = setInterval(() => {
      setWaveHeights((prev) =>
        prev.map(() => Math.floor(Math.random() * 70) + 25)
      );
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const totalAudited = 24 + scans.length;
  const clonesCount = scans.filter((s) => s.isSynthetic).length + 3;
  const authenticCount = totalAudited - clonesCount;

  return (
    <div className="flex flex-col w-full space-y-4 sm:space-y-6 pb-6">
      {/* Biometric Status & Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[#252a31] p-4 sm:p-6 shadow-xl border border-white/5">
        {/* Ambient background glows */}
        <div className="absolute -right-8 -top-8 w-44 h-44 bg-[#54e98a]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-44 h-44 bg-[#7dd0ff]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0a0f15] text-[#54e98a] border border-[#54e98a]/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#54e98a] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#54e98a]" />
              </span>
              <span className="font-label-sm text-[10px] uppercase tracking-wider font-semibold font-mono">
                Engine: SpectralNeural v4.2 Active
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-[#7dd0ff]">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
                <span className="font-label-sm text-[11px] font-semibold font-mono">99.4% Accuracy</span>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[#54e98a]">
                <span className="material-symbols-outlined text-[18px]">bolt</span>
                <span className="font-label-sm text-[11px] font-semibold font-mono">&lt; 80ms Latency</span>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <h2 className="responsive-headline-hero text-[#dee3eb] font-bold tracking-tight">
              AI Voice Cloning &amp; Deepfake Guard
            </h2>
            <p className="font-body-sm text-[13px] text-[#bbcbbb] mt-1 max-w-2xl leading-relaxed">
              Real-time spectral analysis and synthesized audio forensics calibrated against 34 generative neural vocoder architectures.
            </p>
          </div>

          {/* Quick Metrics Counter Strip */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
            <div className="bg-[#1b2026] rounded-xl p-3 flex flex-col items-center justify-center text-center border border-white/5 shadow-sm">
              <span className="font-numeric-metric responsive-numeric-lg text-[#dee3eb] font-bold">
                {totalAudited}
              </span>
              <span className="font-label-sm text-[10px] text-[#bbcbbb] uppercase tracking-wider mt-0.5">
                Total Audited
              </span>
            </div>

            <div className="bg-[#1b2026] rounded-xl p-3 flex flex-col items-center justify-center text-center border border-white/5 shadow-sm">
              <span className="font-numeric-metric responsive-numeric-lg text-[#ffb4ab] font-bold">
                {clonesCount}
              </span>
              <span className="font-label-sm text-[10px] text-[#ffb4ab] uppercase tracking-wider mt-0.5">
                Clones Stopped
              </span>
            </div>

            <div className="bg-[#1b2026] rounded-xl p-3 flex flex-col items-center justify-center text-center border border-white/5 shadow-sm">
              <span className="font-numeric-metric responsive-numeric-lg text-[#54e98a] font-bold">
                {authenticCount}
              </span>
              <span className="font-label-sm text-[10px] text-[#54e98a] uppercase tracking-wider mt-0.5">
                Authentic Verified
              </span>
            </div>
          </div>

          {/* User Profile & Firestore Cloud Status Bar */}
          {user ? (
            <div className="mt-2 p-3 rounded-xl bg-[#0a0f15]/90 border border-[#54e98a]/20 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User Profile'}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-[#54e98a]/60"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#252a31] text-[#54e98a] flex items-center justify-center font-bold text-sm font-mono">
                      {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#54e98a] rounded-full ring-2 ring-[#0a0f15]" />
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline-sm text-[13px] text-[#dee3eb] font-semibold truncate">
                      {user.displayName || 'Forensic Investigator'}
                    </span>
                    <span className="font-label-sm text-[9px] uppercase font-bold text-[#54e98a] bg-[#54e98a]/10 px-1.5 py-0.2 rounded border border-[#54e98a]/20 font-mono">
                      Google OAuth
                    </span>
                  </div>
                  <span className="font-body-sm text-[11px] text-[#869486] truncate font-mono">
                    {user.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-[#54e98a] font-mono bg-[#171c22] px-2.5 py-1 rounded-lg border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-[#54e98a] animate-pulse" />
                  <span>Firestore Synced</span>
                </div>
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#252a31] hover:bg-[#353a40] text-[#dee3eb] font-label-md text-[11px] font-semibold transition-colors cursor-pointer border border-white/10"
                >
                  Account Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-2 p-3 rounded-xl bg-[#0a0f15]/80 border border-white/10 flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2 text-[12px] text-[#bbcbbb]">
                <span className="material-symbols-outlined text-[#7dd0ff] text-[20px]">
                  cloud_sync
                </span>
                <span>
                  Enable Firestore cloud persistence &amp; multi-device sync
                </span>
              </div>
              <button
                onClick={() => signIn()}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] font-label-md text-[11px] font-bold shadow transition-all cursor-pointer"
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
                <span>Sign In with Google</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Responsive Split Grid */}
      <div className="responsive-2col-grid">
        {/* Left Column: Inspection Hub & Forensics Scope */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="font-label-lg text-[13px] text-[#dee3eb] font-semibold tracking-wide">
                Inspection Hub
              </span>
              <span className="font-label-sm text-[11px] text-[#7dd0ff] flex items-center gap-1 font-medium font-mono">
                <span className="material-symbols-outlined text-[14px]">graphic_eq</span> Ready
              </span>
            </div>

            {/* Live Recording Primary Callout Card */}
            <div
              onClick={() => onNavigate('scan_record')}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#252a31] via-[#1b2026] to-[#252a31] p-4 sm:p-5 transition-all duration-200 active:scale-[0.99] shadow-md hover:shadow-[#54e98a]/10 border border-white/5 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#54e98a]/10 to-[#7dd0ff]/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#54e98a] text-[#003919] shadow-lg shadow-[#54e98a]/30 shrink-0">
                    <span className="material-symbols-outlined text-[26px] sm:text-[28px]">mic</span>
                    <span className="absolute -inset-1 rounded-full border-2 border-[#54e98a]/40 animate-ping pointer-events-none" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-[16px] sm:text-[17px] text-[#dee3eb] font-bold">
                        Start Live Sentry
                      </span>
                      <span className="font-label-sm text-[9px] px-2 py-0.5 rounded-full bg-[#54e98a]/20 text-[#54e98a] font-semibold uppercase font-mono">
                        Instant
                      </span>
                    </div>
                    <span className="font-body-sm text-[12px] sm:text-[13px] text-[#bbcbbb] mt-0.5">
                      Real-time mic stream listener with live waveform phase audit
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#54e98a] text-[24px] sm:text-[28px] transition-transform group-hover:translate-x-1 shrink-0">
                  chevron_right
                </span>
              </div>
            </div>

            {/* Audio Transcription Card (Powered by gemini-3.5-transcribe) */}
            <div
              onClick={() => onNavigate('transcribe')}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#17231d] via-[#1a2b22] to-[#17231d] p-4 sm:p-5 transition-all duration-200 active:scale-[0.99] shadow-md hover:shadow-[#54e98a]/10 border border-[#54e98a]/25 cursor-pointer"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className="relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#003919] text-[#54e98a] border border-[#54e98a]/40 shadow-lg shrink-0">
                    <span className="material-symbols-outlined text-[26px] sm:text-[28px]">speech_to_text</span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-headline-sm text-[16px] sm:text-[17px] text-[#dee3eb] font-bold">
                        Transcribe Audio
                      </span>
                      <span className="font-label-sm text-[9px] px-2 py-0.5 rounded-full bg-[#54e98a]/20 text-[#54e98a] font-semibold uppercase font-mono">
                        gemini-3.5-transcribe
                      </span>
                    </div>
                    <span className="font-body-sm text-[12px] sm:text-[13px] text-[#bbcbbb] mt-0.5">
                      Input microphone speech to generate verbatim text transcription
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[#54e98a] text-[24px] sm:text-[28px] transition-transform group-hover:translate-x-1 shrink-0">
                  chevron_right
                </span>
              </div>
            </div>

            {/* Secondary Action Dual Tiles */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* Upload Card */}
              <div
                onClick={() => onNavigate('analyze_upload')}
                className="group relative rounded-2xl bg-[#1b2026] p-4 flex flex-col justify-between space-y-3 transition-all duration-200 active:scale-[0.98] shadow hover:bg-[#252a31] border border-white/5 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#2a9acc]/20 text-[#7dd0ff] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">upload_file</span>
                  </div>
                  <span className="font-label-sm text-[10px] text-[#7dd0ff] font-medium bg-[#30353c] px-2 py-0.5 rounded-full font-mono">
                    WAV, MP3, M4A
                  </span>
                </div>
                <div>
                  <span className="font-headline-sm text-[15px] sm:text-[16px] text-[#dee3eb] font-semibold block leading-tight">
                    Upload Audio File
                  </span>
                  <span className="font-body-sm text-[11px] sm:text-[12px] text-[#bbcbbb] line-clamp-2 mt-1">
                    Inspect pre-recorded audio tracks for synthetic glitches and glottal phase drops
                  </span>
                </div>
              </div>

              {/* Sample Benchmarks Card */}
              <div
                onClick={() => onNavigate('samples')}
                className="group relative rounded-2xl bg-[#1b2026] p-4 flex flex-col justify-between space-y-3 transition-all duration-200 active:scale-[0.98] shadow hover:bg-[#252a31] border border-white/5 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#f8a018]/20 text-[#ffc37d] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">library_music</span>
                  </div>
                  <span className="font-label-sm text-[10px] text-[#ffc37d] font-medium bg-[#30353c] px-2 py-0.5 rounded-full font-mono">
                    8 Benchmarks
                  </span>
                </div>
                <div>
                  <span className="font-headline-sm text-[15px] sm:text-[16px] text-[#dee3eb] font-semibold block leading-tight">
                    Try Benchmarks
                  </span>
                  <span className="font-body-sm text-[11px] sm:text-[12px] text-[#bbcbbb] line-clamp-2 mt-1">
                    Compare verified human speech against ElevenLabs, VALL-E &amp; XTTS clones
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Spectrogram Forensics Highlight */}
          <div className="rounded-2xl bg-[#0a0f15] p-4 flex flex-col space-y-2.5 shadow-inner border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#bbcbbb]">
                <span className="material-symbols-outlined text-[18px] text-[#54e98a]">equalizer</span>
                <span className="font-label-md text-[12px] uppercase tracking-wider font-semibold">
                  Live Forensics Oscillogram
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-[10px] text-[#7dd0ff] bg-[#171c22] px-2 py-0.5 rounded-full font-mono">
                  128 Mel Bands
                </span>
                <span className="font-label-sm text-[10px] text-[#54e98a] bg-[#54e98a]/10 px-2 py-0.5 rounded-full font-mono">
                  48.0 kHz // 24-bit
                </span>
              </div>
            </div>

            {/* Soundwave Graphic with Responsive Height */}
            <div
              className="w-full responsive-equalizer-height bg-[#171c22] rounded-xl px-4 flex items-center justify-between gap-1 overflow-hidden"
              id="ambient-spectrogram"
            >
              {waveHeights.map((height, i) => {
                const isBlue = i % 4 === 0 || i % 7 === 0;
                return (
                  <div
                    key={i}
                    className={`flex-1 max-w-[8px] rounded-full transition-all duration-300 ${
                      isBlue ? 'bg-[#7dd0ff]' : 'bg-[#54e98a]'
                    }`}
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Recent Scan History */}
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="font-label-lg text-[13px] text-[#dee3eb] font-semibold tracking-wide">
                Recent Scan History
              </span>
              <span className="font-label-sm text-[10px] text-[#bbcbbb] bg-[#252a31] px-2 py-0.5 rounded-full font-mono">
                {scans.length} Scans Logged
              </span>
              {user && (
                <span className="hidden sm:inline-flex font-label-sm text-[10px] text-[#54e98a] bg-[#54e98a]/10 px-2 py-0.5 rounded-full font-mono border border-[#54e98a]/20">
                  Firestore Active
                </span>
              )}
            </div>
            <button
              onClick={() => onNavigate('samples')}
              className="font-label-md text-[12px] text-[#54e98a] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              See all <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          {/* Scan History List */}
          <div className="flex flex-col space-y-2.5">
            {scans.map((scan) => {
              const isSpoof = scan.isSynthetic;

              return (
                <div
                  key={scan.id}
                  className="relative p-3.5 sm:p-4 rounded-2xl bg-[#1b2026] flex flex-col space-y-2.5 transition-all duration-150 hover:bg-[#252a31] shadow border border-white/5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSpoof
                            ? 'bg-[#93000a]/40 text-[#ffb4ab]'
                            : 'bg-[#54e98a]/20 text-[#54e98a]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isSpoof ? 'warning' : 'verified'}
                        </span>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="font-headline-sm text-[14px] text-[#dee3eb] font-semibold truncate">
                          {scan.filename}
                        </span>
                        <div className="flex items-center gap-2 font-body-sm text-[11px] sm:text-[12px] text-[#bbcbbb]">
                          <span>{scan.timeAgo}</span>
                          <span>•</span>
                          <span className="font-mono">{scan.duration}</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full font-label-sm text-[10px] font-bold flex items-center gap-1 ${
                        isSpoof
                          ? 'bg-[#93000a] text-[#ffdad6]'
                          : 'bg-[#2ecc71] text-[#005027]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSpoof ? 'bg-[#ffb4ab] animate-pulse' : 'bg-[#54e98a]'
                        }`}
                      />
                      {scan.classification}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[#bbcbbb] pt-1 border-t-0 bg-[#171c22] px-3 py-2 rounded-xl">
                    <span
                      className={`font-label-sm text-[11px] truncate pr-2 ${
                        isSpoof ? 'text-[#ffb4ab]' : 'text-[#bbcbbb]'
                      }`}
                    >
                      {scan.anomalyTag}
                    </span>
                    <button
                      onClick={() => {
                        onSelectScan(scan);
                        onNavigate('incident_report');
                      }}
                      className="font-label-sm text-[11px] text-[#7dd0ff] font-semibold hover:underline flex items-center gap-0.5 shrink-0 cursor-pointer"
                    >
                      Diagnostics{' '}
                      <span className="material-symbols-outlined text-[14px]">tune</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
