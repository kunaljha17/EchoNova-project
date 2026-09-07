import React, { useState, useEffect, useRef } from 'react';

export const RecordScreen = ({
  onNavigate,
  onFinishRecording,
}) => {
  const [isRecording, setIsRecording] = useState(true);
  const [elapsedCentis, setElapsedCentis] = useState(1532); // centiseconds (00:15.32)
  const [decibels, setDecibels] = useState(-14);
  const [clarity, setClarity] = useState(96);
  const [waveBars, setWaveBars] = useState([
    16, 28, 48, 36, 24, 56, 40, 32, 16, 44, 52, 28, 20, 48, 32, 12,
  ]);

  const timerRef = useRef(null);

  useEffect(() => {
    if (!isRecording) return;

    timerRef.current = setInterval(() => {
      setElapsedCentis((prev) => {
        if (prev >= 3000) {
          // 30 seconds limit reached
          return 3000;
        }
        return prev + 5;
      });

      // Fluctuate decibels and wave heights slightly for realistic live telemetry
      setDecibels(-14 + Math.floor(Math.random() * 5) - 2);
      setClarity(Math.min(99, Math.max(92, 96 + Math.floor(Math.random() * 4) - 2)));
      setWaveBars((prev) =>
        prev.map(() => Math.floor(Math.random() * 46) + 10)
      );
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTimer = (centis) => {
    const totalSec = Math.floor(centis / 100);
    const remainder = centis % 100;
    const ss = String(totalSec).padStart(2, '0');
    const cc = String(remainder).padStart(2, '0');
    return `00:${ss}.${cc}`;
  };

  const formattedRecordProgress = () => {
    const totalSec = Math.floor(elapsedCentis / 100);
    const ss = String(totalSec).padStart(2, '0');
    return `REC 00:${ss} / 00:30`;
  };

  const handleStopAndAnalyze = () => {
    const totalSec = Math.max(5, Math.floor(elapsedCentis / 100));
    onFinishRecording(`00:${String(totalSec).padStart(2, '0')}`);
  };

  const handleRestart = () => {
    setElapsedCentis(0);
    setIsRecording(true);
  };

  return (
    <div className="flex flex-col w-full gap-3 pb-6">
      {/* Top Navigation / Context Header */}
      <div className="flex items-center justify-between w-full py-1">
        <button
          onClick={() => onNavigate('home')}
          className="w-10 h-10 rounded-full bg-[#171c22] flex items-center justify-center text-[#dee3eb] hover:bg-[#252a31] transition-all active:scale-95 cursor-pointer"
          type="button"
          aria-label="Back to home"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="font-headline-sm text-[16px] text-[#dee3eb] tracking-tight font-semibold">
            Live Acoustic Sentry
          </span>
          <span className="font-label-sm text-[9px] text-[#54e98a] tracking-wider uppercase flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#54e98a] animate-ping" />
            Deepfake Shield Active
          </span>
        </div>

        <button
          onClick={() => onNavigate('alerts')}
          className="w-10 h-10 rounded-full bg-[#171c22] flex items-center justify-center text-[#bbcbbb] hover:text-[#dee3eb] hover:bg-[#252a31] transition-all active:scale-95 cursor-pointer"
          type="button"
          aria-label="Acoustic settings"
        >
          <span className="material-symbols-outlined text-[20px]">tune</span>
        </button>
      </div>

      {/* Live Status & Mode Badge */}
      <div className="flex items-center justify-between px-3.5 py-1.5 rounded-full bg-[#171c22] shadow-sm border border-white/5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ffb4ab] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ffb4ab]" />
          </span>
          <span className="font-label-md text-[11px] text-[#ffb4ab] font-bold tracking-wider">
            {formattedRecordProgress()}
          </span>
        </div>

        <div className="flex items-center gap-1 bg-[#1b2026] px-2.5 py-0.5 rounded-full border border-white/5">
          <span className="material-symbols-outlined text-[#54e98a] text-[14px]">graphic_eq</span>
          <span className="font-label-sm text-[10px] text-[#bbcbbb] uppercase font-mono">
            48 kHz • 24-Bit
          </span>
        </div>
      </div>

      {/* Main Responsive Grid Container */}
      <div className="responsive-2col-grid mt-2">
        {/* Left Column: Central Acoustic Scope & Biometric Stage */}
        <div className="relative flex flex-col items-center justify-center py-6 sm:py-8 px-4 rounded-2xl bg-[#0a0f15] overflow-hidden shadow-xl border border-white/5">
          {/* Ambient Radiance Background Glow */}
          <div className="absolute w-64 sm:w-72 h-64 sm:h-72 rounded-full bg-gradient-to-tr from-[#54e98a]/10 via-[#7dd0ff]/10 to-transparent blur-3xl pointer-events-none" />

          {/* Shield Visualizer Stamp Backdrop */}
          <svg
            className="absolute w-56 sm:w-64 h-56 sm:h-64 text-[#30353c]/40 pointer-events-none stroke-current"
            fill="none"
            strokeDasharray="2 3"
            strokeWidth="0.75"
            viewBox="0 0 100 100"
          >
            <path d="M50 10 L85 24 V52 C85 72 50 90 50 90 C50 90 15 72 15 52 V24 Z" />
          </svg>

          {/* Radar Pulse Waves */}
          <div className="relative flex items-center justify-center my-3">
            <div className="absolute w-44 h-44 rounded-full bg-[#54e98a]/10 animate-ping duration-1000" />
            <div className="absolute w-36 h-36 rounded-full bg-[#7dd0ff]/15 animate-pulse duration-700" />
            {/* Pulsing Outer Glow Ring */}
            <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-[#54e98a] via-[#7dd0ff] to-[#54e98a] opacity-30 blur-md animate-spin duration-3000" />

            {/* Core Microphone Button */}
            <button
              onClick={() => setIsRecording(!isRecording)}
              className="relative z-10 w-[110px] h-[110px] sm:w-[120px] sm:h-[120px] rounded-full bg-gradient-to-br from-[#2ecc71] via-[#252a31] to-[#2a9acc] p-1 shadow-[0_0_30px_rgba(84,233,138,0.35)] flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
              id="mic-target"
              type="button"
            >
              <div className="w-full h-full rounded-full bg-[#0a0f15] flex flex-col items-center justify-center gap-0.5 group">
                <span
                  className="material-symbols-outlined text-[#54e98a] text-[38px] sm:text-[42px] group-hover:scale-110 transition-transform"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {isRecording ? 'mic' : 'mic_off'}
                </span>
                <span className="font-label-sm text-[9px] text-[#7dd0ff] uppercase tracking-widest font-semibold font-mono">
                  {isRecording ? 'Listening' : 'Paused'}
                </span>
              </div>
            </button>
          </div>

          {/* Digital Chrono Stopwatch */}
          <div className="flex flex-col items-center mt-2 z-10">
            <span className="font-numeric-metric responsive-numeric-xl text-[#dee3eb] tracking-tight font-bold">
              {formatTimer(elapsedCentis)}
            </span>
            <span className="font-label-sm text-[10px] sm:text-[11px] text-[#bbcbbb] uppercase tracking-wider font-mono">
              Acoustic Window Limit: 30s
            </span>
          </div>

          {/* Soundwave Live Reactance Bar Spectrum */}
          <div className="flex items-end justify-center gap-1.5 h-14 sm:h-16 w-full max-w-[320px] mt-4 px-2 z-10">
            {waveBars.map((height, i) => {
              const isCyan = i === 0 || i === 1 || i === 4 || i === 7 || i === 8 || i === 11 || i === 12 || i === 15;
              return (
                <span
                  key={i}
                  className={`w-1.5 sm:w-2 rounded-full transition-all duration-75 ${
                    isCyan ? 'bg-[#7dd0ff]' : 'bg-[#54e98a]'
                  }`}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>
        </div>

        {/* Right Column: Telemetry & Controls */}
        <div className="flex flex-col space-y-3">
          {/* Live Audio Telemetry Strip */}
          <div className="grid grid-cols-3 gap-2 w-full">
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#171c22] shadow-sm border border-white/5">
              <span className="font-label-sm text-[9px] text-[#bbcbbb] uppercase font-mono">Input Level</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-label-lg text-[13px] text-[#7dd0ff] font-bold font-mono">{decibels} dB</span>
                <span className="material-symbols-outlined text-[#7dd0ff] text-[14px]">volume_up</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#171c22] shadow-sm border border-white/5">
              <span className="font-label-sm text-[9px] text-[#bbcbbb] uppercase font-mono">Ambient Noise</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-label-lg text-[13px] text-[#54e98a] font-bold font-mono">Low</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#54e98a]" />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#171c22] shadow-sm border border-white/5">
              <span className="font-label-sm text-[9px] text-[#bbcbbb] uppercase font-mono">Vocal Clarity</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-label-lg text-[13px] text-[#6bfe9c] font-bold font-mono">{clarity}%</span>
                <span className="material-symbols-outlined text-[#6bfe9c] text-[14px]">verified</span>
              </div>
            </div>
          </div>

          {/* AI Sensory Analysis Guidance Box */}
          <div className="relative overflow-hidden rounded-xl bg-[#252a31] p-3.5 shadow-md border border-white/5">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-[#7dd0ff]/10 blur-xl pointer-events-none" />
            <div className="flex items-start gap-3 z-10 relative">
              <div className="w-9 h-9 rounded-lg bg-[#1b2026] flex items-center justify-center text-[#ffc37d] shrink-0 mt-0.5">
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  lightbulb
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-headline-sm text-[14px] text-[#dee3eb] font-semibold">
                  Neural Calibration Active
                </span>
                <p className="font-body-sm text-[12px] text-[#bbcbbb] leading-relaxed">
                  Speak naturally for 10–15 seconds for highest resolution. Our neural network analyzes pitch micro-jitters, glottal closure, and synthetic harmonic artifacts in real time.
                </p>
              </div>
            </div>
          </div>

          {/* Primary Action Button: Stop & Analyze */}
          <button
            onClick={handleStopAndAnalyze}
            className="w-full h-14 rounded-full bg-gradient-to-r from-[#2ecc71] via-[#54e98a] to-[#7dd0ff] text-[#003919] font-label-lg text-[13px] sm:text-[14px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_24px_-4px_rgba(46,204,113,0.45)] hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
            type="button"
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              stop
            </span>
            <span>Stop &amp; Analyze</span>
          </button>

          {/* Secondary Controls Bar */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={() => onNavigate('transcribe')}
              className="flex-1 py-2 px-2.5 rounded-xl bg-[#171c22] hover:bg-[#252a31] text-[#54e98a] hover:text-[#7dd0ff] font-label-md text-[12px] font-semibold transition-colors flex items-center justify-center gap-1 border border-[#54e98a]/20 active:scale-95 cursor-pointer"
              type="button"
              title="Transcribe spoken audio with gemini-3.5-transcribe"
            >
              <span className="material-symbols-outlined text-[16px]">speech_to_text</span>
              Transcribe
            </button>

            <button
              onClick={handleRestart}
              className="flex-1 py-2 px-2.5 rounded-xl bg-[#171c22] hover:bg-[#252a31] text-[#bbcbbb] hover:text-[#dee3eb] font-label-md text-[12px] transition-colors flex items-center justify-center gap-1 border border-white/5 active:scale-95 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              Restart
            </button>

            <button
              onClick={() => onNavigate('home')}
              className="flex-1 py-2 px-2.5 rounded-xl bg-[#171c22] hover:bg-[#252a31] text-[#ffb4ab]/80 hover:text-[#ffb4ab] font-label-md text-[12px] transition-colors flex items-center justify-center gap-1 border border-white/5 active:scale-95 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              Discard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
