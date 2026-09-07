import React, { useState, useEffect } from 'react';

export const ScanningScreen = ({
  filename = 'incoming_call_record_89.wav',
  duration = '0:24',
  onNavigate,
  onScanComplete,
}) => {
  const [progress, setProgress] = useState(25);
  const [currentPhase, setCurrentPhase] = useState(2); // 1, 2, 3, 4

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            onScanComplete();
          }, 600);
          return 100;
        }

        const next = prev + 5;
        if (next >= 85) {
          setCurrentPhase(4);
        } else if (next >= 45) {
          setCurrentPhase(3);
        } else {
          setCurrentPhase(2);
        }
        return next;
      });
    }, 120);

    return () => clearInterval(timer);
  }, [onScanComplete]);

  return (
    <div className="flex flex-col w-full pb-8">
      {/* Top Meta info */}
      <div className="flex flex-col items-center text-center mt-2 mb-4 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#252a31] text-[#7dd0ff] text-[10px] font-semibold mb-2 shadow-sm border border-white/5">
          <span className="w-2 h-2 rounded-full bg-[#54e98a] animate-ping" />
          <span className="tracking-widest uppercase font-mono">Deepfake Audio Inspection</span>
        </div>

        <div className="flex items-center gap-1.5 text-[#bbcbbb] font-body-sm text-[12px]">
          <span className="material-symbols-outlined text-[16px] text-[#54e98a]">graphic_eq</span>
          <span className="font-mono text-[#dee3eb] truncate max-w-[220px]">{filename}</span>
          <span className="text-[#869486] text-[11px] font-mono font-medium">({duration})</span>
        </div>
      </div>

      {/* Main Content Layout - 2 columns on tablet & desktop */}
      <div className="responsive-2col-grid px-2 sm:px-0">
        {/* Left Column: Futuristic Radar Biometric Stage */}
        <div className="flex flex-col items-center justify-center p-4 sm:p-6 rounded-2xl bg-[#0a0f15] border border-white/5 relative overflow-hidden">
          <div className="relative w-full aspect-square max-w-[280px] sm:max-w-[320px] mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#54e98a]/10 via-[#7dd0ff]/15 to-transparent blur-2xl animate-pulse" />

            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 320">
              <circle
                className="text-[#30353c]/40"
                cx="160"
                cy="160"
                fill="none"
                r="148"
                stroke="currentColor"
                strokeDasharray="4 6"
                strokeWidth="1.5"
              />
              <circle
                className="text-[#7dd0ff]/20"
                cx="160"
                cy="160"
                fill="none"
                r="126"
                stroke="currentColor"
                strokeWidth="1"
              />
              <circle
                className="text-[#54e98a]/20"
                cx="160"
                cy="160"
                fill="none"
                r="102"
                stroke="currentColor"
                strokeDasharray="8 8"
                strokeWidth="1.5"
              />

              {/* Animated counter-rotating arcs */}
              <circle
                className="origin-center animate-[spin_16s_linear_infinite]"
                cx="160"
                cy="160"
                fill="none"
                opacity="0.4"
                r="138"
                stroke="url(#cyan-grad)"
                strokeDasharray="40 180"
                strokeWidth="1.5"
              />
              <circle
                className="origin-center animate-[spin_9s_linear_infinite_reverse]"
                cx="160"
                cy="160"
                fill="none"
                opacity="0.6"
                r="114"
                stroke="url(#green-grad)"
                strokeDasharray="24 140"
                strokeWidth="2"
              />

              {/* Crosshair ticks */}
              <line stroke="#7dd0ff" strokeLinecap="round" strokeWidth="2" x1="160" x2="160" y1="12" y2="28" />
              <line stroke="#7dd0ff" strokeLinecap="round" strokeWidth="2" x1="160" x2="160" y1="292" y2="308" />
              <line stroke="#7dd0ff" strokeLinecap="round" strokeWidth="2" x1="12" x2="28" y1="160" y2="160" />
              <line stroke="#7dd0ff" strokeLinecap="round" strokeWidth="2" x1="292" x2="308" y1="160" y2="160" />

              <defs>
                <linearGradient id="cyan-grad" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#54e98a" />
                  <stop offset="100%" stopColor="#7dd0ff" />
                </linearGradient>
                <linearGradient id="green-grad" x1="0%" x2="100%" y1="100%" y2="0%">
                  <stop offset="0%" stopColor="#7dd0ff" />
                  <stop offset="100%" stopColor="#54e98a" />
                </linearGradient>
                <linearGradient id="beam-grad" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#54e98a" stopOpacity="0" />
                  <stop offset="50%" stopColor="#7dd0ff" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#54e98a" stopOpacity="0.85" />
                </linearGradient>
              </defs>

              {/* Sweeping Radar Scanner Beam */}
              <g className="origin-center animate-[spin_3.5s_linear_infinite]">
                <path d="M 160 160 L 260 110 A 115 115 0 0 0 160 45 Z" fill="url(#beam-grad)" />
                <line opacity="0.9" stroke="#54e98a" strokeLinecap="round" strokeWidth="1.5" x1="160" x2="260" y1="160" y2="110" />
              </g>
            </svg>

            {/* Center Waveform Capsule */}
            <div className="relative w-36 sm:w-40 h-36 sm:h-40 rounded-full bg-[#171c22] shadow-[0_0_40px_rgba(84,233,138,0.18)] flex items-center justify-center p-3 border border-white/5">
              <div className="w-full h-full rounded-full bg-[#0a0f15] flex items-center justify-center gap-1.5 px-3 overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-b from-[#7dd0ff]/5 via-transparent to-[#54e98a]/5 pointer-events-none" />
                <div className="w-1.5 rounded-full bg-[#7dd0ff]/60 animate-[pulse_1.2s_ease-in-out_infinite] h-8" />
                <div className="w-1.5 rounded-full bg-[#7dd0ff] animate-[pulse_0.9s_ease-in-out_infinite_0.1s] h-14" />
                <div className="w-1.5 rounded-full bg-[#6bfe9c] animate-[pulse_1.4s_ease-in-out_infinite_0.2s] h-20" />
                <div className="w-2 rounded-full bg-[#54e98a] shadow-[0_0_12px_#54e98a] animate-[pulse_0.8s_ease-in-out_infinite_0.15s] h-28" />
                <div className="w-1.5 rounded-full bg-[#7dd0ff] animate-[pulse_1.1s_ease-in-out_infinite_0.3s] h-22" />
                <div className="w-1.5 rounded-full bg-[#7dd0ff]/80 animate-[pulse_1.3s_ease-in-out_infinite_0.05s] h-12" />
                <div className="w-1.5 rounded-full bg-[#7dd0ff]/50 animate-[pulse_1s_ease-in-out_infinite_0.25s] h-6" />

                <div className="absolute bottom-2.5 flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-[#54e98a] font-semibold">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#54e98a] animate-ping" />
                  ResNet-50
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Acoustic Pipeline & Progress */}
        <div className="flex flex-col space-y-4">
          {/* Acoustic Pipeline Card */}
          <div className="bg-[#171c22] rounded-xl p-4 sm:p-5 shadow-md border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-label-sm text-[10px] sm:text-[11px] text-[#bbcbbb] uppercase tracking-wider font-semibold font-mono">
                Acoustic Pipeline
              </span>
              <span className="font-label-sm text-[11px] sm:text-[12px] text-[#54e98a] flex items-center gap-1 font-semibold font-mono">
                <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                Phase {Math.min(currentPhase, 4)} of 4
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Step 1 */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#54e98a]/15 text-[#54e98a] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body-sm text-[12px] text-[#dee3eb] font-medium truncate">
                    Audio decoded &amp; normalized
                  </p>
                  <p className="font-label-sm text-[10px] text-[#bbcbbb]">
                    44.1kHz stereo PCM • zero-jitter buffer
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-[#54e98a]/15 text-[#54e98a] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body-sm text-[12px] text-[#dee3eb] font-medium truncate">
                    Mel-spectrogram &amp; prosody extracted
                  </p>
                  <p className="font-label-sm text-[10px] text-[#bbcbbb]">
                    128 Mel bands • temporal envelope mapped
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div
                className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${
                  currentPhase === 3
                    ? 'bg-[#252a31]/80 border border-[#7dd0ff]/20'
                    : currentPhase > 3
                    ? 'bg-transparent'
                    : 'opacity-60'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    currentPhase > 3
                      ? 'bg-[#54e98a]/15 text-[#54e98a]'
                      : 'bg-[#2a9acc]/20 text-[#7dd0ff]'
                  }`}
                >
                  {currentPhase > 3 ? (
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-[13px] animate-pulse">bolt</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-body-sm text-[12px] text-[#7dd0ff] font-semibold">
                      Running neural artifact classifier
                    </p>
                    {currentPhase === 3 && (
                      <span className="flex gap-0.5 text-[#7dd0ff]">
                        <span className="w-1 h-1 rounded-full bg-[#7dd0ff] animate-bounce" />
                        <span className="w-1 h-1 rounded-full bg-[#7dd0ff] animate-bounce [animation-delay:0.15s]" />
                        <span className="w-1 h-1 rounded-full bg-[#7dd0ff] animate-bounce [animation-delay:0.3s]" />
                      </span>
                    )}
                  </div>
                  <p className="font-label-sm text-[10px] text-[#bbcbbb] mt-0.5">
                    Biometric ResNet-50 synthetic phoneme audit
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div
                className={`flex items-start gap-2.5 p-2 rounded-lg transition-colors ${
                  currentPhase >= 4
                    ? 'bg-[#252a31]/80 border border-[#54e98a]/30'
                    : 'opacity-60'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    progress >= 100
                      ? 'bg-[#54e98a]/15 text-[#54e98a]'
                      : 'bg-[#30353c] text-[#869486]'
                  }`}
                >
                  {progress >= 100 ? (
                    <span className="material-symbols-outlined text-[14px]">check</span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#869486]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body-sm text-[12px] text-[#dee3eb] font-medium truncate">
                    Finalizing forensic confidence score
                  </p>
                  <p className="font-label-sm text-[10px] text-[#869486]">
                    Weight aggregation &amp; report seal
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between items-baseline mb-2">
              <span className="font-label-md text-[13px] text-[#dee3eb] font-semibold tracking-wide">
                Analysis Progress
              </span>
              <span className="font-label-sm text-[11px] text-[#7dd0ff] font-medium font-mono">
                {progress}% complete • ~{((100 - progress) * 0.02).toFixed(1)}s remaining
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#30353c] overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#54e98a] via-[#7dd0ff] to-[#6bfe9c] shadow-[0_0_8px_#54e98a] transition-all duration-150 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Skip / Immediate View Button */}
          <div>
            <button
              onClick={onScanComplete}
              className="w-full py-2.5 rounded-xl bg-[#1b2026] hover:bg-[#252a31] text-[#dee3eb] font-label-sm text-[11px] sm:text-[12px] font-semibold tracking-wider uppercase border border-white/5 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              Skip to Results Immediately →
            </button>
          </div>

          {/* Zero-Knowledge Security Badge */}
          <div className="pt-1">
            <div className="flex items-center justify-center gap-2 py-2 px-3 rounded-full bg-[#0a0f15] shadow-sm text-center border border-white/5">
              <span
                className="material-symbols-outlined text-[16px] text-[#54e98a]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified_user
              </span>
              <span className="font-label-sm text-[10px] text-[#bbcbbb] tracking-wide uppercase font-mono">
                Zero-knowledge private computation
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
