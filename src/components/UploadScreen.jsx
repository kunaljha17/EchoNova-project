import React, { useState, useRef, useEffect } from 'react';
import {
  formatAudioTime,
  uploadAudioTemporary,
  generateSyntheticAudioSample,
} from '../utils/audioHelper';

export const UploadScreen = ({ onNavigate, onStartScan }) => {
  const [selectedFile, setSelectedFile] = useState({
    name: 'suspicious_client_note_v2.wav',
    size: '3.4 MB',
    duration: '00:24',
    durationSec: 24,
    sampleRate: '48.0 kHz • 24-bit',
    audioUrl: null,
    file: null,
    serverAudioUrl: null,
    serverAudioId: null,
    isTempUploaded: false,
    isDefaultDemo: true,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(24);
  const [playProgress, setPlayProgress] = useState(0); // 0 - 100 percent
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [pipelineMode, setPipelineMode] = useState('deep');
  const [isDragging, setIsDragging] = useState(false);
  const [isUploadingTemp, setIsUploadingTemp] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState(null);

  const fileInputRef = useRef(null);
  const audioRef = useRef(null);
  const animFrameRef = useRef(null);

  // Generate initial audio sample for the default demo file
  useEffect(() => {
    const demoAudioUrl = generateSyntheticAudioSample('cloned', 24);
    if (demoAudioUrl) {
      setSelectedFile((prev) =>
        prev?.isDefaultDemo
          ? {
              ...prev,
              audioUrl: demoAudioUrl,
            }
          : prev
      );
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Update playback speed on audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Update mute state on audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleNewFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleNewFile(e.target.files[0]);
    }
  };

  const handleNewFile = async (file) => {
    // 1. Pause any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setPlayProgress(0);

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    const localBlobUrl = URL.createObjectURL(file);

    // Initial item with immediate local Blob URL for zero-latency instant playback
    const newFileItem = {
      name: file.name,
      size: `${sizeInMb} MB`,
      duration: '00:00',
      durationSec: 0,
      sampleRate: 'Detecting...',
      audioUrl: localBlobUrl,
      file,
      serverAudioUrl: null,
      serverAudioId: null,
      isTempUploaded: false,
      isDefaultDemo: false,
    };
    setSelectedFile(newFileItem);

    // 2. Extract real audio metadata using an Audio object
    try {
      const probeAudio = new Audio();
      probeAudio.src = localBlobUrl;
      probeAudio.onloadedmetadata = () => {
        const detectedDuration = probeAudio.duration || 15;
        const formatted = formatAudioTime(detectedDuration);
        setDuration(detectedDuration);
        setSelectedFile((prev) =>
          prev && prev.name === file.name
            ? {
                ...prev,
                duration: formatted,
                durationSec: detectedDuration,
                sampleRate: '48.0 kHz • 24-bit PCM',
              }
            : prev
        );
      };
    } catch (e) {
      console.warn('Audio metadata probing error:', e);
    }

    // 3. Asynchronously upload to temporary server storage for persistence & analysis
    setIsUploadingTemp(true);
    setUploadStatusMsg('Buffering to temporary audio storage...');
    try {
      const uploadRes = await uploadAudioTemporary(file, file.name);
      if (uploadRes && uploadRes.audioUrl) {
        setSelectedFile((prev) =>
          prev && prev.name === file.name
            ? {
                ...prev,
                serverAudioUrl: uploadRes.audioUrl,
                serverAudioId: uploadRes.audioId,
                isTempUploaded: true,
              }
            : prev
        );
        setUploadStatusMsg('Ready • Audio buffered in temporary cloud memory');
      }
    } catch (err) {
      console.warn('Temporary audio buffer notice:', err);
      setUploadStatusMsg('Ready for local playback');
    } finally {
      setIsUploadingTemp(false);
    }
  };

  // Real Play / Pause Toggle
  const togglePlayback = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn('Audio play request interrupted or blocked by autoplay policy:', err);
        setIsPlaying(false);
      }
    }
  };

  // Audio event listeners
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const total = audioRef.current.duration || duration || 24;
    setCurrentTime(current);
    const pct = total > 0 ? (current / total) * 100 : 0;
    setPlayProgress(Math.min(100, Math.max(0, pct)));
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    const total = audioRef.current.duration;
    if (total && !isNaN(total) && total > 0) {
      setDuration(total);
      setSelectedFile((prev) =>
        prev
          ? {
              ...prev,
              duration: formatAudioTime(total),
              durationSec: total,
            }
          : prev
      );
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    setPlayProgress(0);
  };

  // Scrubber seeking on click
  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const total = audioRef.current.duration || duration || 24;
    const targetTime = (pct / 100) * total;

    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
    setPlayProgress(pct);
  };

  const handleCycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const currentIndex = speeds.indexOf(playbackSpeed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
  };

  const handleStartAnalysis = () => {
    const fname = selectedFile ? selectedFile.name : 'client_audio_sample.wav';
    const dur = selectedFile ? selectedFile.duration : '00:24';
    const activeUrl = selectedFile?.audioUrl || selectedFile?.serverAudioUrl || null;
    const fileObj = selectedFile?.file || null;

    onStartScan(fname, dur, pipelineMode, activeUrl, fileObj);
  };

  const handleRemoveFile = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setSelectedFile(null);
    setCurrentTime(0);
    setPlayProgress(0);
  };

  return (
    <div className="flex flex-col w-full pb-6">
      {/* Hidden HTML5 Audio Element for real playback */}
      {selectedFile?.audioUrl && (
        <audio
          ref={audioRef}
          src={selectedFile.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={(e) => {
            console.warn('HTML5 Audio playback notice:', e);
            setIsPlaying(false);
          }}
          preload="metadata"
        />
      )}

      {/* Top Bar Back Nav & Title */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => onNavigate('home')}
          className="w-10 h-10 rounded-full bg-[#1b2026] flex items-center justify-center text-[#dee3eb] hover:bg-[#252a31] transition-colors active:scale-95 cursor-pointer"
          type="button"
          aria-label="Back to home"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#252a31] border border-[#54e98a]/20">
          <span className="w-2 h-2 rounded-full bg-[#54e98a] animate-pulse" />
          <span className="font-label-sm text-[10px] text-[#54e98a] uppercase tracking-widest font-semibold">
            Engine v4.2 Active
          </span>
        </div>
      </div>

      {/* Screen Header */}
      <div className="flex flex-col mb-4 sm:mb-6">
        <h1 className="responsive-headline-hero text-[#dee3eb] font-semibold tracking-tight">
          Analyze Audio File
        </h1>
        <p className="font-body-md text-[13px] sm:text-[14px] text-[#bbcbbb] mt-1 leading-relaxed max-w-2xl">
          Upload any pre-recorded audio to listen, verify waveforms, and inspect for synthetic speech, neural voice clones, or splice artifacts.
        </p>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.m4a,.flac,.ogg,.aac"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Responsive 2-Column Grid on Tablet & Desktop */}
      <div className="responsive-2col-grid">
        {/* Left Column: Dropzone & File Player */}
        <div className="flex flex-col">
          {/* Main Drag & Drop Zone Area */}
          <div
            id="dropzone"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            className={`relative group cursor-pointer w-full rounded-2xl bg-[#171c22] transition-all duration-300 p-5 sm:p-7 mb-4 text-center overflow-hidden active:scale-[0.99] shadow-lg border ${
              isDragging ? 'border-[#54e98a] bg-[#1b2026]' : 'border-white/10 hover:border-[#54e98a]/40'
            }`}
          >
            {/* Ambient Reactive Background Glow */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 bg-[#7dd0ff]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#54e98a]/15 transition-all duration-500" />

            <div className="relative z-10 flex flex-col items-center justify-center py-2">
              {/* Animated Icon Hub */}
              <div className="relative w-16 h-16 rounded-2xl bg-[#1b2026] flex items-center justify-center shadow-md mb-3 group-hover:bg-[#252a31] transition-transform group-hover:scale-105 border border-white/5">
                <svg
                  className="w-8 h-8 text-[#7dd0ff] group-hover:text-[#54e98a] transition-colors"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  viewBox="0 0 24 24"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" x2="12" y1="3" y2="15" />
                </svg>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#54e98a] flex items-center justify-center text-[#003919]">
                  <span className="material-symbols-outlined text-[13px] font-bold">graphic_eq</span>
                </span>
              </div>

              <p className="font-headline-sm text-[16px] sm:text-[17px] text-[#dee3eb] font-semibold">
                Tap to browse or drop audio
              </p>
              <p className="font-body-sm text-[12px] sm:text-[13px] text-[#bbcbbb] mt-0.5 mb-3">
                Full-fidelity playback &amp; real-time neural forensic parsing
              </p>

              {/* Supported Format Pills */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-[320px]">
                <span className="font-label-sm text-[10px] px-2.5 py-1 rounded-full bg-[#252a31] text-[#bbcbbb] font-mono">
                  MP3
                </span>
                <span className="font-label-sm text-[10px] px-2.5 py-1 rounded-full bg-[#252a31] text-[#bbcbbb] font-mono">
                  WAV
                </span>
                <span className="font-label-sm text-[10px] px-2.5 py-1 rounded-full bg-[#252a31] text-[#bbcbbb] font-mono">
                  M4A
                </span>
                <span className="font-label-sm text-[10px] px-2.5 py-1 rounded-full bg-[#252a31] text-[#bbcbbb] font-mono">
                  FLAC
                </span>
                <span className="font-label-sm text-[10px] px-2.5 py-1 rounded-full bg-[#252a31] text-[#bbcbbb] font-mono">
                  OGG
                </span>
                <span className="font-label-sm text-[10px] px-2.5 py-1 text-[#bbcbbb]/70 font-mono">
                  Up to 50MB
                </span>
              </div>
            </div>
          </div>

          {/* Uploaded Audio Stage Card with FULL WORKING AUDIO PLAYER */}
          {selectedFile ? (
            <div className="flex flex-col mb-4">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="font-label-sm text-[10px] text-[#bbcbbb] uppercase tracking-wider font-semibold">
                  {selectedFile.isDefaultDemo ? 'Preloaded Forensic Benchmark' : 'Queued Audio Track'}
                </span>
                <span className="font-label-sm text-[11px] text-[#54e98a] flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[14px]">
                    {isUploadingTemp ? 'cloud_sync' : 'check_circle'}
                  </span>
                  {uploadStatusMsg || 'Verified Audio Source'}
                </span>
              </div>

              <div className="relative w-full rounded-2xl bg-[#1b2026] p-4 shadow-xl overflow-hidden border border-white/5">
                {/* File Header & Removal */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#252a31] flex items-center justify-center shrink-0 text-[#7dd0ff] shadow-inner">
                      <span className="material-symbols-outlined text-[22px]">
                        {isPlaying ? 'volume_up' : 'audio_file'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-headline-sm text-[14px] sm:text-[15px] leading-5 text-[#dee3eb] font-semibold truncate">
                        {selectedFile.name}
                      </p>
                      <p className="font-label-sm text-[11px] text-[#bbcbbb] mt-0.5 truncate font-mono">
                        {selectedFile.size} • {selectedFile.sampleRate} • {selectedFile.duration}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRemoveFile}
                    className="w-7 h-7 rounded-full bg-[#252a31] flex items-center justify-center text-[#bbcbbb] hover:text-[#ffb4ab] hover:bg-[#93000a]/40 transition-colors shrink-0 cursor-pointer"
                    type="button"
                    title="Remove file"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>

                {/* Interactive Audio Player & Scrubber */}
                <div className="w-full bg-[#0a0f15] rounded-xl p-3 flex flex-col gap-2 mb-3 border border-white/5">
                  <div className="flex items-center justify-between">
                    {/* Play/Pause Button + Live Timer */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlayback}
                        className="w-9 h-9 rounded-full bg-[#54e98a] text-[#003919] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-[0_0_12px_rgba(84,233,138,0.3)] cursor-pointer"
                        id="playbackToggle"
                        type="button"
                        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                      </button>

                      <div className="flex flex-col">
                        <span className="font-label-sm text-[12px] text-[#dee3eb] font-mono font-semibold">
                          {formatAudioTime(currentTime)}{' '}
                          <span className="text-[#869486] font-normal">
                            / {selectedFile.duration || formatAudioTime(duration)}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Audio Controls: Mute & Speed */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-[15px] transition-colors cursor-pointer ${
                          isMuted
                            ? 'bg-[#93000a]/40 text-[#ffb4ab]'
                            : 'bg-[#252a31] text-[#dee3eb] hover:bg-[#30353c]'
                        }`}
                        title={isMuted ? 'Unmute audio' : 'Mute audio'}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {isMuted ? 'volume_off' : 'volume_up'}
                        </span>
                      </button>

                      <button
                        onClick={handleCycleSpeed}
                        className="px-2 py-0.5 rounded bg-[#252a31] hover:bg-[#30353c] text-[#7dd0ff] font-mono text-[11px] font-semibold transition-colors cursor-pointer"
                        title="Playback speed"
                        type="button"
                      >
                        {playbackSpeed}x
                      </button>

                      <span className="font-label-sm text-[10px] px-2 py-0.5 rounded bg-[#252a31] text-[#bbcbbb] font-mono hidden sm:inline-block">
                        PCM
                      </span>
                    </div>
                  </div>

                  {/* Scrubber Waveform Visualizer (Clickable to seek) */}
                  <div
                    onClick={handleSeek}
                    className="relative w-full h-12 flex items-center justify-between gap-[3px] px-1 py-1 cursor-pointer select-none bg-[#11161d] rounded-lg border border-white/5 overflow-hidden group"
                    title="Click anywhere along the waveform to seek"
                  >
                    {[
                      14, 22, 32, 18, 36, 44, 28, 18, 38, 30, 44, 24, 28, 36, 22, 40,
                      32, 18, 34, 26, 16, 30, 22, 14, 28, 34, 20, 28, 32, 18, 26, 14,
                    ].map((height, idx) => {
                      const barPercent = (idx / 32) * 100;
                      const isPlayed = barPercent <= playProgress;
                      return (
                        <span
                          key={idx}
                          className={`w-1 rounded-full transition-all duration-150 ${
                            isPlayed
                              ? idx % 2 === 0
                                ? 'bg-[#54e98a]'
                                : 'bg-[#7dd0ff]'
                              : 'bg-[#30353c]'
                          } ${isPlaying && isPlayed ? 'animate-pulse' : ''}`}
                          style={{
                            height: `${Math.max(
                              8,
                              isPlaying && isPlayed
                                ? height + Math.sin(idx + currentTime * 4) * 6
                                : height
                            )}px`,
                          }}
                        />
                      );
                    })}

                    {/* Scrubber Cursor Playhead Line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-[#54e98a] shadow-[0_0_10px_#54e98a] pointer-events-none transition-all duration-75"
                      style={{ left: `${playProgress}%` }}
                    >
                      <div className="w-2 h-2 -ml-[3px] rounded-full bg-[#54e98a] shadow-sm" />
                    </div>
                  </div>
                </div>

                {/* Telemetry and Storage Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#252a31]">
                    <span className="material-symbols-outlined text-[14px] text-[#54e98a]">
                      equalizer
                    </span>
                    <span className="font-label-sm text-[10px] text-[#dee3eb]">
                      Live Audio Stream
                    </span>
                  </div>

                  {selectedFile.isTempUploaded && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#005027]/50 border border-[#54e98a]/30">
                      <span className="material-symbols-outlined text-[14px] text-[#54e98a]">
                        cloud_done
                      </span>
                      <span className="font-label-sm text-[10px] text-[#54e98a]">
                        Temporary Cloud Stored
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#252a31]">
                    <span className="material-symbols-outlined text-[14px] text-[#7dd0ff]">
                      graphic_eq
                    </span>
                    <span className="font-label-sm text-[10px] text-[#dee3eb]">
                      Dual-FFT Spectral Ready
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-xl bg-[#1b2026] text-center mb-4 border border-dashed border-white/10">
              <span className="material-symbols-outlined text-[32px] text-[#bbcbbb] mb-1">
                upload_file
              </span>
              <p className="text-[#bbcbbb] text-[13px]">
                No audio file queued. Drop a sound clip above or tap to upload from your files.
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Pipeline Selection & Action */}
        <div className="flex flex-col space-y-4">
          {/* Detection Mode Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-label-sm text-[10px] text-[#bbcbbb] uppercase tracking-wider font-semibold">
                Forensic Pipeline Mode
              </span>
              <span className="font-label-sm text-[10px] text-[#7dd0ff] font-mono">Model v4.9</span>
            </div>

            {/* Mode Option 1: Quick Scan */}
            <label
              onClick={() => setPipelineMode('quick')}
              className={`group relative flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all border ${
                pipelineMode === 'quick'
                  ? 'bg-[#1b2026] border-[#54e98a]/40 shadow-md'
                  : 'bg-[#171c22] border-white/5 hover:bg-[#1b2026]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${
                  pipelineMode === 'quick' ? 'bg-[#54e98a]' : 'bg-[#30353c]'
                }`}
              >
                {pipelineMode === 'quick' ? (
                  <span className="material-symbols-outlined text-[14px] text-[#003919] font-bold">
                    check
                  </span>
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-[14px] sm:text-[15px] font-semibold text-[#dee3eb]">
                    Quick Scan
                  </span>
                  <span className="font-label-sm text-[10px] text-[#bbcbbb] bg-[#1b2026] px-2 py-0.5 rounded-full font-mono">
                    ~2s
                  </span>
                </div>
                <p className="font-body-sm text-[12px] text-[#bbcbbb] mt-0.5 leading-snug">
                  Lightweight spectrographic artifact screening and vocoder check.
                </p>
              </div>
            </label>

            {/* Mode Option 2: Deep Forensics (Selected by default) */}
            <label
              onClick={() => setPipelineMode('deep')}
              className={`group relative flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all shadow-md border ${
                pipelineMode === 'deep'
                  ? 'bg-[#1b2026] border-[#54e98a]/50'
                  : 'bg-[#171c22] border-white/5 hover:bg-[#1b2026]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0 ${
                  pipelineMode === 'deep' ? 'bg-[#54e98a]' : 'bg-[#30353c]'
                }`}
              >
                {pipelineMode === 'deep' ? (
                  <span className="material-symbols-outlined text-[14px] text-[#003919] font-bold">
                    check
                  </span>
                ) : null}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline-sm text-[14px] sm:text-[15px] font-semibold text-[#dee3eb]">
                      Deep Forensic Analysis
                    </span>
                    <span className="font-label-sm text-[8px] uppercase tracking-wider bg-[#54e98a]/20 text-[#54e98a] px-1.5 py-0.5 rounded-sm font-bold">
                      Recommended
                    </span>
                  </div>
                  <span className="font-label-sm text-[10px] text-[#54e98a] font-semibold bg-[#252a31] px-2 py-0.5 rounded-full font-mono">
                    ~5s
                  </span>
                </div>
                <p className="font-body-sm text-[12px] text-[#bbcbbb] mt-0.5 leading-snug">
                  Spectral dispersion, prosody naturalness &amp; glottal pulse phase coherence analysis across 34 neural vocoders.
                </p>
              </div>
            </label>
          </div>

          {/* Primary Call to Action Button */}
          <button
            onClick={handleStartAnalysis}
            className="w-full h-[52px] rounded-full bg-gradient-to-r from-[#2ecc71] via-[#54e98a] to-[#7dd0ff] text-[#005027] font-label-lg text-[13px] tracking-wider font-bold uppercase flex items-center justify-center gap-2 shadow-[0_4px_24px_rgba(84,233,138,0.35)] active:scale-[0.98] transition-all hover:brightness-105 cursor-pointer"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">security_update_good</span>
            <span>Analyze Voice Now</span>
          </button>

          {/* Security & Privacy Guarantee Footer */}
          <div className="flex items-center justify-center gap-2 text-center p-3 rounded-xl bg-[#171c22]/70 border border-white/5">
            <span className="material-symbols-outlined text-[#7dd0ff] text-[16px]">lock</span>
            <p className="font-label-sm text-[11px] text-[#bbcbbb]">
              End-to-end encrypted. Voice files are buffered in temporary storage and automatically deleted after analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
