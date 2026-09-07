export type ScreenType = 
  | 'home' 
  | 'scan_record' 
  | 'analyze_upload' 
  | 'scanning_stream' 
  | 'incident_report' 
  | 'samples' 
  | 'alerts'
  | 'transcribe';

export interface TranscriptItem {
  id: string;
  text: string;
  model: string;
  duration: string;
  wordCount: number;
  timestamp: string;
  audioUrl?: string;
  audioData?: string;
  language?: string;
}

export interface ScanHistoryItem {
  id: string;
  filename: string;
  timeAgo: string;
  duration: string;
  isSynthetic: boolean;
  classification: string;
  confidencePercent: number;
  anomalyTag: string;
  model: string;
  acousticFindings: string;
  glottalPulseWindow?: string;
  spectralDiscontinuityWindow?: string;
  neuralConsistency: number;
  harmonicDiffusionMatch: number;
  phaseCutoff: string;
  breathAnomalySeverity: 'CRITICAL' | 'NORMAL' | 'HIGH' | 'LOW';
}

export interface SampleClip {
  id: string;
  title: string;
  type: 'cloned' | 'authentic';
  badge: string;
  duration: string;
  description: string;
  confidenceLabel: string;
  confidenceNum: number;
  model: string;
  notes: string;
  barColorType: 'error' | 'primary' | 'tertiary';
  waveHeights: number[];
}

export interface ProtectionSettings {
  liveMonitoring: boolean;
  instantAlerts: boolean;
  uploadScanNotify: boolean;
  weeklyThreatSummary: boolean;
  sensitivity: number;
  highPriorityThreshold: number;
}
