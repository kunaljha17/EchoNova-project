/**
 * VoiceGuard Audio Utility
 * Provides audio playback management, temporary cloud/server storage,
 * and synthetic acoustic audio sample generation for demo audio inspection.
 */

// Format seconds into MM:SS
export function formatAudioTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Uploads audio file or blob to the server's temporary audio storage.
 * Returns a streaming URL (/api/temp-audio/:id) compatible with browser Range requests.
 */
export async function uploadAudioTemporary(fileOrBlob, preferredName) {
  try {
    const formData = new FormData();
    const isBlob = fileOrBlob instanceof Blob;
    const blobType = isBlob ? fileOrBlob.type || '' : '';
    let defaultExt = '.wav';
    if (blobType.includes('webm')) defaultExt = '.webm';
    else if (blobType.includes('mp4') || blobType.includes('m4a')) defaultExt = '.mp4';
    else if (blobType.includes('ogg')) defaultExt = '.ogg';
    else if (blobType.includes('mpeg') || blobType.includes('mp3')) defaultExt = '.mp3';

    const filename =
      preferredName ||
      (fileOrBlob instanceof File ? fileOrBlob.name : `audio_recording_${Date.now()}${defaultExt}`);
    formData.append('file', fileOrBlob, filename);

    const response = await fetch('/api/upload-temp', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        audioUrl: data.audioUrl,
        audioId: data.audioId,
        filename: data.filename || filename,
        size: data.size,
      };
    }
  } catch (err) {
    console.warn('[AudioHelper] Temporary server upload failed, falling back to local Blob URL:', err);
  }

  // Fallback to local Object URL
  const localUrl = URL.createObjectURL(fileOrBlob);
  return {
    success: true,
    audioUrl: localUrl,
    audioId: `local_${Date.now()}`,
    filename: fileOrBlob instanceof File ? fileOrBlob.name : preferredName || 'recording.wav',
    size: fileOrBlob.size,
  };
}

/**
 * Helper to convert any Blob to base64 data URL
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Helper to encode an AudioBuffer to a valid WAV Blob so it plays anywhere
 */
export function audioBufferToWavBlob(audioBuffer) {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result;
  if (numChannels === 2) {
    result = interleave(
      audioBuffer.getChannelData(0),
      audioBuffer.getChannelData(1)
    );
  } else {
    result = audioBuffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = result.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Write WAV header
  function writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM audio samples
  let offset = 44;
  for (let i = 0; i < result.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  return new Blob([view], { type: 'audio/wav' });
}

function interleave(inputL, inputR) {
  const length = inputL.length + inputR.length;
  const result = new Float32Array(length);
  let index = 0;
  let inputIndex = 0;
  while (index < length) {
    result[index++] = inputL[inputIndex];
    result[index++] = inputR[inputIndex];
    inputIndex++;
  }
  return result;
}

/**
 * Generates an acoustic demo audio sample (useful for the default pre-loaded sample
 * and test bench samples). Produces realistic multi-formant vocal harmonic speech simulation.
 */
export function generateSyntheticAudioSample(mode = 'cloned', durationSeconds = 14) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  try {
    const sampleRate = 24000;
    const ctx = new OfflineAudioContext(1, sampleRate * durationSeconds, sampleRate);
    const length = sampleRate * durationSeconds;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Warm, natural vocal acoustics
    const basePitch = mode === 'cloned' ? 140 : 125;
    let filterState = 0;

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;

      // Natural speech-like cadence with soft pauses and rhythmic syllables
      const phraseEnv = Math.max(0, Math.sin((t * Math.PI) / 2.2));
      const syllable = 0.45 + 0.45 * Math.sin(t * 11) * Math.sin(t * 3);
      const amp = Math.max(0, phraseEnv * syllable);

      // Organic human pitch intonation
      const vibrato = Math.sin(t * 4.8) * 4 + Math.sin(t * 1.5) * 8;
      const f0 = basePitch + vibrato;

      // Smooth vocal formant resonances (F1 ~500Hz, F2 ~1500Hz, F3 ~2500Hz)
      const fundamental = Math.sin(2 * Math.PI * f0 * t);
      const secondHarmonic = Math.sin(2 * Math.PI * f0 * 2 * t) * 0.55;
      const thirdHarmonic = Math.sin(2 * Math.PI * f0 * 3 * t) * 0.25;
      const fourthHarmonic = Math.sin(2 * Math.PI * f0 * 4 * t) * 0.12;

      let rawVoice = (fundamental + secondHarmonic + thirdHarmonic + fourthHarmonic) * amp * 0.35;

      // In cloned mode, add slight vocoder quantization
      if (mode === 'cloned' && t > 3 && t < 8) {
        rawVoice = Math.round(rawVoice * 14) / 14;
      }

      // 1-pole gentle low-pass filter at ~3.2 kHz to remove all harshness & digital squeal
      const alpha = 0.38;
      filterState = filterState + alpha * (rawVoice - filterState);
      data[i] = filterState;
    }

    const wavBlob = audioBufferToWavBlob(buffer);
    return URL.createObjectURL(wavBlob);
  } catch (e) {
    console.warn('[AudioHelper] OfflineAudioContext sample generation error:', e);
    return null;
  }
}
