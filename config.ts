import path from 'path';
import fs from 'fs';

// Resolve project base directory
export const BASE_DIR = process.cwd();

// Environment-controlled model configuration
const rawModelPath = process.env.MODEL_PATH || '/models/voiceguard_v1.onnx';

// Support absolute container path, relative path, or /models symlink
export const MODEL_PATH = (() => {
  if (fs.existsSync(rawModelPath)) {
    return rawModelPath;
  }
  const relPath = path.resolve(BASE_DIR, rawModelPath.replace(/^\/+/, ''));
  if (fs.existsSync(relPath)) {
    return relPath;
  }
  return rawModelPath;
})();

export const MODEL_VERSION = process.env.MODEL_VERSION || '1.0.0';
