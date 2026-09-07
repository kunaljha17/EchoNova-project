import React, { useState, useEffect, useRef } from 'react';
import { ScreenType, ScanHistoryItem } from '../types';

interface ReportScreenProps {
  scanItem?: ScanHistoryItem | null;
  onNavigate: (screen: ScreenType) => void;
  onShareReport?: () => void;
}

export const ReportScreen: React.FC<ReportScreenProps> = ({
  scanItem,
  onNavigate,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playProgress, setPlayProgress] = useState(28); // 28% -> ~6.8s
  const [speed, setSpeed] = useState<'1.0x' | '1.5x'>('1.0x');
  const [isLooping, setIsLooping] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const animRef = useRef<number | null>(null);

  const isSynthetic = scanItem ? scanItem.isSynthetic : true;
  const filename = scanItem ? scanItem.filename : 'incoming_call_record_89.wav';
  const confidence = scanItem ? scanItem.confidencePercent : 98.4;
  const modelName = scanItem ? scanItem.model : 'Zero-Day Vocoder';
  const findings =
    scanItem?.acousticFindings ||
    'Extremely high probability of latent diffusion neural voice generation.';

  useEffect(() => {
    if (isPlaying) {
      const step = () => {
        setPlayProgress((prev) => {
          const rate = speed === '1.5x' ? 0.45 : 0.3;
          const next = prev + rate;
          if (next >= 96) {
            if (isLooping) {
              return 4;
            } else {
              setIsPlaying(false);
              return 96;
            }
          }
          return next;
        });
        animRef.current = requestAnimationFrame(step);
      };
      animRef.current = requestAnimationFrame(step);
    } else {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, speed, isLooping]);

  const currentSeconds = ((playProgress / 100) * 24.0).toFixed(1);
  const formattedSeconds =
    Number(currentSeconds) < 10 ? `0:0${currentSeconds}` : `0:${currentSeconds}`;

  return (
    <div className="flex flex-col w-full pb-8 gap-4">
      {/* Subheader & Quick Export */}
      <div className="flex items-center justify-between mt-1 px-1">
        <div className="flex flex-col">
          <span className="font-label-sm text-[10px] text-[#7dd0ff] uppercase tracking-widest font-semibold">
            Acoustic Telemetry
          </span>
          <h2 className="font-headline-sm text-[18px] text-[#dee3eb] font-semibold tracking-tight">
            Forensic Audio Report
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowShareModal(true)}
            aria-label="Share or Export"
            className="w-10 h-10 rounded-full bg-[#252a31] hover:bg-[#30353c] flex items-center justify-center text-[#dee3eb] transition-transform active:scale-95 shadow-md border border-white/5 cursor-pointer"
            id="quick-export-btn"
          >
            <span className="material-symbols-outlined text-[20px]">ios_share</span>
          </button>
        </div>
      </div>

      {/* Analyzed File Metadata Pill */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#171c22] shadow-sm w-fit max-w-full border border-white/5">
        <span className="material-symbols-outlined text-[#7dd0ff] text-[16px] shrink-0">
          audio_file
        </span>
        <span className="font-label-md text-[11px] text-[#bbcbbb] truncate">
          {filename} <span className="text-[#869486] mx-1">•</span> Scanned today at 14:32
        </span>
      </div>

      {/* Main Responsive Grid Layout for Tablet & Desktop */}
      <div className="responsive-2col-grid mt-1">
        {/* Left Column: Verdict & Forensic Oscillogram Scope */}
        <div className="flex flex-col space-y-4">
          {/* Main Verdict Card (Controlled Alarm Hero) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0a0f15] p-4 shadow-xl border border-white/5">
        {/* Ambient Red/Amber Forensic Glow Layer */}
        {isSynthetic ? (
          <>
            <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[#93000a]/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-44 h-44 rounded-full bg-[#f8a018]/15 blur-3xl pointer-events-none" />
          </>
        ) : (
          <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[#54e98a]/15 blur-3xl pointer-events-none" />
        )}

        <div className="relative z-10 flex flex-col gap-3">
          {/* Top Alert Ribbon */}
          <div className="flex items-center justify-between">
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${
                isSynthetic
                  ? 'bg-[#93000a] text-[#ffdad6]'
                  : 'bg-[#005027] text-[#6bfe9c]'
              }`}
            >
              <span className="material-symbols-outlined text-[15px] animate-pulse">
                {isSynthetic ? 'crisis_alert' : 'verified'}
              </span>
              <span className="font-label-sm text-[10px] uppercase tracking-wider font-bold">
                {isSynthetic ? 'High Risk Threat' : 'Authentic Human Voice'}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[#ffc37d] font-label-sm text-[11px]">
              <span className="material-symbols-outlined text-[14px]">bolt</span>
              <span>{isSynthetic ? modelName : 'Natural Resonance'}</span>
            </div>
          </div>

          {/* Icon + Verdict Display */}
          <div className="flex items-start gap-3 mt-1">
            <div
              className={`relative shrink-0 flex items-center justify-center w-14 h-14 rounded-xl shadow-inner ${
                isSynthetic
                  ? 'bg-[#93000a]/40 text-[#ffb4ab]'
                  : 'bg-[#54e98a]/20 text-[#54e98a]'
              }`}
            >
              <svg
                className="w-8 h-8 drop-shadow-[0_0_8px_rgba(255,180,171,0.4)]"
                fill="none"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L3 6V11.5C3 16.8 6.8 21.6 12 23C17.2 21.6 21 16.8 21 11.5V6L12 2Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
                {isSynthetic ? (
                  <>
                    <path d="M12 8V13" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                    <circle cx="12" cy="16.5" fill="currentColor" r="1.25" />
                  </>
                ) : (
                  <path d="M8 12L11 15L16 9" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                )}
              </svg>
              {isSynthetic && (
                <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ffb4ab]">
                  <span className="h-2 w-2 rounded-full bg-[#690005] animate-ping" />
                </span>
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <span
                className={`font-label-sm text-[10px] uppercase tracking-wider ${
                  isSynthetic ? 'text-[#ffb4ab]' : 'text-[#54e98a]'
                }`}
              >
                {isSynthetic ? 'Synthesized Audio Match' : 'Biometric Audio Match'}
              </span>
              <h3 className="font-headline-md text-[20px] font-bold text-[#dee3eb] leading-tight tracking-tight">
                {isSynthetic ? 'Cloned / AI-Generated Voice' : 'Verified Human Speech Track'}
              </h3>
            </div>
          </div>

          {/* Confidence Metric & Gauge */}
          <div className="mt-1 bg-[#252a31]/60 rounded-xl p-3 flex flex-col gap-1.5 backdrop-blur-md border border-white/5">
            <div className="flex justify-between items-baseline">
              <span className="font-body-sm text-[12px] text-[#bbcbbb] font-medium">
                Model Confidence
              </span>
              <div className="flex items-baseline gap-1">
                <span
                  className={`font-numeric-metric text-[26px] font-bold tracking-tight ${
                    isSynthetic ? 'text-[#ffb4ab]' : 'text-[#54e98a]'
                  }`}
                >
                  {confidence}%
                </span>
                <span className="font-label-sm text-[10px] text-[#bbcbbb] uppercase font-mono">
                  {isSynthetic ? 'Synthetic' : 'Authentic'}
                </span>
              </div>
            </div>

            {/* Meter bar */}
            <div className="relative w-full h-2 rounded-full bg-[#30353c] overflow-hidden">
              <div
                className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                  isSynthetic
                    ? 'bg-gradient-to-r from-[#f8a018] via-[#ffb4ab] to-[#ffb4ab] shadow-[0_0_10px_rgba(255,180,171,0.6)]'
                    : 'bg-gradient-to-r from-[#54e98a] to-[#2ecc71] shadow-[0_0_10px_rgba(84,233,138,0.6)]'
                }`}
                style={{ width: `${confidence}%` }}
              />
            </div>

            <p className="font-body-sm text-[11px] text-[#bbcbbb] flex items-center gap-1.5 mt-0.5">
              <span className="material-symbols-outlined text-[15px] text-[#ffc37d]">warning</span>
              {findings}
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Waveform Forensic Scope */}
      <div className="flex flex-col rounded-2xl bg-[#1b2026] p-4 shadow-md gap-3 border border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#7dd0ff] text-[20px]">graphic_eq</span>
            <span className="font-label-lg text-[13px] font-semibold text-[#dee3eb]">
              Acoustic Oscillogram
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-[#252a31] text-[#7dd0ff] font-label-sm text-[10px] font-medium font-mono">
            24.0s Sample
          </span>
        </div>

        {/* Scrubber Area */}
        <div className="relative w-full bg-[#0a0f15] rounded-xl p-3 overflow-hidden flex flex-col gap-2 border border-white/5">
          {/* Waveform Graph SVG */}
          <div
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
              setPlayProgress(pct);
            }}
            className="relative w-full h-24 flex items-center cursor-pointer select-none"
          >
            <svg
              className="w-full h-full preserve-3d"
              preserveAspectRatio="none"
              viewBox="0 0 380 96"
            >
              <defs>
                <linearGradient id="safeWave" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#7dd0ff" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#54e98a" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="flaggedWave" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffb4ab" stopOpacity="1" />
                  <stop offset="100%" stopColor="#93000a" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              {/* Flagged anomaly background spans */}
              {isSynthetic && (
                <>
                  <rect
                    fill="#93000a"
                    fillOpacity="0.3"
                    height="88"
                    rx="6"
                    stroke="none"
                    width="79"
                    x="63"
                    y="4"
                  />
                  <rect
                    fill="#93000a"
                    fillOpacity="0.3"
                    height="88"
                    rx="6"
                    stroke="none"
                    width="64"
                    x="221"
                    y="4"
                  />
                </>
              )}

              {/* Center Reference Line */}
              <line stroke="#30353c" strokeDasharray="3 3" strokeWidth="1" x1="0" x2="380" y1="48" y2="48" />

              {/* Waveform Bars Segment 1: Safe baseline */}
              <g fill="url(#safeWave)">
                <rect height="20" rx="1.5" width="3" x="6" y="38" />
                <rect height="36" rx="1.5" width="3" x="15" y="30" />
                <rect height="48" rx="1.5" width="3" x="24" y="24" />
                <rect height="28" rx="1.5" width="3" x="33" y="34" />
                <rect height="56" rx="1.5" width="3" x="42" y="20" />
                <rect height="40" rx="1.5" width="3" x="51" y="28" />
              </g>

              {/* Segment 2: Glottal Pulse Artifacts */}
              <g fill={isSynthetic ? 'url(#flaggedWave)' : 'url(#safeWave)'}>
                <rect height="76" rx="1.75" width="3.5" x="63" y="10" />
                <rect height="84" rx="1.75" width="3.5" x="73" y="6" />
                <rect height="68" rx="1.75" width="3.5" x="83" y="14" />
                <rect height="88" rx="1.75" width="3.5" x="93" y="4" />
                <rect height="72" rx="1.75" width="3.5" x="103" y="12" />
                <rect height="80" rx="1.75" width="3.5" x="113" y="8" />
                <rect height="64" rx="1.75" width="3.5" x="123" y="16" />
                <rect height="76" rx="1.75" width="3.5" x="133" y="10" />
              </g>

              {/* Segment 3: Safe Mid */}
              <g fill="url(#safeWave)">
                <rect height="32" rx="1.5" width="3" x="146" y="32" />
                <rect height="44" rx="1.5" width="3" x="156" y="26" />
                <rect height="24" rx="1.5" width="3" x="166" y="36" />
                <rect height="52" rx="1.5" width="3" x="176" y="22" />
                <rect height="40" rx="1.5" width="3" x="186" y="28" />
                <rect height="36" rx="1.5" width="3" x="196" y="30" />
                <rect height="20" rx="1.5" width="3" x="206" y="38" />
              </g>

              {/* Segment 4: Anomaly 2 - Spectral Discontinuity */}
              <g fill={isSynthetic ? 'url(#flaggedWave)' : 'url(#safeWave)'}>
                <rect height="80" rx="1.75" width="3.5" x="221" y="8" />
                <rect height="88" rx="1.75" width="3.5" x="231" y="4" />
                <rect height="72" rx="1.75" width="3.5" x="241" y="12" />
                <rect height="84" rx="1.75" width="3.5" x="251" y="6" />
                <rect height="76" rx="1.75" width="3.5" x="261" y="10" />
                <rect height="64" rx="1.75" width="3.5" x="271" y="16" />
                <rect height="72" rx="1.75" width="3.5" x="281" y="12" />
              </g>

              {/* Segment 5: Trailing */}
              <g fill="url(#safeWave)">
                <rect height="28" rx="1.5" width="3" x="294" y="34" />
                <rect height="44" rx="1.5" width="3" x="304" y="26" />
                <rect height="24" rx="1.5" width="3" x="314" y="36" />
                <rect height="16" rx="1.5" width="3" x="324" y="40" />
                <rect height="36" rx="1.5" width="3" x="334" y="30" />
                <rect height="48" rx="1.5" width="3" x="344" y="24" />
                <rect height="32" rx="1.5" width="3" x="354" y="32" />
                <rect height="12" rx="1.5" width="3" x="364" y="42" />
              </g>
            </svg>

            {/* Dynamic Playhead indicator line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[#7dd0ff] shadow-[0_0_8px_#7dd0ff] pointer-events-none transition-all duration-75"
              style={{ left: `${playProgress}%` }}
            >
              <div className="w-2.5 h-2.5 -ml-1 rounded-full bg-[#7dd0ff] shadow-md" />
            </div>
          </div>

          {/* Scrubber Playback Controls */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                aria-label="Play sample"
                className="w-9 h-9 rounded-full bg-[#54e98a] text-[#003919] flex items-center justify-center shadow hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <div className="flex flex-col">
                <span className="font-label-md text-[13px] text-[#dee3eb] font-semibold font-mono">
                  {formattedSeconds}
                </span>
                <span className="font-label-sm text-[10px] text-[#bbcbbb] font-mono">/ 0:24.0</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSpeed(speed === '1.0x' ? '1.5x' : '1.0x')}
                className="px-2.5 py-1 rounded-full bg-[#252a31] text-[#dee3eb] font-label-sm text-[11px] hover:bg-[#30353c] cursor-pointer"
              >
                {speed}
              </button>
              <button
                onClick={() => setIsLooping(!isLooping)}
                aria-label="Loop Segment"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                  isLooping
                    ? 'bg-[#54e98a]/20 text-[#54e98a]'
                    : 'bg-[#252a31] text-[#dee3eb] hover:bg-[#30353c]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">repeat</span>
              </button>
            </div>
          </div>
        </div>

        {/* Flagged Segment Pill Tags */}
        {isSynthetic && (
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="font-label-sm text-[10px] uppercase tracking-wider text-[#869486] font-semibold">
              Flagged Forensic Anomalies
            </span>
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setPlayProgress(25)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#171c22] hover:bg-[#252a31] text-left transition-colors cursor-pointer border border-white/5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#ffb4ab] shrink-0" />
                  <span className="font-label-md text-[12px] text-[#dee3eb] font-medium truncate">
                    Robotic Glottal Pulse
                  </span>
                </div>
                <span className="font-label-sm text-[10px] text-[#ffb4ab] bg-[#93000a]/40 px-2 py-0.5 rounded-md shrink-0 font-bold font-mono">
                  {scanItem?.glottalPulseWindow || '0:04 - 0:09'}
                </span>
              </button>

              <button
                onClick={() => setPlayProgress(62)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#171c22] hover:bg-[#252a31] text-left transition-colors cursor-pointer border border-white/5"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[#f8a018] shrink-0" />
                  <span className="font-label-md text-[12px] text-[#dee3eb] font-medium truncate">
                    Synthetic Spectral Discontinuity
                  </span>
                </div>
                <span className="font-label-sm text-[10px] text-[#ffc37d] bg-[#30353c] px-2 py-0.5 rounded-md shrink-0 font-bold font-mono">
                  {scanItem?.spectralDiscontinuityWindow || '0:14 - 0:18'}
                </span>
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Right Column: Diagnostics Telemetry, Technical Specs, Action CTAs */}
      <div className="flex flex-col space-y-4">
        {/* Expandable Forensic Diagnostic Breakdown */}
      <div className="flex flex-col rounded-2xl bg-[#1b2026] p-4 shadow-md gap-2 border border-white/5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="flex items-center justify-between w-full text-left cursor-pointer"
          id="toggle-forensics"
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#54e98a] text-[20px]">
              analytics
            </span>
            <span className="font-label-lg text-[13px] font-semibold text-[#dee3eb]">
              Neural Diagnostic Telemetry
            </span>
          </div>
          <span
            className={`material-symbols-outlined text-[#bbcbbb] transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            expand_more
          </span>
        </button>

        {/* Diagnostics Content List */}
        {isExpanded && (
          <div className="flex flex-col gap-2 mt-1" id="forensics-content">
            {/* Metric 1 */}
            <div className="flex flex-col p-3 rounded-xl bg-[#171c22] gap-1 border border-white/5">
              <div className="flex justify-between items-center">
                <span className="font-label-md text-[12px] text-[#dee3eb] font-medium">
                  Neural Consistency Score
                </span>
                <span
                  className={`font-label-md text-[12px] font-bold ${
                    isSynthetic ? 'text-[#ffb4ab]' : 'text-[#54e98a]'
                  }`}
                >
                  {scanItem?.neuralConsistency ?? 98.4}% {isSynthetic ? 'Synthetic' : 'Organic'}
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-[#bbcbbb] leading-snug">
                Spectral weight distributions deviate significantly from biological human vocal tract profiles.
              </p>
            </div>

            {/* Metric 2 */}
            <div className="flex flex-col p-3 rounded-xl bg-[#171c22] gap-1 border border-white/5">
              <div className="flex justify-between items-center">
                <span className="font-label-md text-[12px] text-[#dee3eb] font-medium">
                  Breath &amp; Micro-tremor Anomaly
                </span>
                <span
                  className={`font-label-sm text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isSynthetic
                      ? 'bg-[#93000a] text-[#ffdad6]'
                      : 'bg-[#005027] text-[#6bfe9c]'
                  }`}
                >
                  {scanItem?.breathAnomalySeverity || 'CRITICAL'}
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-[#bbcbbb] leading-snug">
                Absence of human autonomic respiratory pauses and microscopic vocal cord tension flutter.
              </p>
            </div>

            {/* Metric 3 */}
            <div className="flex flex-col p-3 rounded-xl bg-[#171c22] gap-1 border border-white/5">
              <div className="flex justify-between items-center">
                <span className="font-label-md text-[12px] text-[#dee3eb] font-medium">
                  Acoustic Harmonic Jitter
                </span>
                <span className="font-label-md text-[12px] text-[#ffc37d] font-bold">
                  {scanItem?.harmonicDiffusionMatch ?? 96.0}% Diffusion Match
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-[#bbcbbb] leading-snug">
                High correlation with high-order generative mel-spectrogram vocoder architectures.
              </p>
            </div>

            {/* Metric 4 */}
            <div className="flex flex-col p-3 rounded-xl bg-[#171c22] gap-1 border border-white/5">
              <div className="flex justify-between items-center">
                <span className="font-label-md text-[12px] text-[#dee3eb] font-medium">
                  Phase Frequency Cutoff
                </span>
                <span className="font-label-md text-[12px] text-[#7dd0ff] font-bold">
                  {scanItem?.phaseCutoff || '4.2 kHz Hard Cutoff'}
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-[#bbcbbb] leading-snug">
                Unnatural high-frequency attenuation typical of low-latency inference speech pipelines.
              </p>
            </div>
          </div>
        )}
      </div>

        {/* Biometric Technical Specifications Card */}
        <div className="p-4 rounded-2xl bg-[#171c22] border border-white/5 space-y-2.5">
          <span className="font-label-sm text-[11px] text-[#7dd0ff] uppercase tracking-wider font-semibold font-mono flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">settings_input_component</span>
            Forensic Acoustic Signature Specs
          </span>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 rounded-lg bg-[#0a0f15] border border-white/5">
              <span className="text-[#869486] block text-[9px] uppercase">Sample Rate</span>
              <span className="text-[#dee3eb] font-bold">48,000 Hz</span>
            </div>
            <div className="p-2 rounded-lg bg-[#0a0f15] border border-white/5">
              <span className="text-[#869486] block text-[9px] uppercase">Audio Codec</span>
              <span className="text-[#dee3eb] font-bold">PCM 24-bit stereo</span>
            </div>
            <div className="p-2 rounded-lg bg-[#0a0f15] border border-white/5">
              <span className="text-[#869486] block text-[9px] uppercase">Mel Bands</span>
              <span className="text-[#dee3eb] font-bold">128 Mel Filters</span>
            </div>
            <div className="p-2 rounded-lg bg-[#0a0f15] border border-white/5">
              <span className="text-[#869486] block text-[9px] uppercase">Classifier Seed</span>
              <span className="text-[#54e98a] font-bold">SHA-256 #891F</span>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
      <div className="flex flex-col gap-2 mt-2">
        {/* Primary CTA */}
        <button
          onClick={() => onNavigate('scan_record')}
          className="w-full h-[52px] rounded-full bg-gradient-to-r from-[#2ecc71] via-[#54e98a] to-[#7dd0ff] flex items-center justify-center gap-2 text-[#003919] font-label-lg text-[13px] font-bold uppercase tracking-wider shadow-lg shadow-[#54e98a]/20 active:scale-[0.98] transition-transform cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">mic_external_on</span>
          <span>Analyze Another Clip</span>
        </button>

        {/* Secondary CTA */}
        <button
          onClick={() => setShowShareModal(true)}
          className="w-full h-12 rounded-full bg-[#252a31] hover:bg-[#353a40] flex items-center justify-center gap-2 text-[#dee3eb] font-label-md text-[12px] font-semibold transition-colors active:scale-[0.99] shadow-sm border border-white/5 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px] text-[#7dd0ff]">picture_as_pdf</span>
          <span>Share Forensic Report (PDF)</span>
        </button>

        {/* False Positive Report Link */}
        <div className="flex justify-center mt-1">
          <button
            onClick={() => setShowFeedbackModal(true)}
            className="text-center font-body-sm text-[12px] text-[#869486] hover:text-[#dee3eb] underline underline-offset-4 transition-colors py-1 cursor-pointer"
          >
            Flag as False Positive / Submit Feedback
          </button>
        </div>
      </div>
        </div>
      </div>

      {/* Share Modal Dialog */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#1b2026] rounded-2xl p-5 max-w-[360px] w-full border border-white/10 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-[16px] text-[#dee3eb] font-semibold">
                Export Forensic Report
              </span>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-7 h-7 rounded-full bg-[#252a31] flex items-center justify-center text-[#bbcbbb] hover:text-[#dee3eb]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="text-[12px] text-[#bbcbbb]">
              Report ID: <span className="font-mono text-[#7dd0ff]">VG-2026-0907-89</span>
            </p>
            <div className="bg-[#0a0f15] p-3 rounded-xl text-[11px] font-mono text-[#dee3eb] space-y-1">
              <div>File: {filename}</div>
              <div>Verdict: {isSynthetic ? 'Synthetic Deepfake (98.4%)' : 'Authentic Human (99.6%)'}</div>
              <div>Hash: sha256-4c9f1a2e8870</div>
              <div>Sign: Cryptographic Seal Active</div>
            </div>
            <button
              onClick={() => {
                alert('Forensic PDF report generated and downloaded to device.');
                setShowShareModal(false);
              }}
              className="w-full py-2.5 rounded-full bg-[#54e98a] text-[#003919] font-label-md text-[12px] font-bold uppercase tracking-wider"
            >
              Download PDF Report
            </button>
          </div>
        </div>
      )}

      {/* Feedback Dialog */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#1b2026] rounded-2xl p-5 max-w-[360px] w-full border border-white/10 shadow-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="font-headline-sm text-[16px] text-[#dee3eb] font-semibold">
                Submit Forensic Feedback
              </span>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setFeedbackSubmitted(false);
                }}
                className="w-7 h-7 rounded-full bg-[#252a31] flex items-center justify-center text-[#bbcbbb] hover:text-[#dee3eb]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {feedbackSubmitted ? (
              <div className="py-4 text-center space-y-2">
                <span className="material-symbols-outlined text-[36px] text-[#54e98a]">check_circle</span>
                <p className="text-[13px] text-[#dee3eb] font-semibold">Feedback Received</p>
                <p className="text-[11px] text-[#bbcbbb]">
                  Thank you. Audio sample telemetry has been logged for engine re-calibration.
                </p>
              </div>
            ) : (
              <>
                <p className="text-[12px] text-[#bbcbbb]">
                  Help calibrate the spectral neural classifier by flagging discrepancies.
                </p>
                <textarea
                  placeholder="Describe acoustic characteristics or speaker background..."
                  className="w-full h-20 p-2.5 rounded-xl bg-[#0a0f15] border border-white/10 text-[12px] text-[#dee3eb] focus:outline-none focus:border-[#7dd0ff]"
                />
                <button
                  onClick={() => setFeedbackSubmitted(true)}
                  className="w-full py-2.5 rounded-full bg-[#252a31] hover:bg-[#353a40] text-[#dee3eb] font-label-md text-[12px] font-bold uppercase tracking-wider border border-white/5"
                >
                  Send Diagnostics to Lab
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
