import React, { useState, useEffect } from 'react';

export const SHIELD_LOGO_URL =
  'https://lh3.googleusercontent.com/aida/AEtjO1WvE2AA43ZFp75k6o1KJ0kySOcY5ZiKnyrRUdUlEk916PaEhpjvI2kszLRQtEC008n1PfC5gTFwH5faUOJGilAOl2wKLAm-SXJaXHCEWsK0NZ1bpxM7v_uE2m-yG0QZg2ANg9EXbx-SHaBofgVTmB5s_uVkUuiTIfw_9qgqGyDJcZ7J01jNZW4AnrIXgtiVYfDYVvWXlGti5i2ZLGQKXFBBlyi9xx926jRPWyJ4CE7jD6Zw80Yn4hOU9w';

const BOOT_STAGES = [
  { threshold: 0, text: 'Initializing VoiceGuard Acoustic Neural Core...', code: 'BOOT_STAGE_01' },
  { threshold: 24, text: 'Calibrating Glottal Pulse & Phase Filters...', code: 'DSP_CALIBRATE_FFT' },
  { threshold: 52, text: 'Loading Deepfake Anti-Spoofing Benchmarks...', code: 'AASIST_RAWNET_LOAD' },
  { threshold: 78, text: 'Arming Real-Time Impersonation Sentry...', code: 'SENTRY_ARM_STANDBY' },
  { threshold: 96, text: 'All Defense Systems Active & Synchronized.', code: 'SYSTEM_READY_200' },
];

