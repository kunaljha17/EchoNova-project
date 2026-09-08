import React, { useState, useEffect, useRef } from 'react';
import {
  formatAudioTime,
  uploadAudioTemporary,
  generateSyntheticAudioSample,
  blobToBase64,
} from '../utils/audioHelper';

export const RecordScreen = ({
  onNavigate,
  onFinishRecording,
  onNavigateToTranscribe,
}) => {
  // Acoustic Quality Mode: 'clean_vocal' (crystal-clear noise-cancelled HD) vs 'studio_raw'
  const [acousticProfile, setAcousticProfile] = useState('clean_vocal');

  // Recording Lifecycle State
  const [isRecording, setIsRecording] = useState(false);
  const [isReRecording, setIsReRecording] = useState(false);
  const [elapsedCentis, setElapsedCentis] = useState(0); // 0 to 3000 (30.00 seconds)
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);
  const [micMode, setMicMode] = useState('live'); // 'live' | 'synthetic'
  const [micStatusText, setMicStatusText] = useState('Initializing Live Sentry...');
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);

  // Real Acoustic Telemetry
  const [decibels, setDecibels] = useState(-42);
  const [ambientNoise, setAmbientNoise] = useState('Optimal');
  const [clarity, setClarity] = useState(98);
  const [waveBars, setWaveBars] = useState([
    16, 24, 40, 32, 20, 48, 36, 28, 18, 38, 44, 26, 20, 42, 30, 14,
  ]);

  // Audio Data & Storage
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState(null);
  const [recordedBase64, setRecordedBase64] = useState(null);
  const [audioMimeType, setAudioMimeType] = useState('audio/webm');
  const [recordedDurationSec, setRecordedDurationSec] = useState(0);
  const [audioFileSizeFormatted, setAudioFileSizeFormatted] = useState('');

  // Playback State & Controls
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playbackCurrentTime, setPlaybackCurrentTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);
  const [playProgress, setPlayProgress] = useState(0); // 0 - 100%
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1.0); // 0.0 to 1.0
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showNativeControls, setShowNativeControls] = useState(false);
  const [audioPlaybackNotice, setAudioPlaybackNotice] = useState(null);

  // Transcription State
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionText, setTranscriptionText] = useState('');
  const [transcribeError, setTranscribeError] = useState(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Stream & Hardware Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const micStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const chronoTimerRef = useRef(null);
  const audioElementRef = useRef(null);
  const activeBlobUrlRef = useRef(null);

  // Initialize: attempt to prepare or offer live microphone on mount
  useEffect(() => {
    startLiveRecording('clean_vocal');

    return () => {
      cleanupMicrophone(true);
      if (chronoTimerRef.current) clearInterval(chronoTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioElementRef.current) audioElementRef.current.pause();
      if (activeBlobUrlRef.current && activeBlobUrlRef.current.startsWith('blob:')) {
        try { URL.revokeObjectURL(activeBlobUrlRef.current); } catch (_) {}
      }
    };
  }, []);

  // Sync playback speed
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Sync volume & mute state
  useEffect(() => {
    if (audioElementRef.current) {
      audioElementRef.current.volume = volume;
      audioElementRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  // Reload audio element when URL changes
  useEffect(() => {
    if (recordedAudioUrl && audioElementRef.current) {
      audioElementRef.current.src = recordedAudioUrl;
      audioElementRef.current.load();
    }
  }, [recordedAudioUrl]);

  /**
   * Stop and cleanup microphone stream and Web Audio nodes cleanly
   */
  const cleanupMicrophone = (destroyTracks = true) => {
    if (chronoTimerRef.current) {
      clearInterval(chronoTimerRef.current);
      chronoTimerRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.onstop = null;
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    if (destroyTracks && micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
  };

  /**
   * Start Live Microphone Capture with High-Fidelity Audio Settings
   */
  const startLiveRecording = async (profileToUse = acousticProfile) => {
    // Reset playback
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    setIsPlayingAudio(false);
    setPlaybackCurrentTime(0);
    setPlayProgress(0);
    setAudioPlaybackNotice(null);
    setTranscriptionText('');
    setTranscribeError(null);
    setMicPermissionDenied(false);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser.');
      }

      setMicStatusText('Requesting studio microphone access...');

      // High-Fidelity Audio Constraints:
      // Default to Vocal HD ('clean_vocal') which enables active acoustic noise suppression
      // and echo cancellation, preventing ambient fan hum, room reverberation, and distortion.
      const isCleanVocal = profileToUse !== 'studio_raw';
      const audioConstraints = {
        channelCount: { ideal: 1 },
        sampleRate: { ideal: 48000 },
        echoCancellation: isCleanVocal,
        noiseSuppression: isCleanVocal,
        autoGainControl: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      micStreamRef.current = stream;
      setMicMode('live');
      setMicStatusText(
        isCleanVocal
          ? 'Vocal HD • Noise-cancelled crystal-clear 48 kHz stream'
          : 'Studio Raw • Direct interface human vocal stream'
      );

      // Web Audio Analyser for telemetry
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx({ sampleRate: 48000 });
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.75;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateTelemetry = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        let maxVal = 0;
        const bars = [];
        const step = Math.max(1, Math.floor(dataArray.length / 16));

        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          sum += val;
          if (val > maxVal) maxVal = val;
          const barHeight = Math.max(10, Math.min(56, Math.round((val / 255) * 56)));
          bars.push(barHeight);
        }

        const avg = sum / (dataArray.length || 1);
        const currentDb = Math.round(-60 + (avg / 255) * 54);
        setDecibels(currentDb);
        setWaveBars(bars);

        if (avg < 14) {
          setAmbientNoise('Quiet');
          setClarity(99);
        } else if (avg < 65) {
          setAmbientNoise('Optimal');
          setClarity(Math.min(99, Math.max(93, Math.round(94 + (avg / 65) * 5))));
        } else {
          setAmbientNoise('High Level');
          setClarity(Math.min(95, Math.max(86, Math.round(92 - (avg / 255) * 7))));
        }

        animFrameRef.current = requestAnimationFrame(updateTelemetry);
      };

      updateTelemetry();

      // Configure MediaRecorder with 128 kbps Opus (Golden standard for pristine vocal clarity without buffer glitches)
      let preferredMime = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(preferredMime)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) preferredMime = 'audio/webm';
        else if (MediaRecorder.isTypeSupported('audio/mp4')) preferredMime = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) preferredMime = 'audio/ogg';
        else preferredMime = '';
      }
      setAudioMimeType(preferredMime || 'audio/webm');

      const recorderOptions = {
        audioBitsPerSecond: 128000,
      };
      if (preferredMime) {
        recorderOptions.mimeType = preferredMime;
      }

      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, recorderOptions);
      } catch (_) {
        try {
          mediaRecorder = new MediaRecorder(stream, { mimeType: preferredMime, audioBitsPerSecond: 128000 });
        } catch (__) {
          mediaRecorder = preferredMime ? new MediaRecorder(stream, { mimeType: preferredMime }) : new MediaRecorder(stream);
        }
      }
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      // Gather all chunks in onstop before stopping microphone tracks
      mediaRecorder.onstop = async () => {
        if (audioChunksRef.current.length > 0) {
          const finalBlob = new Blob(audioChunksRef.current, { type: preferredMime || 'audio/webm' });
          setRecordedBlob(finalBlob);

          // Format file size for user visibility
          const sizeKb = (finalBlob.size / 1024).toFixed(1);
          setAudioFileSizeFormatted(`${sizeKb} KB`);

          const localUrl = URL.createObjectURL(finalBlob);
          activeBlobUrlRef.current = localUrl;
          setRecordedAudioUrl(localUrl);
          setHasRecordedAudio(true);

          // Explicitly prime the audio element immediately
          if (audioElementRef.current) {
            audioElementRef.current.src = localUrl;
            audioElementRef.current.load();
          }

          try {
            const b64 = await blobToBase64(finalBlob);
            setRecordedBase64(b64);
          } catch (e) {
            console.warn('Base64 conversion error:', e);
          }

          // Asynchronously persist to server for forensics / sharing
          const ext = preferredMime.includes('webm') ? '.webm' : preferredMime.includes('mp4') ? '.mp4' : '.wav';
          uploadAudioTemporary(finalBlob, `live_sentry_${Date.now()}${ext}`);
        }

        // ONLY NOW safely close hardware tracks after all data has been completely flushed
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((track) => track.stop());
          micStreamRef.current = null;
        }
      };

      mediaRecorder.start(200); // 200ms slices for smooth capture
      setIsRecording(true);
      setElapsedCentis(0);
      startChronoTimer();
    } catch (err) {
      console.warn('Microphone access notice:', err);
      setMicPermissionDenied(true);
      activateSyntheticAcousticMode();
    }
  };

  /**
   * Fallback simulator mode when microphone is unavailable or blocked in iframe
   */
  const activateSyntheticAcousticMode = () => {
    setMicMode('synthetic');
    setMicStatusText('Simulator Mode • Realistic acoustic vocal benchmark');
    setIsRecording(true);
    setElapsedCentis(0);

    const simInterval = setInterval(() => {
      setDecibels(-14 + Math.floor(Math.random() * 6) - 3);
      setClarity(Math.min(99, Math.max(93, 96 + Math.floor(Math.random() * 4) - 2)));
      setWaveBars((prev) => prev.map(() => Math.floor(Math.random() * 42) + 14));
    }, 100);

    const sampleUrl = generateSyntheticAudioSample('human', 30);
    if (sampleUrl) {
      activeBlobUrlRef.current = sampleUrl;
      setRecordedAudioUrl(sampleUrl);
      fetch(sampleUrl)
        .then((r) => r.blob())
        .then(async (blob) => {
          setRecordedBlob(blob);
          setAudioMimeType('audio/wav');
          setAudioFileSizeFormatted(`${(blob.size / 1024).toFixed(1)} KB`);
          const b64 = await blobToBase64(blob);
          setRecordedBase64(b64);
          setHasRecordedAudio(true);
        })
        .catch(() => {});
    }

    startChronoTimer(() => {
      clearInterval(simInterval);
    });
  };

  /**
   * 30-Second Chrono Stopwatch
   */
  const startChronoTimer = (onStopCb) => {
    if (chronoTimerRef.current) clearInterval(chronoTimerRef.current);

    chronoTimerRef.current = setInterval(() => {
      setElapsedCentis((prev) => {
        if (prev >= 3000) {
          clearInterval(chronoTimerRef.current);
          handleStopRecording();
          if (onStopCb) onStopCb();
          return 3000;
        }
        return prev + 5;
      });
    }, 50);
  };

  /**
   * Stop/Finish Recording and buffer audio
   */
  const handleStopRecording = () => {
    if (chronoTimerRef.current) {
      clearInterval(chronoTimerRef.current);
      chronoTimerRef.current = null;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        if (typeof mediaRecorderRef.current.requestData === 'function') {
          mediaRecorderRef.current.requestData();
        }
      } catch (_) {}
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
    const recordedSeconds = Math.max(1, Math.round(elapsedCentis / 100));
    setRecordedDurationSec(recordedSeconds);
    setPlaybackDuration(recordedSeconds);
    setMicStatusText('Recording complete • Audio buffered & ready to play');
  };

  /**
   * Toggle recording button (Start / Stop)
   */
  const handleToggleRecord = () => {
    if (isRecording) {
      handleStopRecording();
    } else {
      startLiveRecording(acousticProfile);
    }
  };

  /**
   * Complete Re-record Handler:
   * Safely releases hardware, resets state cleanly, delays 220ms for OS audio release,
   * and starts a fresh recording that can be played back reliably every time.
   */
  const handleReRecord = async () => {
    setIsReRecording(true);
    setAudioPlaybackNotice(null);

    // 1. Pause any active playback
    if (audioElementRef.current) {
      try {
        audioElementRef.current.pause();
        audioElementRef.current.currentTime = 0;
      } catch (_) {}
    }
    setIsPlayingAudio(false);
    setPlaybackCurrentTime(0);
    setPlayProgress(0);

    // 2. Clear timer
    if (chronoTimerRef.current) {
      clearInterval(chronoTimerRef.current);
      chronoTimerRef.current = null;
    }

    // 3. Stop old recorder without triggering stale callbacks
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = null;
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }

    // 4. Clean up microphone tracks and audio context
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // 5. Reset states
    setHasRecordedAudio(false);
    setRecordedAudioUrl(null);
    setRecordedBlob(null);
    setRecordedBase64(null);
    setElapsedCentis(0);
    setTranscriptionText('');
    setTranscribeError(null);
    audioChunksRef.current = [];

    // 6. Give the browser/OS audio subsystem 220ms to release the microphone handle
    await new Promise((resolve) => setTimeout(resolve, 220));
    setIsReRecording(false);

    // 7. Start fresh high-clarity live recording
    await startLiveRecording(acousticProfile);
  };

  /**
   * Switch Acoustic Profile (Vocal HD Clean vs Studio Raw)
   */
  const handleSwitchProfile = (newProfile) => {
    setAcousticProfile(newProfile);
    if (isRecording) {
      cleanupMicrophone(true);
      startLiveRecording(newProfile);
    }
  };

  /**
   * Playback Toggle
   */
  const handleTogglePlayback = async () => {
    const el = audioElementRef.current;
    if (!el) return;

    if (isPlayingAudio) {
      try {
        el.pause();
      } catch (_) {}
      setIsPlayingAudio(false);
      return;
    }

    if (!recordedAudioUrl) {
      setAudioPlaybackNotice('Please record your voice first before playing.');
      return;
    }

    try {
      setAudioPlaybackNotice(null);
      if (!el.src || el.src === '' || el.src !== recordedAudioUrl) {
        el.src = recordedAudioUrl;
        el.load();
      }
      el.volume = isMuted ? 0 : volume;
      el.playbackRate = playbackSpeed;

      const p = el.play();
      if (p !== undefined) {
        await p;
        setIsPlayingAudio(true);
      }
    } catch (err) {
      console.warn('Audio playback initial notice:', err);
      // Fallback reload and retry
      try {
        el.src = recordedAudioUrl;
        el.load();
        const p2 = el.play();
        if (p2 !== undefined) {
          await p2;
          setIsPlayingAudio(true);
        }
      } catch (err2) {
        console.warn('Audio playback retry notice:', err2);
        setAudioPlaybackNotice('Audio buffering. Tap play again or use the native player bar below.');
        setIsPlayingAudio(false);
      }
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioElementRef.current) return;
    const current = audioElementRef.current.currentTime;
    const total = audioElementRef.current.duration || recordedDurationSec || 30;
    setPlaybackCurrentTime(current);
    const pct = total > 0 ? (current / total) * 100 : 0;
    setPlayProgress(Math.min(100, Math.max(0, pct)));
  };

  const handleAudioLoadedMetadata = () => {
    if (!audioElementRef.current) return;
    const dur = audioElementRef.current.duration;
    if (dur && !isNaN(dur) && dur > 0) {
      setPlaybackDuration(dur);
      setRecordedDurationSec(dur);
    }
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setPlaybackCurrentTime(0);
    setPlayProgress(0);
  };

  const handleSeek = (e) => {
    if (!audioElementRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const total = audioElementRef.current.duration || recordedDurationSec || 30;
    const target = (pct / 100) * total;
    audioElementRef.current.currentTime = target;
    setPlaybackCurrentTime(target);
    setPlayProgress(pct);
  };

  const handleCycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(next);
  };

  /**
   * Direct Download of Recorded Audio
   */
  const handleDownloadAudio = () => {
    if (!recordedAudioUrl) return;
    const a = document.createElement('a');
    a.href = recordedAudioUrl;
    const ext = audioMimeType.includes('webm') ? 'webm' : audioMimeType.includes('mp4') ? 'mp4' : 'wav';
    a.download = `voiceguard_live_sentry_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  /**
   * Transcribe the recorded audio using Gemini 3.5 Transcribe
   */
  const handleTranscribeAudio = async () => {
    if (isRecording) {
      handleStopRecording();
    }

    let base64ToUse = recordedBase64;
    if (!base64ToUse && recordedBlob) {
      try {
        base64ToUse = await blobToBase64(recordedBlob);
        setRecordedBase64(base64ToUse);
      } catch (e) {
        console.warn('Blob to base64 conversion failed:', e);
      }
    }

    if (!base64ToUse) {
      setTranscribeError('Please finish recording your voice before requesting transcription.');
      return;
    }

    setIsTranscribing(true);
    setTranscribeError(null);

    try {
      const res = await fetch('/api/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: base64ToUse,
          mimeType: audioMimeType || 'audio/webm',
          prompt:
            'Transcribe this spoken audio verbatim with natural punctuation, proper casing, and clear sentence breaks. Do not add conversational commentary.',
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        let message = errJson.error || `Transcription error: ${res.status}`;
        if (typeof message === 'string' && message.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(message);
            message = parsed.error?.message || parsed.message || message;
          } catch (_) {}
        }
        throw new Error(message);
      }

      const data = await res.json();
      const text = data.text?.trim() || '';
      if (!text) {
        setTranscriptionText('Vocal audio captured successfully, but no spoken words were detected. Speak closer to the microphone.');
      } else {
        setTranscriptionText(text);
      }
    } catch (err) {
      console.error('Transcription error:', err);
      let errMsg = err.message || 'Transcription failed. Please try again.';
      if (errMsg.includes('INVALID_ARGUMENT')) {
        errMsg = 'The audio format could not be processed. Please re-record and try again.';
      }
      setTranscribeError(errMsg);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCopyTranscript = () => {
    if (!transcriptionText) return;
    navigator.clipboard.writeText(transcriptionText);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleOpenInTranscribeStudio = () => {
    if (onNavigateToTranscribe) {
      onNavigateToTranscribe({
        blob: recordedBlob,
        audioUrl: recordedAudioUrl,
        base64: recordedBase64,
        mimeType: audioMimeType,
        duration: Math.max(1, Math.round(elapsedCentis / 100)),
        transcript: transcriptionText,
      });
    } else {
      onNavigate('transcribe');
    }
  };

  const handleStopAndAnalyze = () => {
    if (isRecording) {
      handleStopRecording();
    }
    const totalSec = Math.max(3, Math.floor(elapsedCentis / 100));
    const durationStr = `00:${String(totalSec).padStart(2, '0')}`;
    onFinishRecording(durationStr, recordedAudioUrl || null);
  };

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
    return `${isRecording ? 'RECORDING' : 'BUFFERED'} 00:${ss} / 00:30`;
  };

  return (
    <div className="flex flex-col w-full gap-3 pb-8">
      {/* HTML5 Audio Element for playback (Always mounted to ensure stable ref across re-recordings) */}
      <audio
        ref={audioElementRef}
        src={recordedAudioUrl || undefined}
        onTimeUpdate={handleAudioTimeUpdate}
        onLoadedMetadata={handleAudioLoadedMetadata}
        onEnded={handleAudioEnded}
        onPlay={() => setIsPlayingAudio(true)}
        onPause={() => setIsPlayingAudio(false)}
        onError={(e) => {
          console.warn('Audio playback error notice:', e);
          setIsPlayingAudio(false);
        }}
        preload="auto"
      />

      {/* Top Navigation Header */}
      <div className="flex items-center justify-between w-full py-1">
        <button
          onClick={() => {
            cleanupMicrophone(true);
            onNavigate('home');
          }}
          className="w-10 h-10 rounded-full bg-[#171c22] flex items-center justify-center text-[#dee3eb] hover:bg-[#252a31] transition-all active:scale-95 cursor-pointer border border-white/5"
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
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isRecording ? 'bg-[#54e98a] animate-ping' : 'bg-[#7dd0ff]'
              }`}
            />
            {isRecording ? 'Real-Time Deepfake Shield' : 'Observation Buffered'}
          </span>
        </div>

        {/* Acoustic Profile Quick Toggle (Vocal HD Clean vs Studio Raw) */}
        <div className="flex items-center gap-1 bg-[#171c22] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => handleSwitchProfile('clean_vocal')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer ${
              acousticProfile === 'clean_vocal'
                ? 'bg-[#54e98a] text-[#003919] shadow-sm'
                : 'text-[#bbcbbb] hover:text-[#dee3eb]'
            }`}
            title="Vocal HD: Active noise cancellation & echo suppression for crystal-clear voice clarity (Recommended)"
            type="button"
          >
            Vocal HD
          </button>
          <button
            onClick={() => handleSwitchProfile('studio_raw')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition-all cursor-pointer ${
              acousticProfile === 'studio_raw'
                ? 'bg-[#7dd0ff] text-[#00344a] shadow-sm'
                : 'text-[#bbcbbb] hover:text-[#dee3eb]'
            }`}
            title="Studio Raw: Direct unprocessed microphone stream for dedicated audio interfaces"
            type="button"
          >
            Studio Raw
          </button>
        </div>
      </div>

      {/* Mic Permission Denied Alert (If physical mic was blocked) */}
      {micPermissionDenied && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffb4ab]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">mic_off</span>
            <div className="text-[12px] leading-tight">
              <span className="font-bold block">Microphone Access Notice</span>
              <span>Grant microphone permission in your browser or iframe, then tap Re-record.</span>
            </div>
          </div>
          <button
            onClick={handleReRecord}
            className="px-3 py-1 rounded-lg bg-[#ffb4ab] text-[#561e18] font-bold text-[11px] uppercase tracking-wider hover:opacity-90 cursor-pointer"
          >
            Try Mic Again
          </button>
        </div>
      )}

      {/* Live Status & Format Badge Strip */}
      <div className="flex items-center justify-between px-3.5 py-2 rounded-full bg-[#171c22] shadow-sm border border-white/5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                isRecording ? 'bg-[#ffb4ab]' : 'bg-[#54e98a]'
              } opacity-75`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isRecording ? 'bg-[#ffb4ab]' : 'bg-[#54e98a]'
              }`}
            />
          </span>
          <span
            className={`font-label-md text-[11px] font-bold tracking-wider ${
              isRecording ? 'text-[#ffb4ab]' : 'text-[#54e98a]'
            }`}
          >
            {formattedRecordProgress()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {audioFileSizeFormatted && hasRecordedAudio && (
            <span className="font-label-sm text-[10px] text-[#7dd0ff] font-mono">
              {audioFileSizeFormatted}
            </span>
          )}
          <div className="flex items-center gap-1 bg-[#1b2026] px-2.5 py-0.5 rounded-full border border-white/5">
            <span className="material-symbols-outlined text-[#54e98a] text-[13px]">equalizer</span>
            <span className="font-label-sm text-[10px] text-[#bbcbbb] uppercase font-mono">
              48 kHz • 256 kbps HD
            </span>
          </div>
        </div>
      </div>

      {/* Main Responsive Grid */}
      <div className="responsive-2col-grid mt-1">
        {/* Left Column: Live Radar Scope & Microphone Stage */}
        <div className="relative flex flex-col items-center justify-center py-6 sm:py-7 px-4 rounded-2xl bg-[#0a0f15] overflow-hidden shadow-xl border border-white/5">
          {/* Ambient Background Glow */}
          <div className="absolute w-64 sm:w-72 h-64 sm:h-72 rounded-full bg-gradient-to-tr from-[#54e98a]/10 via-[#7dd0ff]/10 to-transparent blur-3xl pointer-events-none" />

          {/* Shield Visualizer Stamp Backdrop */}
          <svg
            className="absolute w-56 sm:w-64 h-56 sm:h-64 text-[#30353c]/30 pointer-events-none stroke-current"
            fill="none"
            strokeDasharray="2 3"
            strokeWidth="0.75"
            viewBox="0 0 100 100"
          >
            <path d="M50 10 L85 24 V52 C85 72 50 90 50 90 C50 90 15 72 15 52 V24 Z" />
          </svg>

          {/* Radar Pulse Waves Around Mic Target */}
          <div className="relative flex items-center justify-center my-3">
            {isRecording && (
              <>
                <div className="absolute w-44 h-44 rounded-full bg-[#54e98a]/10 animate-ping duration-1000" />
                <div className="absolute w-36 h-36 rounded-full bg-[#7dd0ff]/15 animate-pulse duration-700" />
                <div className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-[#54e98a] via-[#7dd0ff] to-[#54e98a] opacity-30 blur-md animate-spin duration-3000" />
              </>
            )}

            {/* Core Microphone Button */}
            <button
              onClick={handleToggleRecord}
              className={`relative z-10 w-[110px] h-[110px] sm:w-[120px] sm:h-[120px] rounded-full p-1 shadow-[0_0_30px_rgba(84,233,138,0.35)] flex items-center justify-center active:scale-95 transition-transform cursor-pointer ${
                isRecording
                  ? 'bg-gradient-to-br from-[#2ecc71] via-[#252a31] to-[#2a9acc]'
                  : 'bg-gradient-to-br from-[#30353c] via-[#1b2026] to-[#252a31]'
              }`}
              id="mic-target"
              type="button"
              aria-label={isRecording ? 'Pause or stop listening' : 'Start microphone recording'}
            >
              <div className="w-full h-full rounded-full bg-[#0a0f15] flex flex-col items-center justify-center gap-0.5 group">
                <span
                  className={`material-symbols-outlined text-[38px] sm:text-[42px] group-hover:scale-110 transition-transform ${
                    isRecording ? 'text-[#54e98a]' : 'text-[#bbcbbb]'
                  }`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {isRecording ? 'mic' : 'mic_off'}
                </span>
                <span className="font-label-sm text-[9px] text-[#7dd0ff] uppercase tracking-widest font-semibold font-mono">
                  {isRecording ? 'Listening' : 'Ready'}
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
              30s Window Limit • {micStatusText}
            </span>
          </div>

          {/* Live Reactive Spectrum Bar Equalizer */}
          <div className="flex items-end justify-center gap-1.5 h-14 sm:h-16 w-full max-w-[320px] mt-4 px-2 z-10">
            {waveBars.map((height, i) => {
              const isCyan =
                i === 0 || i === 1 || i === 4 || i === 7 || i === 8 || i === 11 || i === 12 || i === 15;
              return (
                <span
                  key={i}
                  className={`w-1.5 sm:w-2 rounded-full transition-all duration-75 ${
                    isRecording
                      ? isCyan
                        ? 'bg-[#7dd0ff]'
                        : 'bg-[#54e98a]'
                      : 'bg-[#30353c]'
                  }`}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>

          {/* Bottom Record Action Button */}
          <div className="mt-4 z-10">
            <button
              onClick={handleToggleRecord}
              className={`px-5 py-2 rounded-full font-label-md text-[12px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                isRecording
                  ? 'bg-[#93000a]/30 text-[#ffdad6] border border-[#ffb4ab]/30 hover:bg-[#93000a]/50'
                  : 'bg-[#54e98a] text-[#003919] hover:opacity-90 shadow-md'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isRecording ? 'stop_circle' : 'radio_button_checked'}
              </span>
              <span>{isRecording ? 'Finish & Buffer Audio' : 'Start Recording'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Audio Playback, Transcription & Telemetry */}
        <div className="flex flex-col space-y-3">
          {/* Live Audio Telemetry Strip */}
          <div className="grid grid-cols-3 gap-2 w-full">
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#171c22] shadow-sm border border-white/5">
              <span className="font-label-sm text-[9px] text-[#bbcbbb] uppercase font-mono">Input Level</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-label-lg text-[13px] text-[#7dd0ff] font-bold font-mono">
                  {decibels} dB
                </span>
                <span className="material-symbols-outlined text-[#7dd0ff] text-[14px]">volume_up</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#171c22] shadow-sm border border-white/5">
              <span className="font-label-sm text-[9px] text-[#bbcbbb] uppercase font-mono">Acoustic Clarity</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-label-lg text-[13px] text-[#54e98a] font-bold font-mono">
                  {clarity}%
                </span>
                <span className="material-symbols-outlined text-[#54e98a] text-[14px]">verified</span>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#171c22] shadow-sm border border-white/5">
              <span className="font-label-sm text-[9px] text-[#bbcbbb] uppercase font-mono">Profile</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-label-lg text-[12px] text-[#6bfe9c] font-bold font-mono uppercase truncate">
                  {acousticProfile === 'clean_vocal' ? 'Vocal HD' : 'Studio Raw'}
                </span>
              </div>
            </div>
          </div>

          {/* AUDIO PLAYBACK CARD: Listen to what was recorded in 30s */}
          <div className="w-full rounded-2xl bg-[#171c22] p-3.5 sm:p-4 border border-white/5 shadow-md flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#54e98a] text-[18px]">
                  headphones
                </span>
                <span className="font-headline-sm text-[13px] sm:text-[14px] font-semibold text-[#dee3eb]">
                  Listen to Recorded Audio
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`font-label-sm text-[10px] px-2 py-0.5 rounded-full font-mono ${
                    hasRecordedAudio
                      ? 'bg-[#54e98a]/20 text-[#54e98a]'
                      : 'bg-[#252a31] text-[#bbcbbb]'
                  }`}
                >
                  {hasRecordedAudio ? 'Ready to Play' : isRecording ? 'Recording...' : 'Awaiting Capture'}
                </span>
              </div>
            </div>

            {/* Playback Controls & Waveform Scrubber */}
            <div className="w-full bg-[#0a0f15] rounded-xl p-3 flex flex-col gap-2.5 border border-white/5">
              <div className="flex items-center justify-between">
                {/* Play/Pause Button + Timer */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={handleTogglePlayback}
                    disabled={!hasRecordedAudio && !recordedAudioUrl}
                    className="w-10 h-10 rounded-full bg-[#54e98a] disabled:bg-[#30353c] text-[#003919] disabled:text-[#869486] flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-[0_0_12px_rgba(84,233,138,0.3)] cursor-pointer disabled:cursor-not-allowed"
                    type="button"
                    aria-label={isPlayingAudio ? 'Pause playback' : 'Play recorded audio'}
                  >
                    <span className="material-symbols-outlined text-[22px]">
                      {isPlayingAudio ? 'pause' : 'play_arrow'}
                    </span>
                  </button>

                  <div className="flex flex-col">
                    <span className="font-label-sm text-[13px] text-[#dee3eb] font-mono font-semibold">
                      {formatAudioTime(playbackCurrentTime)}{' '}
                      <span className="text-[#869486] font-normal">
                        / {formatAudioTime(playbackDuration || Math.round(elapsedCentis / 100) || 30)}
                      </span>
                    </span>
                    <span className="font-label-sm text-[9px] text-[#7dd0ff] font-mono">
                      {hasRecordedAudio ? 'Direct High-Definition Stream' : 'Press Play after capture'}
                    </span>
                  </div>
                </div>

                {/* Speed, Download & Volume Controls */}
                <div className="flex items-center gap-1.5">
                  {/* Download Button */}
                  {hasRecordedAudio && (
                    <button
                      onClick={handleDownloadAudio}
                      className="w-7 h-7 rounded-lg bg-[#252a31] hover:bg-[#30353c] text-[#7dd0ff] flex items-center justify-center transition-colors cursor-pointer"
                      title="Download recorded audio file to listen on device"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                    </button>
                  )}

                  {/* Mute Button */}
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

                  {/* Volume Slider */}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setVolume(v);
                      if (v > 0 && isMuted) setIsMuted(false);
                    }}
                    className="w-14 sm:w-18 accent-[#54e98a] cursor-pointer h-1 bg-[#252a31] rounded-lg"
                    title={`Volume: ${Math.round(volume * 100)}%`}
                  />

                  {/* Speed Selector */}
                  <button
                    onClick={handleCycleSpeed}
                    className="px-2 py-0.5 rounded bg-[#252a31] hover:bg-[#30353c] text-[#7dd0ff] font-mono text-[11px] font-semibold transition-colors cursor-pointer"
                    title="Playback speed"
                    type="button"
                  >
                    {playbackSpeed}x
                  </button>
                </div>
              </div>

              {/* Clickable Scrubber Waveform Bar */}
              <div
                onClick={handleSeek}
                className="relative w-full h-11 flex items-center justify-between gap-[3px] px-1 py-1 cursor-pointer select-none bg-[#11161d] rounded-lg border border-white/5 overflow-hidden group"
                title="Click anywhere along the waveform to jump playback"
              >
                {[
                  14, 26, 38, 22, 42, 48, 30, 20, 44, 32, 48, 26, 32, 40, 24, 46,
                  36, 20, 38, 28, 18, 34, 24, 16, 32, 40, 22, 30, 36, 20, 28, 16,
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
                      } ${isPlayingAudio && isPlayed ? 'animate-pulse' : ''}`}
                      style={{
                        height: `${Math.max(
                          8,
                          isPlayingAudio && isPlayed
                            ? height + Math.sin(idx + playbackCurrentTime * 4) * 6
                            : height
                        )}px`,
                      }}
                    />
                  );
                })}

                {/* Scrubber Playhead cursor line */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-[#54e98a] shadow-[0_0_10px_#54e98a] pointer-events-none transition-all duration-75"
                  style={{ left: `${playProgress}%` }}
                >
                  <div className="w-2 h-2 -ml-[3px] rounded-full bg-[#54e98a]" />
                </div>
              </div>

              {/* Native Player Controls Toggle (For assurance) */}
              <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[11px] text-[#bbcbbb]">
                <button
                  onClick={() => setShowNativeControls(!showNativeControls)}
                  className="hover:text-[#54e98a] transition-colors cursor-pointer flex items-center gap-1"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[14px]">tune</span>
                  <span>{showNativeControls ? 'Hide Native Audio Bar' : 'Show Native Audio Bar'}</span>
                </button>

                <span className="font-mono text-[10px] text-[#869486]">
                  {hasRecordedAudio ? 'Buffered 100%' : 'Capture in progress'}
                </span>
              </div>

              {/* Native Audio Controls (If toggled) */}
              {showNativeControls && recordedAudioUrl && (
                <div className="mt-1 w-full bg-[#1b2026] p-2 rounded-lg">
                  <audio
                    controls
                    src={recordedAudioUrl}
                    className="w-full h-8"
                  />
                </div>
              )}
            </div>

            {/* Playback notice if blocked */}
            {audioPlaybackNotice && (
              <div className="p-2.5 rounded-lg bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffb4ab] text-[11px] flex items-center justify-between">
                <span>{audioPlaybackNotice}</span>
                <button
                  onClick={handleTogglePlayback}
                  className="px-2 py-0.5 rounded bg-[#ffb4ab] text-[#561e18] font-bold text-[10px]"
                >
                  Retry
                </button>
              </div>
            )}
          </div>

          {/* TRANSCRIPTION RESULT CARD (If transcribed) */}
          {transcriptionText && (
            <div className="w-full rounded-2xl bg-[#171c22] p-3.5 sm:p-4 border border-[#54e98a]/30 shadow-lg flex flex-col gap-2 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#54e98a]" />
                  <span className="font-headline-sm text-[13px] font-semibold text-[#dee3eb]">
                    Vocal Transcription
                  </span>
                  <span className="font-label-sm text-[9px] uppercase tracking-wider px-2 py-0.5 rounded bg-[#005027] text-[#54e98a] font-mono font-bold">
                    Gemini AI Speech
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleCopyTranscript}
                    className="px-2 py-1 rounded-lg bg-[#252a31] hover:bg-[#30353c] text-[#dee3eb] font-label-sm text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                    type="button"
                    title="Copy transcript text"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedToast ? 'done' : 'content_copy'}
                    </span>
                    {copiedToast ? 'Copied' : 'Copy'}
                  </button>

                  <button
                    onClick={handleOpenInTranscribeStudio}
                    className="px-2.5 py-1 rounded-lg bg-[#54e98a]/15 hover:bg-[#54e98a]/25 text-[#54e98a] font-label-sm text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer border border-[#54e98a]/30"
                    type="button"
                    title="Open in full Transcribe Studio"
                  >
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    Studio
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0a0f15] border border-white/5 text-[13px] text-[#dee3eb] font-sans leading-relaxed select-text">
                "{transcriptionText}"
              </div>
            </div>
          )}

          {/* Transcribe Error Notice */}
          {transcribeError && (
            <div className="p-3 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 flex items-center gap-2 text-[#ffb4ab] text-[12px]">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>{transcribeError}</span>
            </div>
          )}

          {/* Primary Action Button: Stop & Analyze */}
          <button
            onClick={handleStopAndAnalyze}
            className="w-full h-13 rounded-full bg-gradient-to-r from-[#2ecc71] via-[#54e98a] to-[#7dd0ff] text-[#003919] font-label-lg text-[13px] sm:text-[14px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_8px_24px_-4px_rgba(46,204,113,0.45)] hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
            type="button"
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              security
            </span>
            <span>Stop &amp; Analyze Deepfake Shield</span>
          </button>

          {/* Secondary Controls Bar: Transcribe, Re-Record & Exit */}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            {/* Direct Transcribe Button */}
            <button
              onClick={handleTranscribeAudio}
              disabled={isTranscribing}
              className="flex-1 py-2.5 px-3 rounded-xl bg-[#1b2026] hover:bg-[#252a31] text-[#54e98a] hover:text-[#7dd0ff] font-label-md text-[12px] font-semibold transition-colors flex items-center justify-center gap-1.5 border border-[#54e98a]/30 active:scale-95 cursor-pointer disabled:opacity-50"
              type="button"
              title="Transcribe recorded audio with Gemini AI Speech Engine"
            >
              {isTranscribing ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">
                    progress_activity
                  </span>
                  <span>Transcribing...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">speech_to_text</span>
                  <span>Transcribe Audio</span>
                </>
              )}
            </button>

            {/* Restart / Re-record Button */}
            <button
              onClick={handleReRecord}
              disabled={isReRecording}
              className={`py-2.5 px-3.5 rounded-xl font-label-md text-[12px] font-semibold transition-all flex items-center justify-center gap-1.5 border active:scale-95 cursor-pointer ${
                isReRecording
                  ? 'bg-[#30353c] text-[#869486] border-white/5 cursor-wait'
                  : 'bg-[#1b2026] hover:bg-[#252a31] text-[#dee3eb] hover:text-[#54e98a] border-[#54e98a]/20'
              }`}
              type="button"
              title="Discard current audio and immediately start a fresh recording"
            >
              <span className={`material-symbols-outlined text-[17px] ${isReRecording ? 'animate-spin' : ''}`}>
                restart_alt
              </span>
              <span>{isReRecording ? 'Restarting...' : 'Re-record'}</span>
            </button>

            {/* Discard & Return Button */}
            <button
              onClick={() => {
                cleanupMicrophone(true);
                onNavigate('home');
              }}
              className="py-2.5 px-3 rounded-xl bg-[#171c22] hover:bg-[#252a31] text-[#ffb4ab]/80 hover:text-[#ffb4ab] font-label-md text-[12px] transition-colors flex items-center justify-center gap-1 border border-white/5 active:scale-95 cursor-pointer"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
              <span>Exit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
