import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { randomUUID } from 'crypto';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { predict, getLoadedModelInfo } from './model_service.js';

dotenv.config();

// Ensure temporary upload directory exists
const uploadDir = path.join(os.tmpdir(), 'voiceguard_uploads');
const tempAudioDir = path.join(uploadDir, 'persistent_temp_audio');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(tempAudioDir)) {
  fs.mkdirSync(tempAudioDir, { recursive: true });
}

// Temporary audio registry for streaming audio playback
interface TempAudioItem {
  id: string;
  filePath: string;
  originalName: string;
  mimeType: string;
  size: number;
  createdAt: number;
}
const tempAudioRegistry = new Map<string, TempAudioItem>();

// Periodically clean up temporary audio older than 2 hours
setInterval(() => {
  const now = Date.now();
  const maxAge = 2 * 60 * 60 * 1000;
  for (const [id, item] of tempAudioRegistry.entries()) {
    if (now - item.createdAt > maxAge) {
      if (fs.existsSync(item.filePath)) {
        try {
          fs.unlinkSync(item.filePath);
        } catch (_) {}
      }
      tempAudioRegistry.delete(id);
    }
  }
}, 15 * 60 * 1000);

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Past analysis results storage
interface AnalysisHistoryItem {
  id: string;
  filename: string;
  label: 'real' | 'cloned';
  confidence: number;
  timestamp: string;
}

const analysisHistory: AnalysisHistoryItem[] = [
  {
    id: 'rec_sample_01',
    filename: 'ceo_urgent_transfer_memo.wav',
    label: 'cloned',
    confidence: 0.984,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'rec_sample_02',
    filename: 'customer_support_auth.wav',
    label: 'real',
    confidence: 0.962,
    timestamp: new Date(Date.now() - 7200000).toISOString(),
  },
];

let geminiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required.');
    }
    geminiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON body parser with 50mb limit for base64 audio data
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // ==========================================
  // API Routes (Isolated Model Service Layer)
  // ==========================================

  /**
   * GET /health & /api/health
   * Returns server status + currently loaded model_version
   */
  const handleHealth = (_req: express.Request, res: express.Response) => {
    const modelInfo = getLoadedModelInfo();
    res.json({
      status: 'ok',
      service: 'VoiceGuard AI Backend',
      model_version: modelInfo.version,
      model_path: modelInfo.path,
      model_status: modelInfo.status,
      models: {
        deepfake_detector: modelInfo.version,
        transcribe: 'gemini-3.5-transcribe',
      },
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  };
  app.get('/health', handleHealth);
  app.get('/api/health', handleHealth);

  /**
   * GET /history & /api/history
   * Returns past results with fields: id, filename, label, confidence, timestamp
   */
  const handleHistory = (_req: express.Request, res: express.Response) => {
    res.json(analysisHistory);
  };
  app.get('/history', handleHistory);
  app.get('/api/history', handleHistory);

  /**
   * POST /analyze & /api/analyze
   * Accepts uploaded audio file (multipart or base64 JSON),
   * saves temporarily, calls model_service.predict(), returns JSON, deletes temp file after
   */
  const handleAnalyze = async (req: express.Request, res: express.Response) => {
    let tempFilePath: string | null = null;
    let originalName = 'uploaded_audio.wav';

    try {
      // 1. Extract audio from multipart file upload or base64 body
      if (req.file) {
        tempFilePath = req.file.path;
        originalName = req.file.originalname || originalName;
      } else if (req.body?.audioData) {
        const raw = req.body.audioData;
        const cleanBase64 = raw.includes('base64,') ? raw.split('base64,')[1] : raw;
        const audioBuffer = Buffer.from(cleanBase64, 'base64');

        if (audioBuffer.length === 0) {
          return res.status(400).json({ error: 'Invalid audio: Base64 payload is empty.' });
        }

        originalName = req.body.filename || originalName;
        tempFilePath = path.join(uploadDir, `upload_${randomUUID()}.wav`);
        fs.writeFileSync(tempFilePath, audioBuffer);
      } else {
        return res.status(400).json({
          error:
            'No audio file uploaded. Please upload a file (field: "file" or "audio") or provide "audioData" in JSON.',
        });
      }

      // 2. Execute inference ONLY through isolated model_service.predict()
      const result = await predict(tempFilePath);

      // 3. Record in analysis history
      const historyEntry: AnalysisHistoryItem = {
        id: `rec_${randomUUID().slice(0, 8)}`,
        filename: originalName,
        label: result.label,
        confidence: result.confidence,
        timestamp: new Date().toISOString(),
      };
      analysisHistory.unshift(historyEntry);
      if (analysisHistory.length > 50) analysisHistory.pop();

      // 4. Return clean prediction JSON
      return res.json(result);
    } catch (err: any) {
      console.error('[Analyze API Error]:', err.message);
      const statusCode = err.status === 400 || err.message?.includes('Invalid or corrupt') ? 400 : 500;
      return res.status(statusCode).json({
        error: err.message || 'Audio analysis failed.',
      });
    } finally {
      // 5. Always cleanly delete temporary file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (_) {}
      }
    }
  };

  const uploadFields = upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
  ]);
  const multerWrapper = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    uploadFields(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      }
      if (req.files) {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };
        req.file = (files['file']?.[0] || files['audio']?.[0]) as Express.Multer.File;
      }
      next();
    });
  };

  app.post('/analyze', multerWrapper, handleAnalyze);
  app.post('/api/analyze', multerWrapper, handleAnalyze);

  /**
   * POST /api/upload-temp
   * Stores audio temporarily for instant listening, streaming, and inspection
   */
  const handleUploadTemp = async (req: express.Request, res: express.Response) => {
    try {
      let savedFilePath: string | null = null;
      let originalName = 'audio_track.wav';
      let mimeType = 'audio/wav';
      let fileSize = 0;

      if (req.file) {
        originalName = req.file.originalname || originalName;
        mimeType = req.file.mimetype || 'audio/wav';
        fileSize = req.file.size;

        const ext = path.extname(originalName) || '.wav';
        const uniqueId = randomUUID();
        savedFilePath = path.join(tempAudioDir, `temp_${uniqueId}${ext}`);

        // Move/copy file to persistent temp audio directory
        fs.copyFileSync(req.file.path, savedFilePath);
        try {
          fs.unlinkSync(req.file.path);
        } catch (_) {}

        const item: TempAudioItem = {
          id: uniqueId,
          filePath: savedFilePath,
          originalName,
          mimeType,
          size: fileSize,
          createdAt: Date.now(),
        };
        tempAudioRegistry.set(uniqueId, item);

        return res.json({
          success: true,
          audioId: uniqueId,
          audioUrl: `/api/temp-audio/${uniqueId}`,
          filename: originalName,
          size: fileSize,
          mimeType,
        });
      } else if (req.body?.audioData) {
        const raw = req.body.audioData;
        const cleanBase64 = raw.includes('base64,') ? raw.split('base64,')[1] : raw;
        const audioBuffer = Buffer.from(cleanBase64, 'base64');
        originalName = req.body.filename || originalName;
        mimeType = req.body.mimeType || 'audio/wav';
        fileSize = audioBuffer.length;

        const ext = path.extname(originalName) || '.wav';
        const uniqueId = randomUUID();
        savedFilePath = path.join(tempAudioDir, `temp_${uniqueId}${ext}`);
        fs.writeFileSync(savedFilePath, audioBuffer);

        const item: TempAudioItem = {
          id: uniqueId,
          filePath: savedFilePath,
          originalName,
          mimeType,
          size: fileSize,
          createdAt: Date.now(),
        };
        tempAudioRegistry.set(uniqueId, item);

        return res.json({
          success: true,
          audioId: uniqueId,
          audioUrl: `/api/temp-audio/${uniqueId}`,
          filename: originalName,
          size: fileSize,
          mimeType,
        });
      } else {
        return res.status(400).json({ error: 'No audio data provided to upload.' });
      }
    } catch (err: any) {
      console.error('[Upload Temp Error]:', err);
      return res.status(500).json({ error: err.message || 'Failed to save temporary audio.' });
    }
  };

  app.post('/upload-temp', multerWrapper, handleUploadTemp);
  app.post('/api/upload-temp', multerWrapper, handleUploadTemp);

  /**
   * GET /api/temp-audio/:id
   * Streams audio with HTTP Range support for seeking and scrubber playback
   */
  const handleGetTempAudio = (req: express.Request, res: express.Response) => {
    const audioId = req.params.id;
    const item = tempAudioRegistry.get(audioId);

    // If not found in registry, search file system in tempAudioDir
    let filePath: string | null = item ? item.filePath : null;
    let mimeType: string = item ? item.mimeType : 'audio/wav';

    if (!filePath || !fs.existsSync(filePath)) {
      const files = fs.readdirSync(tempAudioDir);
      const matched = files.find((f) => f.includes(audioId));
      if (matched) {
        filePath = path.join(tempAudioDir, matched);
        const ext = path.extname(matched).toLowerCase();
        if (ext === '.mp3') mimeType = 'audio/mpeg';
        else if (ext === '.m4a' || ext === '.mp4') mimeType = 'audio/mp4';
        else if (ext === '.flac') mimeType = 'audio/flac';
        else if (ext === '.ogg') mimeType = 'audio/ogg';
        else if (ext === '.webm') mimeType = 'audio/webm';
        else mimeType = 'audio/wav';
      }
    }

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Temporary audio recording not found or expired.' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      // Parse Range header: e.g. "bytes=0-1024"
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
      });
      fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
        'Accept-Ranges': 'bytes',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  };

  app.get('/temp-audio/:id', handleGetTempAudio);
  app.get('/api/temp-audio/:id', handleGetTempAudio);

  /**
   * DELETE /api/temp-audio/:id
   * Cleans up temporary audio on user action
   */
  app.delete('/api/temp-audio/:id', (req: express.Request, res: express.Response) => {
    const audioId = req.params.id;
    const item = tempAudioRegistry.get(audioId);
    if (item && fs.existsSync(item.filePath)) {
      try {
        fs.unlinkSync(item.filePath);
      } catch (_) {}
      tempAudioRegistry.delete(audioId);
    }
    return res.json({ success: true });
  });

  /**
   * POST /live-analyze & /api/live-analyze
   * Accepts streamed audio chunks (for live recording), buffers/converts to a usable audio format,
   * then calls predict() the same way, and deletes temp buffer file after
   */
  const handleLiveAnalyze = async (req: express.Request, res: express.Response) => {
    let tempFilePath: string | null = null;
    let chunkFilename = 'live_stream_chunk.wav';

    try {
      let audioBuffer: Buffer | null = null;

      if (req.file) {
        tempFilePath = req.file.path;
        chunkFilename = req.file.originalname || chunkFilename;
      } else if (req.body?.chunk || req.body?.audioData) {
        const raw = req.body.chunk || req.body.audioData;
        const cleanBase64 = raw.includes('base64,') ? raw.split('base64,')[1] : raw;
        audioBuffer = Buffer.from(cleanBase64, 'base64');
        chunkFilename = req.body.filename || chunkFilename;
      } else if (Buffer.isBuffer(req.body)) {
        audioBuffer = req.body;
      }

      if (audioBuffer && !tempFilePath) {
        if (audioBuffer.length === 0) {
          return res.status(400).json({ error: 'Streamed audio chunk is empty.' });
        }
        tempFilePath = path.join(uploadDir, `live_${randomUUID()}.wav`);
        fs.writeFileSync(tempFilePath, audioBuffer);
      }

      if (!tempFilePath || !fs.existsSync(tempFilePath)) {
        return res.status(400).json({
          error: 'No live audio chunk provided. Send multipart audio or base64 chunk in request body.',
        });
      }

      // Call predict() through isolated model service
      const result = await predict(tempFilePath);

      // Record in history
      const historyEntry: AnalysisHistoryItem = {
        id: `rec_live_${randomUUID().slice(0, 8)}`,
        filename: chunkFilename,
        label: result.label,
        confidence: result.confidence,
        timestamp: new Date().toISOString(),
      };
      analysisHistory.unshift(historyEntry);
      if (analysisHistory.length > 50) analysisHistory.pop();

      return res.json(result);
    } catch (err: any) {
      console.error('[Live Analyze API Error]:', err.message);
      const statusCode = err.status === 400 || err.message?.includes('Invalid or corrupt') ? 400 : 500;
      return res.status(statusCode).json({
        error: err.message || 'Live audio analysis failed.',
      });
    } finally {
      // Clean up temporary chunk file
      if (tempFilePath && fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
        } catch (_) {}
      }
    }
  };

  app.post('/live-analyze', multerWrapper, handleLiveAnalyze);
  app.post('/api/live-analyze', multerWrapper, handleLiveAnalyze);

  /**
   * Audio Transcription API
   * Uses high-fidelity Gemini models with automatic fallback
   * (gemini-flash-latest & gemini-3.8-flash)
   */
  app.post('/api/transcribe', async (req, res) => {
    try {
      const { audioData, mimeType = 'audio/webm', prompt } = req.body;

      if (!audioData) {
        return res.status(400).json({ error: 'Missing audioData payload' });
      }

      const ai = getGeminiClient();

      // Strip data URI prefix if present
      const cleanBase64 = audioData.includes('base64,')
        ? audioData.split('base64,')[1]
        : audioData;

      // Clean MIME type (remove parameters like codecs=opus)
      const cleanMime = (mimeType || 'audio/webm').split(';')[0].trim() || 'audio/webm';

      const audioPart = {
        inlineData: {
          mimeType: cleanMime,
          data: cleanBase64,
        },
      };

      const instructionText =
        prompt ||
        'Transcribe this audio recording accurately verbatim with natural capitalization and punctuation. If speech is present, output only the transcribed words. If silent, output nothing.';

      // Attempt transcription with gemini-flash-latest first, falling back to gemini-3.8-flash
      const candidateModels = ['gemini-flash-latest', 'gemini-3.8-flash'];
      let lastError: any = null;
      let transcriptionText = '';
      let usedModel = candidateModels[0];

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [audioPart, instructionText],
          });

          const candidate = response.candidates?.[0];
          const parts = candidate?.content?.parts || [];

          for (const part of parts) {
            if ((part as any).audioTranscription?.text) {
              transcriptionText += (part as any).audioTranscription.text + ' ';
            } else if (part.text) {
              transcriptionText += part.text + ' ';
            }
          }

          transcriptionText = transcriptionText.trim();
          if (!transcriptionText && response.text) {
            transcriptionText = response.text.trim();
          }

          usedModel = modelName;
          lastError = null;
          break; // Successfully generated transcription
        } catch (err: any) {
          console.warn(`[Transcription] Model ${modelName} encountered error:`, err?.message || err);
          lastError = err;
        }
      }

      if (lastError && !transcriptionText) {
        const errorMsg = lastError?.message || 'Transcription service error';
        return res.status(500).json({
          error: errorMsg.includes('INVALID_ARGUMENT')
            ? 'The audio format could not be processed. Please record again.'
            : errorMsg,
        });
      }

      return res.json({
        success: true,
        text: transcriptionText,
        model: usedModel,
      });
    } catch (error: any) {
      console.error('Audio transcription error:', error);
      return res.status(500).json({
        error: error?.message || 'Failed to transcribe audio',
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VoiceGuard server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

