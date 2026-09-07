import React, { useState } from 'react';
import { ScreenType, SampleClip, ScanHistoryItem } from '../types';
import { SAMPLES_DATA } from '../data/mockData';

interface SamplesScreenProps {
  onNavigate: (screen: ScreenType) => void;
  onSelectScan: (scan: ScanHistoryItem) => void;
}

export const SamplesScreen: React.FC<SamplesScreenProps> = ({
  onNavigate,
  onSelectScan,
}) => {
  const [filter, setFilter] = useState<'all' | 'authentic' | 'cloned'>('all');
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);

  // Modal State
  const [activeModalClip, setActiveModalClip] = useState<SampleClip | null>(null);

  const filteredClips = SAMPLES_DATA.filter((clip) => {
    if (filter === 'all') return true;
    return clip.type === filter;
  });

  const authenticCount = SAMPLES_DATA.filter((c) => c.type === 'authentic').length;
  const clonedCount = SAMPLES_DATA.filter((c) => c.type === 'cloned').length;

  const togglePlay = (id: string) => {
    setPlayingClipId(playingClipId === id ? null : id);
  };

  const handleAnalyzeClip = (clip: SampleClip) => {
    setActiveModalClip(clip);
  };

  const handleViewFullReport = (clip: SampleClip) => {
    const scanItem: ScanHistoryItem = {
      id: clip.id,
      filename: `${clip.title.replace(/\s+/g, '_')}.wav`,
      timeAgo: 'Just now',
      duration: clip.duration,
      isSynthetic: clip.type === 'cloned',
      classification: clip.confidenceLabel,
      confidencePercent: clip.confidenceNum,
      anomalyTag: clip.notes,
      model: clip.model,
      acousticFindings: clip.notes,
      glottalPulseWindow: '0:04 - 0:09',
      spectralDiscontinuityWindow: '0:12 - 0:17',
      neuralConsistency: clip.type === 'cloned' ? clip.confidenceNum : 2.4,
      harmonicDiffusionMatch: clip.type === 'cloned' ? 95.5 : 3.0,
      phaseCutoff: clip.type === 'cloned' ? '4.2 kHz Hard Cutoff' : 'Full Spectrum 24-bit',
      breathAnomalySeverity: clip.type === 'cloned' ? 'CRITICAL' : 'NORMAL',
    };
    onSelectScan(scanItem);
    setActiveModalClip(null);
    onNavigate('incident_report');
  };

  return (
    <div className="flex flex-col w-full pb-6 space-y-4">
      {/* Interactive Diagnostic Lab Header */}
      <div className="relative overflow-hidden rounded-xl bg-[#1b2026] p-4 shadow-md border border-white/5">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[#54e98a]/10 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 mb-1">
          <span className="material-symbols-outlined text-[#54e98a] text-[20px]">science</span>
          <span className="font-label-sm text-[10px] uppercase tracking-wider text-[#54e98a] font-semibold">
            Acoustic Forensics Lab
          </span>
        </div>
        <h2 className="font-headline-md text-[20px] text-[#dee3eb] font-bold tracking-tight">
          Curated Test Bench
        </h2>
        <p className="font-body-sm text-[12px] text-[#bbcbbb] mt-1 leading-relaxed">
          Benchmark our forensic engine against real human speech and cutting-edge neural voice clones (ElevenLabs, VALL-E, OpenVoice).
        </p>

        {/* Visual Shield Telemetry Mini Graphic */}
        <div className="mt-3 flex items-center justify-between bg-[#0a0f15] px-3 py-2 rounded-lg border border-white/5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#54e98a] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#54e98a]" />
            </span>
            <span className="font-label-sm text-[11px] text-[#dee3eb]">
              Dual-Model Spectral Classifier active
            </span>
          </div>
          <span className="font-label-sm text-[11px] text-[#7dd0ff] font-semibold font-mono">
            99.8% Acc
          </span>
        </div>
      </div>

      {/* Filter Switcher Segment */}
      <div className="flex items-center gap-1.5 p-1 bg-[#0a0f15] rounded-xl overflow-x-auto no-scrollbar border border-white/5">
        <button
          onClick={() => setFilter('all')}
          className={`tab-btn flex-1 py-2 px-2 rounded-lg font-label-sm text-[11px] whitespace-nowrap transition-all flex items-center justify-center gap-1 cursor-pointer ${
            filter === 'all'
              ? 'bg-[#252a31] text-[#54e98a] shadow-sm font-semibold'
              : 'text-[#bbcbbb] hover:text-[#dee3eb]'
          }`}
          id="filter-all"
        >
          <span>All Samples</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[9px] ${
              filter === 'all' ? 'bg-[#54e98a]/20 text-[#54e98a]' : 'bg-[#30353c] text-[#bbcbbb]'
            }`}
          >
            {SAMPLES_DATA.length}
          </span>
        </button>

        <button
          onClick={() => setFilter('authentic')}
          className={`tab-btn flex-1 py-2 px-2 rounded-lg font-label-sm text-[11px] whitespace-nowrap transition-all flex items-center justify-center gap-1 cursor-pointer ${
            filter === 'authentic'
              ? 'bg-[#252a31] text-[#54e98a] shadow-sm font-semibold'
              : 'text-[#bbcbbb] hover:text-[#dee3eb]'
          }`}
          id="filter-authentic"
        >
          <span>Authentic</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[9px] ${
              filter === 'authentic'
                ? 'bg-[#54e98a]/20 text-[#54e98a]'
                : 'bg-[#30353c] text-[#bbcbbb]'
            }`}
          >
            {authenticCount}
          </span>
        </button>

        <button
          onClick={() => setFilter('cloned')}
          className={`tab-btn flex-1 py-2 px-2 rounded-lg font-label-sm text-[11px] whitespace-nowrap transition-all flex items-center justify-center gap-1 cursor-pointer ${
            filter === 'cloned'
              ? 'bg-[#252a31] text-[#ffb4ab] shadow-sm font-semibold'
              : 'text-[#bbcbbb] hover:text-[#dee3eb]'
          }`}
          id="filter-cloned"
        >
          <span>Deepfakes</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[9px] ${
              filter === 'cloned'
                ? 'bg-[#93000a] text-[#ffdad6]'
                : 'bg-[#30353c] text-[#bbcbbb]'
            }`}
          >
            {clonedCount}
          </span>
        </button>
      </div>

      {/* Audio Clips Stack */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4" id="samples-container">
        {filteredClips.map((clip) => {
          const isCloned = clip.type === 'cloned';
          const isPlaying = playingClipId === clip.id;

          return (
            <div
              key={clip.id}
              className="clip-card relative rounded-xl bg-[#1b2026] p-4 flex flex-col gap-2.5 shadow-md transition-all hover:bg-[#252a31] border border-white/5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-sm text-[10px] font-semibold ${
                      isCloned
                        ? 'bg-[#93000a] text-[#ffdad6]'
                        : 'bg-[#54e98a]/15 text-[#54e98a]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isCloned ? 'bg-[#ffb4ab] animate-pulse' : 'bg-[#54e98a]'
                      }`}
                    />
                    {clip.badge}
                  </span>
                </div>
                <span className="font-label-sm text-[11px] text-[#bbcbbb] font-mono">
                  {clip.duration}
                </span>
              </div>

              <div>
                <h3 className="font-headline-sm text-[15px] text-[#dee3eb] font-semibold">
                  {clip.title}
                </h3>
                <p className="font-body-sm text-[12px] text-[#bbcbbb] mt-0.5 leading-snug">
                  {clip.description}
                </p>
              </div>

              {/* Playback & Mini Waveform Track */}
              <div className="bg-[#0a0f15] rounded-lg p-2 flex items-center gap-2.5 border border-white/5">
                <button
                  onClick={() => togglePlay(clip.id)}
                  className={`w-9 h-9 rounded-full bg-[#30353c] flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ${
                    isPlaying ? 'text-[#54e98a] bg-[#252a31]' : 'text-[#dee3eb] hover:text-[#54e98a]'
                  }`}
                  aria-label="Toggle sample playback"
                >
                  <span
                    className="material-symbols-outlined text-[20px] play-icon"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </button>

                {/* Mini Waveform Bars */}
                <div className="flex-1 flex items-center gap-[3px] h-7 overflow-hidden px-1">
                  {clip.waveHeights.map((h, i) => {
                    let barColor = 'bg-[#7dd0ff]';
                    if (isCloned) {
                      barColor = i % 3 === 0 ? 'bg-[#ffb4ab]' : 'bg-[#f8a018]';
                    } else {
                      barColor = i % 2 === 0 ? 'bg-[#54e98a]' : 'bg-[#7dd0ff]';
                    }

                    const dynamicHeight = isPlaying ? Math.floor(Math.random() * 60) + 20 : h;

                    return (
                      <div
                        key={i}
                        className={`w-[3px] rounded-full transition-all duration-200 ${barColor}`}
                        style={{ height: `${(dynamicHeight / 100) * 26}px` }}
                      />
                    );
                  })}
                </div>

                <span
                  className={`font-label-sm text-[11px] font-bold flex-shrink-0 font-mono ${
                    isCloned ? 'text-[#ffb4ab]' : 'text-[#54e98a]'
                  }`}
                >
                  {clip.confidenceLabel}
                </span>
              </div>

              {/* Analyze Action */}
              <button
                onClick={() => handleAnalyzeClip(clip)}
                className="w-full h-10 rounded-full bg-[#30353c] text-[#dee3eb] hover:bg-[#353a40] font-label-md text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-white/5"
              >
                <span className="material-symbols-outlined text-[18px]">query_stats</span>
                Analyze Clip
              </button>
            </div>
          );
        })}
      </div>

      {/* Interactive Diagnostic Inspection Drawer Modal */}
      {activeModalClip && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-[430px] bg-[#1b2026] rounded-2xl p-4 shadow-2xl border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#54e98a] text-[20px]">
                  graphic_eq
                </span>
                <span className="font-label-md text-[13px] text-[#dee3eb] font-semibold" id="modal-title">
                  {activeModalClip.title}
                </span>
              </div>
              <button
                onClick={() => setActiveModalClip(null)}
                className="w-7 h-7 rounded-full bg-[#252a31] flex items-center justify-center text-[#bbcbbb] hover:text-[#dee3eb] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="bg-[#0a0f15] rounded-xl p-3 space-y-2 border border-white/5">
              <div className="flex justify-between items-center">
                <span className="font-label-sm text-[11px] text-[#bbcbbb]">Model Verdict</span>
                <span className="font-label-sm text-[11px] text-[#54e98a] font-medium" id="modal-model">
                  {activeModalClip.model}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="font-label-sm text-[11px] text-[#bbcbbb]">Confidence Metric</span>
                <span
                  className={`font-numeric-metric text-[22px] font-bold ${
                    activeModalClip.type === 'cloned' ? 'text-[#ffb4ab]' : 'text-[#7dd0ff]'
                  }`}
                  id="modal-confidence"
                >
                  {activeModalClip.confidenceNum}%
                </span>
              </div>

              <div className="pt-1">
                <span className="font-label-sm text-[11px] text-[#bbcbbb] block mb-1">
                  Acoustic Findings
                </span>
                <p className="font-body-sm text-[12px] text-[#dee3eb] leading-relaxed" id="modal-notes">
                  {activeModalClip.notes}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleViewFullReport(activeModalClip)}
                className="flex-1 h-11 rounded-full bg-gradient-to-r from-[#2ecc71] to-[#2a9acc] text-[#003919] font-label-md text-[12px] uppercase tracking-wider font-bold shadow-md cursor-pointer"
              >
                Full Oscillogram →
              </button>
              <button
                onClick={() => setActiveModalClip(null)}
                className="px-4 h-11 rounded-full bg-[#252a31] text-[#bbcbbb] hover:text-[#dee3eb] font-label-md text-[12px] font-semibold cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Quick-Action Interactive Callout Banner */}
      <div className="relative overflow-hidden rounded-xl bg-[#1b2026] p-4 shadow-md flex items-center gap-3 border border-white/5">
        <div className="w-12 h-12 rounded-xl bg-[#7dd0ff]/15 flex items-center justify-center flex-shrink-0 text-[#7dd0ff]">
          <span className="material-symbols-outlined text-[26px]">upload_file</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-headline-sm text-[14px] font-semibold text-[#dee3eb]">
            Test Your Own Clone?
          </h4>
          <p className="font-body-sm text-[12px] text-[#bbcbbb] truncate">
            Upload custom voice sample to inspect artifacts.
          </p>
        </div>
        <button
          onClick={() => onNavigate('analyze_upload')}
          className="h-9 px-4 rounded-full bg-[#7dd0ff] text-[#00344a] font-label-sm text-[11px] uppercase tracking-wider font-bold shadow-sm hover:opacity-90 flex-shrink-0 transition-opacity cursor-pointer"
        >
          Upload
        </button>
      </div>
    </div>
  );
};
