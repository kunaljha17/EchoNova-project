import React, { useState } from 'react';
import { ScreenType, ProtectionSettings } from '../types';
import { SHIELD_LOGO_URL } from './Header';
import { useAuth } from '../context/AuthContext';

interface AlertsScreenProps {
  settings: ProtectionSettings;
  onUpdateSettings: (newSettings: ProtectionSettings) => void;
  onNavigate: (screen: ScreenType) => void;
  onViewLatestIncident: () => void;
}

export const AlertsScreen: React.FC<AlertsScreenProps> = ({
  settings,
  onUpdateSettings,
  onViewLatestIncident,
}) => {
  const { user, signIn, setIsProfileOpen, loading } = useAuth();
  const [showBanner, setShowBanner] = useState(true);
  const [streamMuted, setStreamMuted] = useState(false);
  const [simulatedConfidence, setSimulatedConfidence] = useState<number>(94.5);
  const [savedToast, setSavedToast] = useState(false);

  const threshold = settings.highPriorityThreshold ?? 90;
  const isHighPriorityTriggered = simulatedConfidence >= threshold;

  const triggerSavedToast = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleToggle = (
    key: keyof Omit<ProtectionSettings, 'sensitivity' | 'highPriorityThreshold'>
  ) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
    triggerSavedToast();
  };

  const handleSensitivityChange = (val: number) => {
    onUpdateSettings({
      ...settings,
      sensitivity: val,
    });
    triggerSavedToast();
  };

  const handleThresholdChange = (val: number) => {
    const clamped = Math.min(99, Math.max(50, isNaN(val) ? 90 : Math.round(val)));
    onUpdateSettings({
      ...settings,
      highPriorityThreshold: clamped,
    });
    triggerSavedToast();
  };

  const getSensitivityLabel = (val: number) => {
    if (val >= 85) return `High (${val}%)`;
    if (val >= 70) return `Balanced (${val}%)`;
    return `Aggressive (${val}%)`;
  };

  const getThresholdTier = (val: number) => {
    if (val >= 95) {
      return {
        label: `Critical Only (≥${val}%)`,
        badgeColor: 'bg-[#93000a] text-[#ffdad6] border border-[#ffb4ab]/30',
        desc: 'Maximum precision. Only unmistakable, verified deepfakes will fire intrusive alerts.',
      };
    }
    if (val >= 90) {
      return {
        label: `High Priority (≥${val}%)`,
        badgeColor: 'bg-[#ffc37d] text-[#462a00]',
        desc: 'Recommended security balance. Triggers on high-confidence neural synthesis.',
      };
    }
    if (val >= 80) {
      return {
        label: `Balanced (≥${val}%)`,
        badgeColor: 'bg-[#7dd0ff] text-[#00344d]',
        desc: 'Standard forensic threshold. Flags potential clones and suspicious acoustic artifacts.',
      };
    }
    return {
      label: `Sensitive / Broad (≥${val}%)`,
      badgeColor: 'bg-[#54e98a] text-[#003919]',
      desc: 'Early warning mode. Alert dispatches on any detected vocal irregularities.',
    };
  };

  const currentTier = getThresholdTier(threshold);

  return (
    <div className="flex flex-col w-full space-y-4 pb-6">
      {/* Toast Notification for Cloud Sync */}
      {savedToast && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#005027] text-[#54e98a] border border-[#54e98a]/30 shadow-xl backdrop-blur-md animate-fade-in font-label-md text-[12px] font-semibold">
          <span className="material-symbols-outlined text-[18px]">cloud_done</span>
          <span>Threshold synced to {user ? 'Cloud account' : 'session'}</span>
        </div>
      )}

      {/* Responsive 2-Column Grid */}
      <div className="responsive-2col-grid">
        {/* Left Column: Simulated Alerts & Notifications */}
        <div className="flex flex-col space-y-4">
          {/* Active In-App Alert Banner with Threshold Gate */}
          {showBanner && (
            <section
              className={`relative overflow-hidden rounded-xl p-3 shadow-lg transition-all duration-300 border ${
                isHighPriorityTriggered
                  ? 'bg-gradient-to-r from-[#93000a] via-[#b3261e] to-[#93000a] border-[#ffb4ab]/40 shadow-[0_12px_28px_rgba(147,0,10,0.5)]'
                  : 'bg-[#1b2026] border-white/10 opacity-90'
              }`}
              id="inAppAlertBanner"
            >
              {/* Animated Glow Pulse Underlay if High Priority */}
              {isHighPriorityTriggered && (
                <div className="absolute -inset-1 bg-gradient-to-r from-[#ffb4ab]/30 to-[#ffc37d]/20 blur-md pointer-events-none animate-pulse" />
              )}

              <div className="relative z-10 flex flex-col gap-2">
                {/* Top Row: Icon + Badge + Dismiss */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`relative flex items-center justify-center w-8 h-8 rounded-lg ${
                        isHighPriorityTriggered
                          ? 'bg-[#0a0f15]/80 text-[#ffb4ab]'
                          : 'bg-[#252a31] text-[#bbcbbb]'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[20px] ${
                          isHighPriorityTriggered ? 'animate-bounce' : ''
                        }`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {isHighPriorityTriggered ? 'warning' : 'notifications_off'}
                      </span>
                      {isHighPriorityTriggered && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#ffb4ab] rounded-full ring-2 ring-[#93000a]" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-headline-sm text-[14px] text-[#dee3eb] font-bold tracking-tight">
                        {isHighPriorityTriggered
                          ? '⚠ High-Priority Alert: Voice Cloning'
                          : 'ℹ Alert Suppressed (Below Threshold)'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <span
                      className={`font-label-sm text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                        isHighPriorityTriggered
                          ? 'bg-[#0a0f15] text-[#ffb4ab] border border-[#ffb4ab]/30'
                          : 'bg-[#252a31] text-[#bbcbbb]'
                      }`}
                    >
                      {isHighPriorityTriggered ? 'TRIGGERED' : 'SUPPRESSED'}
                    </span>
                    <button
                      onClick={() => setShowBanner(false)}
                      aria-label="Dismiss Alert"
                      className="w-7 h-7 flex items-center justify-center rounded-full bg-[#0a0f15]/40 text-[#dee3eb] hover:bg-[#0a0f15] transition-colors cursor-pointer"
                      id="dismissBannerBtn"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                </div>

                {/* Description Subtext showing Threshold Comparison */}
                <p className="font-body-sm text-[12px] text-[#dee3eb] font-medium leading-snug">
                  {isHighPriorityTriggered ? (
                    <>
                      Detected confidence (
                      <span className="font-bold text-[#ffb4ab] font-mono">
                        {simulatedConfidence}%
                      </span>
                      ) meets or exceeds your custom threshold (
                      <span className="font-bold text-[#ffc37d] font-mono">≥{threshold}%</span>
                      ). High-priority push alert and urgent audio alarms are triggered.
                    </>
                  ) : (
                    <>
                      Detected confidence (
                      <span className="font-bold text-[#bbcbbb] font-mono">
                        {simulatedConfidence}%
                      </span>
                      ) is below your custom threshold (
                      <span className="font-bold text-[#7dd0ff] font-mono">≥{threshold}%</span>
                      ). High-priority alarm is silenced; event is stored in background telemetry.
                    </>
                  )}
                </p>

                {/* Action Buttons Row */}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-label-sm text-[10px] text-[#bbcbbb] font-mono">
                    Custom Threshold: ≥{threshold}% • Sample: {simulatedConfidence}%
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowBanner(false)}
                      className="px-3 py-1.5 rounded-full font-label-md text-[11px] text-[#dee3eb] hover:bg-[#0a0f15]/30 transition-colors cursor-pointer"
                      id="quickDismiss"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={onViewLatestIncident}
                      className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-[#0a0f15] text-[#ffb4ab] font-label-md text-[11px] font-bold shadow-md hover:bg-[#171c22] transition-all cursor-pointer"
                    >
                      <span>View Forensics</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Interactive Live Threshold Test Bench */}
          <section className="flex flex-col gap-2 p-3.5 rounded-xl bg-[#171c22] border border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#7dd0ff]">
                  science
                </span>
                <span className="font-headline-sm text-[13px] text-[#dee3eb] font-semibold">
                  Threshold Test Simulator
                </span>
              </div>
              <span className="font-label-sm text-[10px] text-[#869486] font-mono">
                Live Trigger Preview
              </span>
            </div>
            <p className="font-body-sm text-[11px] text-[#bbcbbb] leading-relaxed">
              Select or slide an incoming synthetic confidence score to verify how your custom
              threshold (<span className="font-bold text-[#54e98a]">≥{threshold}%</span>) gates the
              high-priority notification.
            </p>

            <div className="flex flex-col gap-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#bbcbbb]">Simulated Audio Confidence:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[12px] ${
                    isHighPriorityTriggered
                      ? 'bg-[#93000a] text-[#ffdad6]'
                      : 'bg-[#252a31] text-[#bbcbbb]'
                  }`}
                >
                  {simulatedConfidence}%{' '}
                  {isHighPriorityTriggered ? '⚡ High Alert' : '🔇 Suppressed'}
                </span>
              </div>
              <input
                type="range"
                min="50"
                max="99"
                step="0.5"
                value={simulatedConfidence}
                onChange={(e) => {
                  setSimulatedConfidence(Number(e.target.value));
                  setShowBanner(true);
                }}
                className="w-full h-1.5 bg-[#0a0f15] rounded-lg appearance-none cursor-pointer accent-[#7dd0ff]"
              />
            </div>

            {/* Quick Test Presets */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[
                { label: '72% Call', val: 72 },
                { label: '86% Bot', val: 86 },
                { label: '92% Clone', val: 92 },
                { label: '98% Deepfake', val: 98.4 },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    setSimulatedConfidence(p.val);
                    setShowBanner(true);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-mono font-medium transition-all cursor-pointer border ${
                    simulatedConfidence === p.val
                      ? 'bg-[#252a31] text-[#7dd0ff] border-[#7dd0ff]/40 shadow-sm'
                      : 'bg-[#0a0f15] text-[#bbcbbb] hover:text-[#dee3eb] border-white/5'
                  }`}
                  type="button"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </section>

          {/* Simulated OS Lock Screen / System Push Notification Card */}
          <section className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between px-1">
              <span className="font-label-sm text-[10px] uppercase tracking-widest text-[#bbcbbb] font-semibold font-mono">
                Simulated Push Notification
              </span>
              <span className="font-label-sm text-[10px] text-[#7dd0ff] flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7dd0ff] animate-ping" />
                Live Broadcast
              </span>
            </div>

            {/* Notification Container */}
            <div
              className={`relative overflow-hidden rounded-xl bg-[#1b2026]/90 backdrop-blur-xl p-4 shadow-[0_8px_24px_rgba(0,0,0,0.5)] border ${
                isHighPriorityTriggered
                  ? 'border-[#ffb4ab]/30 ring-1 ring-[#ffb4ab]/20'
                  : 'border-white/5 opacity-75'
              }`}
            >
              {/* Top Meta Info */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative w-7 h-7 rounded-lg overflow-hidden bg-[#0a0f15] flex items-center justify-center border border-white/10">
                    <img
                      src={SHIELD_LOGO_URL}
                      alt="VoiceGuard Shield Icon"
                      className="w-5 h-5 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    {isHighPriorityTriggered && (
                      <span className="absolute top-0 right-0 w-2 h-2 bg-[#ffb4ab] rounded-full" />
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-label-md text-[12px] text-[#dee3eb] font-semibold">
                      VoiceGuard Alert
                    </span>
                    <span className="text-[#bbcbbb] text-body-sm font-light">•</span>
                    <span className="font-label-sm text-[10px] text-[#bbcbbb] font-mono">now</span>
                    <span
                      className={`font-label-sm text-[9px] px-1.5 py-0.2 rounded font-mono font-bold ml-1 ${
                        isHighPriorityTriggered
                          ? 'bg-[#93000a] text-[#ffdad6]'
                          : 'bg-[#252a31] text-[#bbcbbb]'
                      }`}
                    >
                      {isHighPriorityTriggered ? 'PRIORITY: HIGH' : 'LOW PRIORITY'}
                    </span>
                  </div>
                </div>
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    isHighPriorityTriggered ? 'text-[#ffb4ab]' : 'text-[#869486]'
                  }`}
                >
                  {isHighPriorityTriggered ? 'notification_important' : 'notifications'}
                </span>
              </div>

              {/* Title & Body */}
              <div className="mt-2">
                <h4 className="font-headline-sm text-[14px] text-[#dee3eb] font-semibold tracking-tight">
                  {isHighPriorityTriggered
                    ? `Suspicious Neural Voice Detected (${simulatedConfidence}%)`
                    : `Low-Confidence Audio Detected (${simulatedConfidence}%)`}
                </h4>
                <p className="mt-0.5 font-body-sm text-[12px] text-[#bbcbbb] leading-relaxed">
                  {isHighPriorityTriggered
                    ? `Confidence of ${simulatedConfidence}% surpasses your ≥${threshold}% high-priority threshold. Potential deepfake spoof attempt on live line.`
                    : `Confidence of ${simulatedConfidence}% is below your high-priority alert threshold (≥${threshold}%). Push alert silenced.`}
                </p>
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-1">
                <button
                  onClick={onViewLatestIncident}
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg bg-[#252a31] hover:bg-[#353a40] text-[#7dd0ff] font-label-md text-[11px] font-semibold transition-colors cursor-pointer border border-white/5"
                >
                  <span className="material-symbols-outlined text-[16px]">query_stats</span>
                  <span>Review Telemetry</span>
                </button>

                <button
                  onClick={() => setStreamMuted(!streamMuted)}
                  className={`flex items-center justify-center gap-1 py-2 px-2 rounded-lg font-label-md text-[11px] font-semibold transition-colors cursor-pointer ${
                    streamMuted
                      ? 'bg-[#252a31] text-[#dee3eb]'
                      : isHighPriorityTriggered
                      ? 'bg-[#93000a] hover:bg-[#93000a]/80 text-[#ffdad6]'
                      : 'bg-[#30353c] text-[#bbcbbb]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {streamMuted ? 'volume_up' : 'mic_off'}
                  </span>
                  <span>{streamMuted ? 'Stream Muted' : 'Mute Stream'}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Diagnostic Network Status Pill */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a0f15] text-[#bbcbbb] border border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#54e98a] animate-pulse" />
              <span className="font-label-sm text-[11px] font-medium">
                Acoustic Shield Neural Link: Synced (4.2ms)
              </span>
            </div>
            <span className="font-label-sm text-[10px] text-[#54e98a] font-bold font-mono">
              v3.8-Live
            </span>
          </div>
        </div>

        {/* Right Column: Real-Time Protection Preferences */}
        <div className="flex flex-col space-y-4">
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between pt-1">
              <div className="flex flex-col">
                <h3 className="font-headline-sm text-[15px] text-[#dee3eb] font-semibold">
                  Real-Time Protection Settings
                </h3>
                <p className="font-body-sm text-[12px] text-[#bbcbbb]">
                  Acoustic forensic engine trigger conditions
                </p>
              </div>
              <span className="material-symbols-outlined text-[#54e98a] text-[22px]">shield_lock</span>
            </div>

            {/* Toggle List Container */}
            <div className="flex flex-col gap-2">
              {/* Toggle 1: Live Call Acoustic Monitoring */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#171c22] transition-colors border border-white/5">
                <div className="flex items-start gap-2.5 max-w-[260px]">
                  <div className="p-2 rounded-lg bg-[#1b2026] text-[#54e98a] mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">phone_in_talk</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-[13px] text-[#dee3eb] font-medium">
                      Live Call Acoustic Monitoring
                    </span>
                    <span className="font-body-sm text-[11px] text-[#bbcbbb] leading-snug">
                      Real-time background deepfake voice detection during VoIP/phone calls
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle('liveMonitoring')}
                  aria-checked={settings.liveMonitoring}
                  className={`toggle-btn relative w-12 h-6 rounded-full p-0.5 transition-all focus:outline-none cursor-pointer ${
                    settings.liveMonitoring
                      ? 'bg-[#2ecc71] shadow-[0_0_12px_rgba(84,233,138,0.35)]'
                      : 'bg-[#30353c]'
                  }`}
                  role="switch"
                >
                  <span
                    className={`toggle-dot block w-5 h-5 rounded-full shadow transform transition-transform ${
                      settings.liveMonitoring
                        ? 'translate-x-6 bg-[#005027]'
                        : 'translate-x-0 bg-[#bbcbbb]'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Instant Cloned Audio Alerts */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#171c22] transition-colors border border-white/5">
                <div className="flex items-start gap-2.5 max-w-[260px]">
                  <div className="p-2 rounded-lg bg-[#1b2026] text-[#ffc37d] mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">e911_emergency</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-[13px] text-[#dee3eb] font-medium">
                      Instant Cloned Audio Alerts
                    </span>
                    <span className="font-body-sm text-[11px] text-[#bbcbbb] leading-snug">
                      Trigger slide-down banner and high-priority push warning immediately
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle('instantAlerts')}
                  aria-checked={settings.instantAlerts}
                  className={`toggle-btn relative w-12 h-6 rounded-full p-0.5 transition-all focus:outline-none cursor-pointer ${
                    settings.instantAlerts
                      ? 'bg-[#2ecc71] shadow-[0_0_12px_rgba(84,233,138,0.35)]'
                      : 'bg-[#30353c]'
                  }`}
                  role="switch"
                >
                  <span
                    className={`toggle-dot block w-5 h-5 rounded-full shadow transform transition-transform ${
                      settings.instantAlerts
                        ? 'translate-x-6 bg-[#005027]'
                        : 'translate-x-0 bg-[#bbcbbb]'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3: Upload & File Analysis Completion */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#171c22] transition-colors border border-white/5">
                <div className="flex items-start gap-2.5 max-w-[260px]">
                  <div className="p-2 rounded-lg bg-[#1b2026] text-[#7dd0ff] mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">cloud_done</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-[13px] text-[#dee3eb] font-medium">
                      Upload &amp; File Analysis
                    </span>
                    <span className="font-body-sm text-[11px] text-[#bbcbbb] leading-snug">
                      Notify when deep forensic scans finish processing multi-channel files
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle('uploadScanNotify')}
                  aria-checked={settings.uploadScanNotify}
                  className={`toggle-btn relative w-12 h-6 rounded-full p-0.5 transition-all focus:outline-none cursor-pointer ${
                    settings.uploadScanNotify
                      ? 'bg-[#2ecc71] shadow-[0_0_12px_rgba(84,233,138,0.35)]'
                      : 'bg-[#30353c]'
                  }`}
                  role="switch"
                >
                  <span
                    className={`toggle-dot block w-5 h-5 rounded-full shadow transform transition-transform ${
                      settings.uploadScanNotify
                        ? 'translate-x-6 bg-[#005027]'
                        : 'translate-x-0 bg-[#bbcbbb]'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 4: Weekly Threat Intelligence Summary */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#171c22] transition-colors border border-white/5">
                <div className="flex items-start gap-2.5 max-w-[260px]">
                  <div className="p-2 rounded-lg bg-[#1b2026] text-[#bbcbbb] mt-0.5">
                    <span className="material-symbols-outlined text-[20px]">insights</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-[13px] text-[#dee3eb] font-medium">
                      Weekly Threat Summary
                    </span>
                    <span className="font-body-sm text-[11px] text-[#bbcbbb] leading-snug">
                      Digest of scanned clips, anomalies detected, and known model signatures
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleToggle('weeklyThreatSummary')}
                  aria-checked={settings.weeklyThreatSummary}
                  className={`toggle-btn relative w-12 h-6 rounded-full p-0.5 transition-all focus:outline-none cursor-pointer ${
                    settings.weeklyThreatSummary
                      ? 'bg-[#2ecc71] shadow-[0_0_12px_rgba(84,233,138,0.35)]'
                      : 'bg-[#30353c]'
                  }`}
                  role="switch"
                >
                  <span
                    className={`toggle-dot block w-5 h-5 rounded-full shadow transform transition-transform ${
                      settings.weeklyThreatSummary
                        ? 'translate-x-6 bg-[#005027]'
                        : 'translate-x-0 bg-[#bbcbbb]'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* CUSTOM THRESHOLD SETTING CARD: High-Priority Alert Confidence Threshold */}
            <div
              className="flex flex-col gap-3 p-4 rounded-xl bg-[#252a31] border border-[#ffc37d]/20 shadow-md"
              id="highPriorityThresholdCard"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0a0f15] text-[#ffc37d] flex items-center justify-center border border-white/10">
                    <span className="material-symbols-outlined text-[20px]">
                      notification_important
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-headline-sm text-[14px] text-[#dee3eb] font-bold">
                        High-Priority Alert Threshold
                      </span>
                      <span className="font-label-sm text-[9px] bg-[#005027] text-[#54e98a] px-1.5 py-0.2 rounded font-mono font-bold">
                        CUSTOM
                      </span>
                    </div>
                    <span className="font-body-sm text-[11px] text-[#bbcbbb]">
                      Confidence percentage required to trigger urgent notifications
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <span
                  className={`font-label-sm text-[10px] px-2.5 py-1 rounded-full font-bold font-mono shrink-0 ${currentTier.badgeColor}`}
                >
                  {currentTier.label}
                </span>
              </div>

              {/* Explanatory description */}
              <p className="font-body-sm text-[11px] text-[#bbcbbb] leading-relaxed bg-[#0a0f15]/60 p-2.5 rounded-lg border border-white/5">
                {currentTier.desc} Any synthetic speech detected at or above{' '}
                <span className="font-bold text-[#ffc37d] font-mono">{threshold}%</span> will
                immediately trigger the high-priority in-app alert banner and mobile push warnings.
              </p>

              {/* Stepper + Number Input + Interactive Range Slider */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-label-md text-[12px] text-[#dee3eb] font-semibold font-mono">
                    Trigger Percentage:
                  </span>

                  {/* Direct Numeric Input with Steppers */}
                  <div className="flex items-center gap-1 bg-[#0a0f15] p-1 rounded-lg border border-white/10">
                    <button
                      type="button"
                      onClick={() => handleThresholdChange(threshold - 1)}
                      disabled={threshold <= 50}
                      className="w-7 h-7 rounded flex items-center justify-center bg-[#1b2026] hover:bg-[#252a31] text-[#dee3eb] disabled:opacity-40 cursor-pointer transition-colors"
                      title="Decrease threshold by 1%"
                    >
                      <span className="material-symbols-outlined text-[16px]">remove</span>
                    </button>

                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min="50"
                        max="99"
                        value={threshold}
                        onChange={(e) => handleThresholdChange(Number(e.target.value))}
                        className="w-12 bg-transparent text-center font-mono font-bold text-[14px] text-[#54e98a] focus:outline-none"
                      />
                      <span className="font-mono font-bold text-[13px] text-[#54e98a] pr-1.5">
                        %
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleThresholdChange(threshold + 1)}
                      disabled={threshold >= 99}
                      className="w-7 h-7 rounded flex items-center justify-center bg-[#1b2026] hover:bg-[#252a31] text-[#dee3eb] disabled:opacity-40 cursor-pointer transition-colors"
                      title="Increase threshold by 1%"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                    </button>
                  </div>
                </div>

                {/* Range Slider */}
                <input
                  id="highPriorityThresholdRange"
                  type="range"
                  min="50"
                  max="99"
                  value={threshold}
                  onChange={(e) => handleThresholdChange(Number(e.target.value))}
                  className="w-full h-2 bg-[#0a0f15] rounded-lg appearance-none cursor-pointer accent-[#ffc37d]"
                />

                <div className="flex justify-between font-label-sm text-[10px] text-[#869486] px-0.5 font-mono">
                  <span>50% (Permissive)</span>
                  <span>75% (Moderate)</span>
                  <span>90% (Strict)</span>
                  <span>99% (Maximum)</span>
                </div>
              </div>

              {/* Quick Preset Chips */}
              <div className="flex flex-col gap-1.5 pt-1 border-t border-white/5">
                <span className="font-label-sm text-[10px] uppercase font-bold text-[#869486] font-mono tracking-wider">
                  Recommended Presets:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {[
                    { label: '75% Moderate', val: 75 },
                    { label: '85% Balanced', val: 85 },
                    { label: '90% Strict', val: 90 },
                    { label: '95% Critical', val: 95 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      type="button"
                      onClick={() => handleThresholdChange(preset.val)}
                      className={`px-2 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition-all cursor-pointer border ${
                        threshold === preset.val
                          ? 'bg-[#ffc37d] text-[#462a00] border-[#ffc37d] shadow-sm'
                          : 'bg-[#0a0f15] text-[#bbcbbb] hover:text-[#dee3eb] hover:bg-[#1b2026] border-white/5'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sensitivity Slider Card */}
            <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-[#252a31] border border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px] text-[#ffc37d]">tune</span>
                  <span className="font-headline-sm text-[14px] text-[#dee3eb] font-medium">
                    Detection Sensitivity
                  </span>
                </div>
                <span
                  className="font-label-sm text-[10px] px-2 py-0.5 rounded-full bg-[#f8a018] text-[#633c00] font-bold font-mono"
                  id="sensitivityBadge"
                >
                  {getSensitivityLabel(settings.sensitivity)}
                </span>
              </div>

              <p className="font-body-sm text-[12px] text-[#bbcbbb]" id="sensitivityDesc">
                Flags &gt;{settings.sensitivity}% synthetic probability. Recommends instant spectral breakdown.
              </p>

              {/* Custom Interactive Range Slider */}
              <div className="flex flex-col gap-1 pt-1">
                <input
                  id="sensitivityRange"
                  type="range"
                  min="50"
                  max="99"
                  value={settings.sensitivity}
                  onChange={(e) => handleSensitivityChange(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#0a0f15] rounded-lg appearance-none cursor-pointer accent-[#54e98a]"
                />
                <div className="flex justify-between font-label-sm text-[10px] text-[#bbcbbb] pt-1 px-0.5 font-mono">
                  <span>50% (Strict)</span>
                  <span>75% (Balanced)</span>
                  <span>95% (High Precision)</span>
                </div>
              </div>
            </div>

            {/* Cloud Persistence Indicator */}
            {user ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#0a0f15] border border-[#54e98a]/20 text-[#dee3eb]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#54e98a] animate-pulse" />
                  <div className="flex flex-col">
                    <span className="font-label-sm text-[11px] font-semibold text-[#dee3eb]">
                      Cloud Protection Sync Active
                    </span>
                    <span className="font-body-sm text-[10px] text-[#869486] font-mono truncate max-w-[200px]">
                      {user.email}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-[#252a31] hover:bg-[#353a40] text-[#54e98a] font-label-sm text-[10px] font-bold font-mono transition-colors cursor-pointer border border-white/5"
                >
                  Manage Account
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#171c22] border border-white/5 text-[#bbcbbb]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#7dd0ff] text-[18px]">
                    sync_disabled
                  </span>
                  <span className="font-body-sm text-[11px]">
                    Settings saved locally in session
                  </span>
                </div>
                <button
                  onClick={() => signIn()}
                  disabled={loading}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#f1f3f4] text-[#1f1f1f] font-label-sm text-[10px] font-bold transition-all cursor-pointer"
                >
                  Sync to Cloud
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
