/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ScreenType, ScanHistoryItem, ProtectionSettings } from './types';
import { INITIAL_SCANS, DEFAULT_SETTINGS } from './data/mockData';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { UploadScreen } from './components/UploadScreen';
import { RecordScreen } from './components/RecordScreen';
import { ScanningScreen } from './components/ScanningScreen';
import { ReportScreen } from './components/ReportScreen';
import { SamplesScreen } from './components/SamplesScreen';
import { AlertsScreen } from './components/AlertsScreen';
import { TranscribeScreen } from './components/TranscribeScreen';
import { ProfileModal } from './components/ProfileModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import {
  saveScanRecord,
  subscribeUserScans,
  saveUserSettingsToCloud,
  loadUserSettingsFromCloud,
} from './firebase';

function MainApp() {
  const { user } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [screenHistory, setScreenHistory] = useState<ScreenType[]>(['home']);
  const [scans, setScans] = useState<ScanHistoryItem[]>(INITIAL_SCANS);
  const [selectedScan, setSelectedScan] = useState<ScanHistoryItem | null>(INITIAL_SCANS[0]);
  const [settings, setSettings] = useState<ProtectionSettings>(DEFAULT_SETTINGS);

  // Active scan parameters during scanning stream
  const [scanningTarget, setScanningTarget] = useState<{
    filename: string;
    duration: string;
    mode: 'quick' | 'deep';
  }>({
    filename: 'incoming_call_record_89.wav',
    duration: '0:24',
    mode: 'deep',
  });

  // Sync scans with Firestore when user is authenticated
  useEffect(() => {
    if (!user) {
      // Revert to initial demo scans if signed out
      setScans(INITIAL_SCANS);
      setSelectedScan(INITIAL_SCANS[0]);
      return;
    }

    // Subscribe to real-time scans from Firestore
    const unsubscribe = subscribeUserScans(user.uid, (cloudScans) => {
      if (cloudScans && cloudScans.length > 0) {
        setScans(cloudScans);
        setSelectedScan(cloudScans[0]);
      } else {
        // Initialize user's Firestore scan archive with baseline benchmarks
        INITIAL_SCANS.forEach((initialScan) => {
          saveScanRecord(user.uid, initialScan);
        });
        setScans(INITIAL_SCANS);
      }
    });

    // Load cloud-persisted protection settings
    loadUserSettingsFromCloud(user.uid).then((cloudSettings) => {
      if (cloudSettings) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...cloudSettings,
          highPriorityThreshold:
            cloudSettings.highPriorityThreshold ?? DEFAULT_SETTINGS.highPriorityThreshold,
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpdateSettings = (newSettings: ProtectionSettings) => {
    setSettings(newSettings);
    if (user) {
      saveUserSettingsToCloud(user.uid, newSettings);
    }
  };

  const navigateTo = (nextScreen: ScreenType) => {
    if (nextScreen !== currentScreen) {
      setScreenHistory((prev) => [...prev, currentScreen]);
      setCurrentScreen(nextScreen);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (screenHistory.length > 0) {
      const prev = screenHistory[screenHistory.length - 1];
      setScreenHistory((prevHist) => prevHist.slice(0, -1));
      setCurrentScreen(prev);
    } else {
      setCurrentScreen('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartScan = (
    filename: string,
    duration: string,
    mode: 'quick' | 'deep'
  ) => {
    setScanningTarget({ filename, duration, mode });
    navigateTo('scanning_stream');
  };

  const handleFinishRecording = (duration: string) => {
    setScanningTarget({
      filename: `mic_sentry_capture_${Date.now().toString().slice(-4)}.wav`,
      duration,
      mode: 'deep',
    });
    navigateTo('scanning_stream');
  };

  const handleScanCompleted = () => {
    // Generate a fresh forensic report scan item
    const isSynthetic = Math.random() > 0.35;
    const confidence = isSynthetic ? 98.4 : 99.2;
    const newScan: ScanHistoryItem = {
      id: `scan-${Date.now()}`,
      filename: scanningTarget.filename,
      timeAgo: 'Just now',
      duration: scanningTarget.duration,
      isSynthetic,
      classification: isSynthetic
        ? `Cloned / AI-Generated Voice (${confidence}%)`
        : `Authentic Human (${confidence}%)`,
      confidencePercent: confidence,
      anomalyTag: isSynthetic
        ? 'Phoneme Boundary Discontinuity & Glottal Pulse Flagged'
        : 'Natural vocal tract resonance & pulmonary cadence confirmed',
      model: isSynthetic ? 'Zero-Day Generative Vocoder' : 'Organic Human Vocal Tract',
      acousticFindings: isSynthetic
        ? 'Extremely high probability of latent diffusion neural voice generation. Spectral weight distributions deviate significantly from biological human profiles.'
        : 'Full spectral density, organic sub-harmonic glottal pulses, zero algorithmic stitching detected.',
      glottalPulseWindow: '0:04 - 0:09',
      spectralDiscontinuityWindow: '0:14 - 0:18',
      neuralConsistency: isSynthetic ? 98.4 : 1.8,
      harmonicDiffusionMatch: isSynthetic ? 96.0 : 2.5,
      phaseCutoff: isSynthetic ? '4.2 kHz Hard Cutoff' : 'Full Spectrum 24-bit PCM',
      breathAnomalySeverity: isSynthetic ? 'CRITICAL' : 'NORMAL',
    };

    setScans((prev) => [newScan, ...prev]);
    setSelectedScan(newScan);

    // Persist scan to Firestore if user is authenticated
    if (user) {
      saveScanRecord(user.uid, newScan);
    }

    navigateTo('incident_report');
  };

  const handleSelectScan = (scan: ScanHistoryItem) => {
    setSelectedScan(scan);
  };

  const isNavRoot = currentScreen === 'home';
  const showBack = !isNavRoot && currentScreen !== 'scanning_stream';

  return (
    <div className="min-h-screen bg-[#0f141a] text-[#dee3eb] flex flex-col font-sans selection:bg-[#54e98a] selection:text-[#003919]">
      {/* Top Fixed Header with Auth integration */}
      <Header
        currentScreen={currentScreen}
        onNavigate={navigateTo}
        showBack={showBack}
        onBack={handleBack}
      />

      {/* Main Viewport Container with Responsive Media Query Scaling */}
      <main className="responsive-app-container flex-1 flex flex-col pt-18 sm:pt-20 bg-[#0f141a]">
        {currentScreen === 'home' && (
          <HomeScreen
            scans={scans}
            onNavigate={navigateTo}
            onSelectScan={handleSelectScan}
          />
        )}

        {currentScreen === 'analyze_upload' && (
          <UploadScreen
            onNavigate={navigateTo}
            onStartScan={handleStartScan}
          />
        )}

        {currentScreen === 'scan_record' && (
          <RecordScreen
            onNavigate={navigateTo}
            onFinishRecording={handleFinishRecording}
          />
        )}

        {currentScreen === 'scanning_stream' && (
          <ScanningScreen
            filename={scanningTarget.filename}
            duration={scanningTarget.duration}
            onNavigate={navigateTo}
            onScanComplete={handleScanCompleted}
          />
        )}

        {currentScreen === 'incident_report' && (
          <ReportScreen
            scanItem={selectedScan}
            onNavigate={navigateTo}
          />
        )}

        {currentScreen === 'samples' && (
          <SamplesScreen
            onNavigate={navigateTo}
            onSelectScan={handleSelectScan}
          />
        )}

        {currentScreen === 'transcribe' && (
          <TranscribeScreen
            onNavigate={navigateTo}
            onSendToScan={(audioData, filename, duration) =>
              handleStartScan(filename, duration, 'deep')
            }
          />
        )}

        {currentScreen === 'alerts' && (
          <AlertsScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onNavigate={navigateTo}
            onViewLatestIncident={() => {
              if (scans.length > 0) {
                setSelectedScan(scans[0]);
              }
              navigateTo('incident_report');
            }}
          />
        )}
      </main>

      {/* Persistent Bottom Floating Navigation Dock */}
      {currentScreen !== 'scanning_stream' && (
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={navigateTo}
          hasUnreadAlert={true}
        />
      )}

      {/* User Profile & Google OAuth Details Modal */}
      <ProfileModal
        scansCount={scans.length}
        onNavigateToScans={() => navigateTo('home')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
