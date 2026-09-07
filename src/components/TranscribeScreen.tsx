import React, { useState, useEffect, useRef } from 'react';
import { ScreenType, TranscriptItem, ScanHistoryItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { saveTranscriptRecord, subscribeUserTranscripts } from '../firebase';

interface TranscribeScreenProps {
  onNavigate: (screen: ScreenType) => void;
  onSendToScan?: (audioData: string, filename: string, duration: string) => void;
}

// Built-in speech audio benchmarks for instant testing
const DEMO_AUDIO_PRESETS = [
  {
    id: 'sample-1',
    title: 'Executive Voice Memo',
    duration: '0:07',
    desc: 'Simulated quarterly roadmap brief with crisp human vocal timbre',
    text: 'Good morning team. I wanted to follow up on the quarterly roadmap review. Please make sure all security audits for our voice models are completed before Friday.',
  },
  {
    id: 'sample-2',
    title: 'Verification Call Sentry',
    duration: '0:05',
    desc: 'Audio sample containing high-frequency phone line compression',
    text: 'This is an automated verification confirmation for wire transfer request number 8492. Press one to authorize or speak your PIN.',
  },
  {
    id: 'sample-3',
    title: 'Synthesized Voice Clone Test',
    duration: '0:06',
    desc: 'Neural vocoder clip with slight glottal phase irregularities',
    text: 'Hello, this is security officer Davis. We have detected anomalous access attempts on your enterprise workstation. Please verify your credentials immediately.',
  },
];

export const TranscribeScreen: React.FC<TranscribeScreenProps> = ({
  onNavigate,
  onSendToScan,
}) => {
  const { user, signIn } = useAuth();

  // Recording State
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [recordSeconds, setRecordSeconds] = useState<number>(0);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [visualizerBars, setVisualizerBars] = useState<number[]>([
    15, 25, 40, 65, 80, 55, 30, 45, 70, 85, 50, 35, 60, 45, 20, 30,
  ]);

  // Audio Data & Playback State
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedBase64, setRecordedBase64] = useState<string | null>(null);
  const [audioMimeType, setAudioMimeType] = useState<string>('audio/webm');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Transcription State
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [transcriptResult, setTranscriptResult] = useState<string>('');
  const [activeModel, setActiveModel] = useState<string>('gemini-3.5-transcribe');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);
  const [savedToast, setSavedToast] = useState<boolean>(false);

  // History State
  const [transcriptsHistory, setTranscriptsHistory] = useState<TranscriptItem[]>([]);

  // Mic & Audio stream references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Subscribe to user transcripts from Firestore if logged in
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeUserTranscripts(user.uid, (cloudTranscripts) => {
      if (cloudTranscripts && cloudTranscripts.length > 0) {
        setTranscriptsHistory(cloudTranscripts);
      }
    });
    return () => unsubscribe();
  }, [user]);

  // Clean up audio references on unmount
  useEffect(() => {
    return () => {
      stopMicrophoneStream();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (recordedAudioUrl) URL.revokeObjectURL(recordedAudioUrl);
    };
  }, [recordedAudioUrl]);

  // Handle Recording Timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 120) {
            // Cap at 2 minutes
            handleStopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording, isPaused]);

  const stopMicrophoneStream = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const startVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateBars = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Compute volume level
        let sum = 0;
        const barHeights: number[] = [];
        const step = Math.floor(dataArray.length / 16);

        for (let i = 0; i < 16; i++) {
          const val = dataArray[i * step] || 0;
          sum += val;
          // Scale from 0-255 to percentage 10-100
          barHeights.push(Math.max(10, Math.min(100, Math.round((val / 255) * 100))));
        }

        const avg = sum / (dataArray.length || 1);
        setVolumeLevel(Math.round((avg / 255) * 100));
        setVisualizerBars(barHeights);

        animationFrameRef.current = requestAnimationFrame(updateBars);
      };

      updateBars();
    } catch (err) {
      console.warn('AudioContext visualizer initialization notice:', err);
    }
  };

  /**
   * Start Microphone Capture
   */
  const handleStartRecording = async () => {
    setErrorMessage(null);
    setRecordedBlob(null);
    setRecordedAudioUrl(null);
    setRecordedBase64(null);
    setTranscriptResult('');
    setRecordSeconds(0);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser environment.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      micStreamRef.current = stream;
      startVisualizer(stream);

      // Determine supported mime type
      let mime = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mime = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mime = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mime = 'audio/ogg';
      }
      setAudioMimeType(mime);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (!audioChunksRef.current || audioChunksRef.current.length === 0) {
          setErrorMessage('No audio data was captured. Please speak into the microphone and try again.');
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: mime });
        if (audioBlob.size < 200) {
          setErrorMessage('Audio snippet was too short. Please speak clearly for at least 1-2 seconds.');
          return;
        }

        setRecordedBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setRecordedAudioUrl(url);

        // Convert blob to base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          setRecordedBase64(result);
          // Auto-trigger transcription with gemini-3.5-transcribe
          transcribeAudioData(result, mime, audioBlob);
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start(250); // Slice data every 250ms
      setIsRecording(true);
      setIsPaused(false);
    } catch (err: any) {
      console.error('Microphone recording error:', err);
      setErrorMessage(
        err.message ||
          'Could not access microphone. Please check microphone permissions or try one of the audio sample presets below.'
      );
      stopMicrophoneStream();
    }
  };

  /**
   * Stop Recording
   */
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        if (typeof mediaRecorderRef.current.requestData === 'function') {
          mediaRecorderRef.current.requestData();
        }
      } catch (e) {
        // ignore if not supported
      }
      mediaRecorderRef.current.stop();
    }
    stopMicrophoneStream();
    setIsRecording(false);
    setIsPaused(false);
  };

  /**
   * Pause/Resume Recording
   */
  const handleTogglePause = () => {
    if (!mediaRecorderRef.current) return;
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  /**
   * Call the server API using model gemini-3.5-transcribe
   */
  const transcribeAudioData = async (
    base64Data: string,
    mimeType: string,
    blob?: Blob
  ) => {
    setIsTranscribing(true);
    setErrorMessage(null);
    setTranscriptResult('');

    try {
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioData: base64Data,
          mimeType: mimeType || 'audio/webm',
          prompt:
            'Transcribe this spoken audio accurately verbatim with natural punctuation and capitalization. Do not summarize.',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Server responded with error status ${response.status}`
        );
      }

      const data = await response.json();
      const transcribedText = data.text?.trim() || '';

      if (!transcribedText) {
        setTranscriptResult('No spoken words were clearly recognized. Please ensure your microphone is unmuted and speak clearly near the microphone.');
      } else {
        setTranscriptResult(transcribedText);
      }

      setActiveModel(data.model || 'gemini-3.5-transcribe');

      // Create history item if text was recognized
      if (transcribedText) {
        const durationStr = formatDuration(recordSeconds || 6);
        const wordCount = transcribedText.split(/\s+/).filter(Boolean).length;
        const newTranscriptItem: TranscriptItem = {
          id: `transcript-${Date.now()}`,
          text: transcribedText,
          model: 'gemini-3.5-transcribe',
          duration: durationStr,
          wordCount,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          language: 'English (Detected)',
          audioData: base64Data,
        };

        setTranscriptsHistory((prev) => [newTranscriptItem, ...prev]);

        // Save to Firestore if user is authenticated
        if (user) {
          saveTranscriptRecord(user.uid, newTranscriptItem);
        }
      }
    } catch (err: any) {
      console.error('Transcription request failed:', err);
      setErrorMessage(
        err.message ||
          'Failed to transcribe audio. Ensure the backend server and GEMINI_API_KEY are configured.'
      );
    } finally {
      setIsTranscribing(false);
    }
  };

  /**
   * Transcribe a demo preset
   */
  const handleSelectDemoPreset = (preset: typeof DEMO_AUDIO_PRESETS[0]) => {
    setErrorMessage(null);
    setIsTranscribing(true);
    setRecordedBlob(null);
    setRecordedAudioUrl(null);
    setRecordSeconds(parseInt(preset.duration.split(':')[1], 10) || 6);

    // Simulate audio synthesis decode
    setTimeout(() => {
      setTranscriptResult(preset.text);
      setActiveModel('gemini-3.5-transcribe');
      setIsTranscribing(false);

      const wordCount = preset.text.split(/\s+/).filter(Boolean).length;
      const newHistoryItem: TranscriptItem = {
        id: `transcript-demo-${Date.now()}`,
        text: preset.text,
        model: 'gemini-3.5-transcribe',
        duration: preset.duration,
        wordCount,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        language: 'English',
      };

      setTranscriptsHistory((prev) => [newHistoryItem, ...prev]);
      if (user) {
        saveTranscriptRecord(user.uid, newHistoryItem);
      }
    }, 900);
  };

  /**
   * Handle user uploading a custom audio file to transcribe
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setTranscriptResult('');
    setRecordedBlob(file);
    const url = URL.createObjectURL(file);
    setRecordedAudioUrl(url);

    const mime = file.type || 'audio/wav';
    setAudioMimeType(mime);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setRecordedBase64(base64);
      setRecordSeconds(12);
      transcribeAudioData(base64, mime, file);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyTranscript = () => {
    if (!transcriptResult) return;
    navigator.clipboard.writeText(transcriptResult).then(() => {
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    });
  };

  const handleManualSaveToCloud = () => {
    if (!user) {
      signIn();
      return;
    }
    if (!transcriptResult) return;

    const item: TranscriptItem = {
      id: `transcript-${Date.now()}`,
      text: transcriptResult,
      model: 'gemini-3.5-transcribe',
      duration: formatDuration(recordSeconds),
      wordCount: transcriptResult.split(/\s+/).filter(Boolean).length,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      language: 'English',
    };

    saveTranscriptRecord(user.uid, item);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleSendToForensicScan = () => {
    if (onSendToScan && recordedBase64) {
      onSendToScan(
        recordedBase64,
        `mic_transcribe_${Date.now().toString().slice(-4)}.wav`,
        formatDuration(recordSeconds)
      );
    } else {
      onNavigate('scan_record');
    }
  };

  const formatDuration = (sec: number) => {
    const mm = String(Math.floor(sec / 60)).padStart(2, '0');
    const ss = String(sec % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  };

  return (
    <div className="flex flex-col w-full gap-4 pb-12">
      {/* Screen Header Bar */}
      <div className="flex items-center justify-between w-full py-1">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('home')}
            className="w-10 h-10 rounded-full bg-[#171c22] flex items-center justify-center text-[#dee3eb] hover:bg-[#252a31] transition-all active:scale-95 cursor-pointer"
            type="button"
            aria-label="Back to home"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="font-headline-sm text-[17px] text-[#dee3eb] font-bold tracking-tight">
              Audio Transcription
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="font-label-sm text-[10px] text-[#54e98a] font-mono font-semibold">
                gemini-3.5-transcribe
              </span>
              <span className="w-1 h-1 rounded-full bg-[#869486]" />
              <span className="font-label-sm text-[10px] text-[#bbcbbb]">Microphone Input</span>
            </div>
          </div>
        </div>

        {/* Model Spec Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#171c22] border border-[#54e98a]/20 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#54e98a] animate-pulse" />
          <span className="font-label-sm text-[11px] text-[#dee3eb] font-mono font-medium">
            AI Speech Engine
          </span>
        </div>
      </div>

      {/* Main Studio Console Layout (Responsive 2-Column on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Live Audio Capture Panel */}
        <div className="lg:col-span-6 flex flex-col gap-3.5">
          {/* Microphone Recording Card */}
          <div className="relative rounded-2xl bg-[#171c22] p-5 border border-white/10 shadow-lg overflow-hidden">
            {/* Ambient glowing radial effect when recording */}
            {isRecording && (
              <div className="absolute -inset-2 bg-[#54e98a]/10 filter blur-2xl pointer-events-none animate-pulse" />
            )}

            <div className="flex items-center justify-between relative z-10 mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`w-3 h-3 rounded-full ${
                    isRecording
                      ? isPaused
                        ? 'bg-[#ffc37d]'
                        : 'bg-[#ffb4ab] animate-ping'
                      : 'bg-[#54e98a]'
                  }`}
                />
                <span className="font-label-md text-[12px] font-bold tracking-wider uppercase text-[#dee3eb]">
                  {isRecording
                    ? isPaused
                      ? 'Microphone Paused'
                      : 'Listening via Microphone'
                    : 'Microphone Standby'}
                </span>
              </div>

              {/* Time display */}
              <div className="font-mono font-bold text-[14px] text-[#dee3eb] bg-[#0a0f15] px-3 py-1 rounded-lg border border-white/5">
                {formatDuration(recordSeconds)} / 02:00
              </div>
            </div>

            {/* Dynamic Visualizer Waveform */}
            <div className="relative z-10 w-full h-28 bg-[#0a0f15] rounded-xl p-3 flex items-end justify-between gap-1.5 border border-white/5 overflow-hidden">
              {visualizerBars.map((height, idx) => (
                <div
                  key={idx}
                  style={{ height: isRecording ? `${height}%` : '18%' }}
                  className={`flex-1 rounded-full transition-all duration-75 ${
                    isRecording
                      ? isPaused
                        ? 'bg-[#ffc37d]'
                        : 'bg-gradient-to-t from-[#54e98a] to-[#7dd0ff]'
                      : 'bg-[#252a31]'
                  }`}
                />
              ))}
            </div>

            {/* Live dB Telemetry & Signal Clarity */}
            <div className="relative z-10 flex items-center justify-between mt-3 text-[11px] text-[#869486] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-[#7dd0ff]">
                  graphic_eq
                </span>
                <span>Signal: {isRecording ? `${volumeLevel}% dBFS` : 'Quiet (48 kHz)'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-[#54e98a]">
                  verified
                </span>
                <span>Format: {audioMimeType.split(';')[0]}</span>
              </div>
            </div>

            {/* Primary Recording Action Controls */}
            <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 mt-5 pt-3 border-t border-white/5">
              {!isRecording ? (
                <button
                  onClick={handleStartRecording}
                  disabled={isTranscribing}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#54e98a] hover:bg-[#68f59c] text-[#003919] font-headline-sm text-[14px] font-bold shadow-lg shadow-[#54e98a]/20 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[22px]">mic</span>
                  <span>Record Microphone</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleTogglePause}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#252a31] hover:bg-[#353a40] text-[#dee3eb] font-label-md text-[12px] font-semibold transition-all active:scale-95 cursor-pointer border border-white/10"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isPaused ? 'play_arrow' : 'pause'}
                    </span>
                    <span>{isPaused ? 'Resume' : 'Pause'}</span>
                  </button>

                  <button
                    onClick={handleStopRecording}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#ffb4ab] hover:bg-[#ff897d] text-[#690005] font-headline-sm text-[13px] font-bold shadow-lg shadow-[#ffb4ab]/20 transition-all active:scale-95 cursor-pointer"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">stop</span>
                    <span>Stop &amp; Transcribe</span>
                  </button>
                </>
              )}

              {/* Upload alternative */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isRecording || isTranscribing}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full bg-[#1b2026] hover:bg-[#252a31] text-[#bbcbbb] hover:text-[#dee3eb] font-label-md text-[12px] font-medium transition-colors border border-white/5 cursor-pointer disabled:opacity-50"
                type="button"
                title="Upload audio file to transcribe"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                <span>Upload File</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.wav,.mp3,.m4a,.webm,.ogg"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Error banner if microphone access fails */}
            {errorMessage && (
              <div className="relative z-10 mt-3 p-3 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/30 text-[#ffb4ab] text-[12px] flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">
                  warning
                </span>
                <div className="flex flex-col">
                  <span>{errorMessage}</span>
                  <span className="text-[11px] text-[#dee3eb]/80 mt-1">
                    Tip: You can still test transcription immediately using the sample audio
                    presets below.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Audio Player for recorded or selected clip */}
          {recordedAudioUrl && (
            <div className="rounded-xl bg-[#171c22] p-3.5 border border-white/10 flex items-center justify-between gap-3 shadow">
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={() => {
                    if (audioElementRef.current) {
                      if (isPlayingAudio) {
                        audioElementRef.current.pause();
                        setIsPlayingAudio(false);
                      } else {
                        audioElementRef.current.play();
                        setIsPlayingAudio(true);
                      }
                    }
                  }}
                  className="w-9 h-9 rounded-full bg-[#54e98a] text-[#003919] flex items-center justify-center font-bold shrink-0 cursor-pointer shadow active:scale-95"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {isPlayingAudio ? 'pause' : 'play_arrow'}
                  </span>
                </button>
                <div className="flex flex-col min-w-0">
                  <span className="font-label-md text-[12px] text-[#dee3eb] font-semibold truncate">
                    Captured Audio Playback
                  </span>
                  <span className="font-body-sm text-[10px] text-[#869486] font-mono">
                    Duration: {formatDuration(recordSeconds)} • {audioMimeType.split(';')[0]}
                  </span>
                </div>
              </div>

              <audio
                ref={audioElementRef}
                src={recordedAudioUrl}
                onEnded={() => setIsPlayingAudio(false)}
                className="hidden"
              />

              <button
                onClick={() =>
                  recordedBase64 &&
                  transcribeAudioData(recordedBase64, audioMimeType, recordedBlob || undefined)
                }
                disabled={isTranscribing}
                className="px-3 py-1.5 rounded-lg bg-[#252a31] hover:bg-[#353a40] text-[#7dd0ff] font-label-sm text-[11px] font-mono font-semibold transition-colors cursor-pointer border border-[#7dd0ff]/20"
                type="button"
              >
                Re-Transcribe
              </button>
            </div>
          )}

          {/* Quick Audio Benchmarks & Presets */}
          <div className="rounded-2xl bg-[#171c22] p-4 border border-white/5 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="font-label-md text-[12px] font-semibold text-[#dee3eb] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#7dd0ff] text-[16px]">
                  library_music
                </span>
                Speech Presets (One-Click Test)
              </span>
              <span className="font-label-sm text-[10px] text-[#869486] font-mono">
                No Mic Needed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {DEMO_AUDIO_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectDemoPreset(preset)}
                  className="group p-2.5 rounded-xl bg-[#0a0f15] hover:bg-[#252a31] border border-white/5 transition-all cursor-pointer flex flex-col justify-between text-left"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-label-md text-[11px] font-bold text-[#dee3eb] group-hover:text-[#54e98a]">
                      {preset.title}
                    </span>
                    <span className="font-label-sm text-[9px] text-[#869486] font-mono">
                      {preset.duration}
                    </span>
                  </div>
                  <span className="font-body-sm text-[10px] text-[#bbcbbb] line-clamp-2 leading-relaxed">
                    {preset.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Transcription Output & Forensic Intelligence */}
        <div className="lg:col-span-6 flex flex-col gap-3.5">
          {/* Transcript Result Box */}
          <div className="rounded-2xl bg-[#171c22] p-5 border border-white/10 shadow-lg flex flex-col min-h-[340px]">
            {/* Box Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#54e98a] text-[20px]">
                  speech_to_text
                </span>
                <span className="font-headline-sm text-[14px] text-[#dee3eb] font-bold">
                  Generated Transcript
                </span>
              </div>

              {/* Model Tag */}
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#0a0f15] border border-[#54e98a]/30">
                <span className="font-label-sm text-[10px] text-[#54e98a] font-mono font-bold">
                  model: {activeModel}
                </span>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 py-4 flex flex-col justify-center">
              {isTranscribing ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-[#54e98a]/30 border-t-[#54e98a] animate-spin" />
                    <span className="material-symbols-outlined text-[#54e98a] text-[22px]">
                      graphic_eq
                    </span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-label-md text-[13px] text-[#dee3eb] font-semibold">
                      Transcribing with gemini-3.5-transcribe...
                    </span>
                    <span className="font-body-sm text-[11px] text-[#869486] mt-0.5">
                      Extracting phonemes and linguistic tokens
                    </span>
                  </div>
                </div>
              ) : transcriptResult ? (
                <div className="flex flex-col gap-3">
                  <div className="p-4 rounded-xl bg-[#0a0f15] border border-white/5 text-[#dee3eb] font-body-lg text-[14px] leading-relaxed whitespace-pre-wrap select-text">
                    {transcriptResult}
                  </div>

                  {/* Speech Statistics Bar */}
                  <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-xl bg-[#0a0f15] border border-white/5 font-mono text-[11px]">
                    <div className="flex flex-col">
                      <span className="text-[#869486] text-[9px] uppercase">Word Count</span>
                      <span className="font-bold text-[#dee3eb]">
                        {transcriptResult.split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#869486] text-[9px] uppercase">Speaking Rate</span>
                      <span className="font-bold text-[#54e98a]">
                        ~145 wpm
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[#869486] text-[9px] uppercase">Language</span>
                      <span className="font-bold text-[#7dd0ff]">Auto (English)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-[#869486] gap-2">
                  <span className="material-symbols-outlined text-[36px] opacity-40">
                    mic_external_on
                  </span>
                  <p className="font-body-md text-[13px] max-w-[280px]">
                    Click &quot;Record Microphone&quot; or select a speech preset to generate a verbatim transcript with gemini-3.5-transcribe.
                  </p>
                </div>
              )}
            </div>

            {/* Transcript Actions */}
            {transcriptResult && !isTranscribing && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  {/* Copy Button */}
                  <button
                    onClick={handleCopyTranscript}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252a31] hover:bg-[#353a40] text-[#dee3eb] font-label-md text-[11px] font-semibold transition-all cursor-pointer active:scale-95 border border-white/5"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#54e98a]">
                      {copiedToast ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedToast ? 'Copied!' : 'Copy Text'}</span>
                  </button>

                  {/* Save to Firestore Button */}
                  <button
                    onClick={handleManualSaveToCloud}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252a31] hover:bg-[#353a40] text-[#7dd0ff] font-label-md text-[11px] font-semibold transition-all cursor-pointer active:scale-95 border border-[#7dd0ff]/20"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {savedToast ? 'done' : 'cloud_upload'}
                    </span>
                    <span>{savedToast ? 'Synced to Cloud!' : user ? 'Save to Firestore' : 'Sign In & Save'}</span>
                  </button>
                </div>

                {/* Send to Deepfake Scanner Button */}
                <button
                  onClick={handleSendToForensicScan}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#003919] hover:bg-[#004f24] text-[#54e98a] border border-[#54e98a]/30 font-label-md text-[11px] font-bold transition-all cursor-pointer active:scale-95"
                  type="button"
                  title="Cross-examine voice for AI deepfake cloning"
                >
                  <span className="material-symbols-outlined text-[16px]">shield</span>
                  <span>Deepfake Forensic Scan</span>
                </button>
              </div>
            )}
          </div>

          {/* Transcript Archive History */}
          {transcriptsHistory.length > 0 && (
            <div className="rounded-2xl bg-[#171c22] p-4 border border-white/5 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="font-label-md text-[12px] font-semibold text-[#dee3eb] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#54e98a] text-[16px]">
                    history
                  </span>
                  Recent Transcriptions ({transcriptsHistory.length})
                </span>
                {user && (
                  <span className="font-label-sm text-[9px] text-[#54e98a] bg-[#54e98a]/10 px-2 py-0.5 rounded-full font-mono border border-[#54e98a]/20">
                    Firestore Synced
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {transcriptsHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setTranscriptResult(item.text)}
                    className="p-2.5 rounded-xl bg-[#0a0f15] hover:bg-[#252a31] border border-white/5 transition-all cursor-pointer flex flex-col gap-1 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-[10px] text-[#7dd0ff] font-mono">
                        {item.timestamp} • {item.duration}
                      </span>
                      <span className="font-label-sm text-[9px] text-[#54e98a] bg-[#171c22] px-1.5 py-0.2 rounded font-mono">
                        {item.model}
                      </span>
                    </div>
                    <span className="font-body-sm text-[11px] text-[#dee3eb] line-clamp-1">
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
