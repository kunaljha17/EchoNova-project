import React from 'react';

export const BottomNav = ({
  currentScreen,
  onNavigate,
  hasUnreadAlert = true,
}) => {
  const isHome = currentScreen === 'home';
  const isTranscribe = currentScreen === 'transcribe';
  const isScan =
    currentScreen === 'scan_record' ||
    currentScreen === 'analyze_upload' ||
    currentScreen === 'scanning_stream';
  const isSamples = currentScreen === 'samples';
  const isAlerts = currentScreen === 'alerts' || currentScreen === 'incident_report';

  return (
    <nav className="md:hidden fixed bottom-0 w-full z-50 pb-safe bg-[#0a0f15]/90 backdrop-blur-2xl border-t border-[#1b2026] shadow-[0_-8px_24px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around h-16 px-2 max-w-[430px] mx-auto">
        {/* Home */}
        <button
          onClick={() => onNavigate('home')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] relative py-1 transition-colors cursor-pointer ${
            isHome ? 'text-[#54e98a]' : 'text-[#bbcbbb] hover:text-[#dee3eb]'
          }`}
          aria-label="Navigate to Home"
        >
          <span className="material-symbols-outlined text-[22px]">home</span>
          <span className="font-label-sm text-[10px] mt-0.5">Home</span>
          <span
            className={`w-1 h-1 bg-[#54e98a] rounded-full mt-0.5 transition-opacity ${
              isHome ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {isHome && (
            <span className="absolute inset-0 bg-[#54e98a]/5 rounded-xl filter blur-sm pointer-events-none" />
          )}
        </button>

        {/* Transcribe */}
        <button
          onClick={() => onNavigate('transcribe')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] relative py-1 transition-colors cursor-pointer ${
            isTranscribe ? 'text-[#54e98a]' : 'text-[#bbcbbb] hover:text-[#dee3eb]'
          }`}
          aria-label="Navigate to Transcribe"
        >
          <span className="material-symbols-outlined text-[22px]">speech_to_text</span>
          <span className="font-label-sm text-[10px] mt-0.5">Transcribe</span>
          <span
            className={`w-1 h-1 bg-[#54e98a] rounded-full mt-0.5 transition-opacity ${
              isTranscribe ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {isTranscribe && (
            <span className="absolute inset-0 bg-[#54e98a]/5 rounded-xl filter blur-sm pointer-events-none" />
          )}
        </button>

        {/* Scan */}
        <button
          onClick={() => onNavigate('scan_record')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] relative py-1 transition-colors cursor-pointer ${
            isScan ? 'text-[#54e98a]' : 'text-[#bbcbbb] hover:text-[#dee3eb]'
          }`}
          aria-label="Navigate to Scan"
        >
          <span className="material-symbols-outlined text-[22px]">mic</span>
          <span className="font-label-sm text-[10px] mt-0.5">Scan</span>
          <span
            className={`w-1 h-1 bg-[#54e98a] rounded-full mt-0.5 transition-opacity ${
              isScan ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {isScan && (
            <span className="absolute inset-0 bg-[#54e98a]/5 rounded-xl filter blur-sm pointer-events-none" />
          )}
        </button>

        {/* Samples */}
        <button
          onClick={() => onNavigate('samples')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] relative py-1 transition-colors cursor-pointer ${
            isSamples ? 'text-[#54e98a]' : 'text-[#bbcbbb] hover:text-[#dee3eb]'
          }`}
          aria-label="Navigate to Samples"
        >
          <span className="material-symbols-outlined text-[22px]">grid_view</span>
          <span className="font-label-sm text-[10px] mt-0.5">Samples</span>
          <span
            className={`w-1 h-1 bg-[#54e98a] rounded-full mt-0.5 transition-opacity ${
              isSamples ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {isSamples && (
            <span className="absolute inset-0 bg-[#54e98a]/5 rounded-xl filter blur-sm pointer-events-none" />
          )}
        </button>

        {/* Alerts */}
        <button
          onClick={() => onNavigate('alerts')}
          className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] relative py-1 transition-colors cursor-pointer ${
            isAlerts ? 'text-[#54e98a]' : 'text-[#bbcbbb] hover:text-[#dee3eb]'
          }`}
          aria-label="Navigate to Alerts"
        >
          <div className="relative flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            {hasUnreadAlert && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#ffb4ab] rounded-full ring-2 ring-[#0a0f15]" />
            )}
          </div>
          <span className="font-label-sm text-[10px] mt-0.5">Alerts</span>
          <span
            className={`w-1 h-1 bg-[#54e98a] rounded-full mt-0.5 transition-opacity ${
              isAlerts ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {isAlerts && (
            <span className="absolute inset-0 bg-[#54e98a]/5 rounded-xl filter blur-sm pointer-events-none" />
          )}
        </button>
      </div>
    </nav>
  );
};