export const LoadingScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Total startup time ~3.5 seconds (3 to 4 seconds total experience)
    const startTime = Date.now();
    const duration = 3500;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(100, Math.floor((elapsed / duration) * 100));

      // Update progress
      setProgress(rawProgress);

      if (rawProgress >= 100) {
        clearInterval(interval);
        // Pause at 100% before smooth fade out
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 450); // Match transition duration
        }, 350);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Current diagnostic message
  const currentStage =
    [...BOOT_STAGES].reverse().find((stage) => progress >= stage.threshold) || BOOT_STAGES[0];

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between px-6 py-10 bg-[#0f141a] text-[#dee3eb] select-none overflow-hidden transition-all duration-500 ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Decorative Tech Grid & Ambient Glows */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #54e98a 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
        {/* Soft Radial Ambient Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[500px] h-[340px] sm:h-[500px] bg-[#54e98a]/10 rounded-full blur-[100px] animate-pulse-glow" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] sm:w-[380px] h-[260px] sm:h-[380px] bg-[#7dd0ff]/10 rounded-full blur-[80px]" />
      </div>

      {/* Top Bar / Header Branding */}
      <div className="relative z-10 w-full max-w-md flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#54e98a] animate-pulse" />
          <span className="font-label-sm text-[11px] text-[#54e98a] font-mono tracking-wider">
            VOICEGUARD SENTRY
          </span>
        </div>
        <div className="text-[11px] font-mono text-[#869486] bg-[#171c22] px-2.5 py-1 rounded-full border border-white/5">
          SYS.V2.4.0
        </div>
      </div>

      {/* Center: Animated Biometric Shield, Radar, and Equalizer */}
      <div className="relative z-10 flex flex-col items-center my-auto">
        {/* Glowing Concentric Animated Shield Core */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
          {/* Outward expanding ripple shockwaves */}
          <div className="absolute inset-0 rounded-full border border-[#54e98a]/30 animate-ripple-1 pointer-events-none" />
          <div className="absolute inset-0 rounded-full border border-[#7dd0ff]/25 animate-ripple-2 pointer-events-none" />
          <div className="absolute inset-0 rounded-full border border-[#54e98a]/20 animate-ripple-3 pointer-events-none" />

          {/* Outer Rotating Radar Ring */}
          <div className="absolute inset-2 rounded-full border border-[#54e98a]/25 border-t-[#54e98a] border-r-transparent animate-spin-slow pointer-events-none" />

          {/* Secondary Reverse Rotating Ring with Dash Pattern */}
          <div className="absolute inset-6 rounded-full border border-dashed border-[#7dd0ff]/30 border-b-[#7dd0ff] animate-spin-reverse-medium pointer-events-none" />

          {/* Inner Glowing Badge Container */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-b from-[#1b2026] to-[#0a0f15] border border-white/10 shadow-[0_0_35px_rgba(84,233,138,0.25)] flex items-center justify-center overflow-hidden group">
            {/* Ambient Shimmer Sweep */}
            <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 animate-shimmer-sweep" />

            {/* Core Shield Image or Vector */}
            <img
              src={SHIELD_LOGO_URL}
              alt="VoiceGuard AI"
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_4px_12px_rgba(84,233,138,0.4)] transition-transform duration-500 scale-100 group-hover:scale-105"
            />

            {/* Biometric Laser Reticle Line */}
            <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#54e98a] to-transparent animate-pulse" />
          </div>
        </div>

        {/* Live Frequency Spectrum Equalizer Bars */}
        <div className="flex items-center justify-center gap-1 sm:gap-1.5 h-8 mt-6">
          {[
            { delay: '0.0s', height: 'h-4' },
            { delay: '0.15s', height: 'h-6' },
            { delay: '0.3s', height: 'h-7' },
            { delay: '0.1s', height: 'h-8' },
            { delay: '0.25s', height: 'h-5' },
            { delay: '0.4s', height: 'h-7' },
            { delay: '0.2s', height: 'h-6' },
            { delay: '0.05s', height: 'h-4' },
          ].map((bar, idx) => (
            <span
              key={idx}
              className={`w-1 sm:w-1.5 rounded-full bg-gradient-to-t from-[#54e98a] to-[#7dd0ff] ${bar.height} origin-bottom`}
              style={{
                animation: `loading-bar-bounce 1s ease-in-out infinite ${bar.delay}`,
              }}
            />
          ))}
        </div>

        {/* Title and Tagline */}
        <div className="text-center mt-5 space-y-1">
          <h1 className="font-headline-lg text-[22px] sm:text-[26px] font-bold tracking-tight text-[#dee3eb] flex items-center justify-center gap-2">
            <span>VoiceGuard</span>
            <span className="text-[#54e98a] font-mono text-[18px] sm:text-[22px] font-bold px-2 py-0.5 rounded-lg bg-[#54e98a]/10 border border-[#54e98a]/20">
              AI
            </span>
          </h1>
          <p className="font-label-md text-[11px] sm:text-[12px] text-[#bbcbbb] tracking-wider uppercase font-mono">
            Acoustic Biometric Sentry &amp; Deepfake Defense
          </p>
        </div>
      </div>

      {/* Bottom Progress & Diagnostic Status */}
      <div className="relative z-10 w-full max-w-md space-y-3 pb-2">
        {/* Status Line and Percentage */}
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 truncate pr-2 text-[#bbcbbb]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7dd0ff] animate-ping" />
            <span className="truncate">{currentStage.text}</span>
          </div>
          <span className="text-[#54e98a] font-bold shrink-0 text-[13px]">
            {progress}%
          </span>
        </div>

        {/* Smooth Animated Glowing Progress Bar */}
        <div className="relative h-2 w-full rounded-full bg-[#1b2026] border border-white/5 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#54e98a] via-[#4ae183] to-[#7dd0ff] transition-all duration-100 ease-out shadow-[0_0_12px_rgba(84,233,138,0.5)] relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            {/* Shimmer Light Bar */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-sweep" />
          </div>
        </div>

        {/* System Meta Telemetry Pills */}
        <div className="flex items-center justify-between text-[10px] font-mono text-[#869486] pt-1">
          <span className="flex items-center gap-1">
            <span className="text-[#54e98a]">●</span> 48 kHz / 24-bit PCM
          </span>
          <span className="hidden sm:inline-block">FFT DUAL-TIER ENGINE</span>
          <button
            onClick={() => {
              setIsFadingOut(true);
              setTimeout(() => {
                if (onComplete) onComplete();
              }, 300);
            }}
            className="text-[#7dd0ff] hover:text-white transition-colors cursor-pointer underline underline-offset-2"
          >
            Skip Intro
          </button>
        </div>
      </div>
    </div>
  );
};
