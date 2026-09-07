# VoiceGuard AI — Autonomous Voice Cloning & Deepfake Audio Defense System

VoiceGuard AI is an enterprise-grade, real-time acoustic forensic defense platform designed to intercept, analyze, and neutralize synthetic voice cloning and generative deepfake audio threats. By combining high-frequency digital signal processing (DSP), neural acoustic feature modeling, an isolated pluggable machine learning inference layer, and server-side transcription intelligence, VoiceGuard protects communications lines against executive voice impersonation, automated vishing scams, and unauthorized biometric voice forgery.

---

## Table of Contents
1. [Executive Summary & Threat Landscape](#1-executive-summary--threat-landscape)
2. [Current Architecture & System Flow](#2-current-architecture--system-flow)
3. [Core Capabilities & Feature Inventory](#3-core-capabilities--feature-inventory)
4. [How VoiceGuard Prevents Impersonation & Voice Clone Attacks](#4-how-voiceguard-prevents-impersonation--voice-clone-attacks)
5. [Competitive Analysis: VoiceGuard vs. Existing Products](#5-competitive-analysis-voiceguard-vs-existing-products)
6. [Pluggable ML Model Service Layer](#6-pluggable-ml-model-service-layer)
7. [Backend API Reference](#7-backend-api-reference)
8. [Frontend & User Experience Architecture](#8-frontend--user-experience-architecture)
9. [Cloud Persistence & Security Infrastructure](#9-cloud-persistence--security-infrastructure)
10. [Getting Started & Local Development](#10-getting-started--local-development)
11. [Future Roadmap: What to Build Next](#11-future-roadmap-what-to-build-next)

---

## 1. Executive Summary & Threat Landscape

### The Deepfake Challenge
With the rapid emergence of high-fidelity neural vocoders (Diffusion-based speech, HiFi-GAN, WaveGlow, VITS) and zero-shot voice cloning architectures, attackers can clone an executive or family member's voice using fewer than 3 seconds of reference audio. Traditional audio authentication mechanisms fail because synthetic speech accurately mimics timber, fundamental frequency ($F_0$), and accent.

### The VoiceGuard Solution
VoiceGuard AI intercepts audio at two critical ingress points:
1. **Pre-recorded media / voice note files** (forensic asynchronous scanning)
2. **Active voice streams / live phone calls** (synchronous chunked telemetry)

The system extracts non-linear phase anomalies, unnatural steady-state energy variance, and vocoder transition artifacts to deliver a deterministic verdict (`real` vs. `cloned`) along with confidence metrics and actionable countermeasures.

```
       ┌────────────────────────────────────────────────────────┐
       │                   AUDIO INGRESS SOURCE                 │
       │    • Live Microphone Stream  • Uploaded Audio File     │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │             VOICEGUARD APPLICATION SERVER              │
       │  Express / Node.js API Gateway (Port 3000)             │
       │  • Payload validation (50MB cap, corrupt stream check) │
       │  • Temp buffer lifecycle management & auto-cleanup     │
       └───────────────────────────┬────────────────────────────┘
                                   │
                    Calls predict(audio_file_path)
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │         ISOLATED PLUGGABLE MODEL SERVICE LAYER         │
       │            (model_service.py / inference.ts)           │
       │  ┌──────────────────────────────────────────────────┐  │
       │  │ Audio Preprocessing & Normalization Engine        │  │
       │  │ • 16-bit PCM decoding & peak amplitude scaling   │  │
       │  │ • Zero-Crossing Rate (ZCR) computation           │  │
       │  │ • Frame energy variance & RMS distribution       │  │
       │  │ • Spectral centroid & high-frequency harmonics   │  │
       │  └──────────────────────────┬───────────────────────┘  │
       │                             ▼                          │
       │  ┌──────────────────────────────────────────────────┐  │
       │  │ Loaded Model Artifact (/models/voiceguard_v1.onnx│  │
       │  │ • Loaded ONCE at startup into persistent memory  │  │
       │  │ • Swappable without changing API routes/frontend │  │
       │  └──────────────────────────────────────────────────┘  │
       └───────────────────────────┬────────────────────────────┘
                                   │
        Returns: { label, confidence, processing_time_ms, model_version }
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │         REAL-TIME ALERTING & CLOUD TELEMETRY           │
       │  • High-Priority Alert Banner (Customizable Threshold) │
       │  • Push Notification Dispatch (Triggered vs Silenced)  │
       │  • Firestore Telemetry Sync (ai-studio-voiceguardai)   │
       │  • Live Call Mitigation (Instant Mute / Drop Line)     │
       └────────────────────────────────────────────────────────┘
```

---

## 2. Current Architecture & System Flow

VoiceGuard adopts a **decoupled, security-first full-stack architecture**:

- **Frontend Client**: React 19 single-page application built on Vite and Tailwind CSS v4, providing sub-millisecond UI updates, motion animations, and audio visualization.
- **API Server Gateway**: Express.js server bound to host `0.0.0.0:3000`, handling file ingestion, stream conversion, CORS, and routing.
- **Inference Service**: Pluggable standalone engine separating machine learning dependencies (`torch`, `onnxruntime`, numpy) from business routes.
- **Generative AI Transcription Service**: Server-side proxy integrating Google's `gemini-3.5-transcribe` model for forensic verbal record extraction.
- **Database & Identity**: Google Firebase Firestore and Firebase Authentication with document-level security rules.

---

## 3. Core Capabilities & Feature Inventory

### A. Live Call Intercept & Real-Time Monitoring
- **Live Decibel & Frequency Meter**: Monitors dynamic microphone input or incoming call streams with color-coded signal strength.
- **Chunked Stream Analysis**: Real-time periodic chunk dispatch to `/live-analyze` for instantaneous clone scoring.
- **Active Call Countermeasures**: 
  - One-tap **Mute Incoming Audio Stream**
  - Instant **Emergency Call Termination**
  - Real-time **Threat Level Indicator** (Normal, Suspicious, Confirmed Deepfake).

### B. Forensic File Scanner
- **Drag-and-Drop Ingestion**: Supports `.wav`, `.mp3`, `.webm`, and `.ogg` files up to 50MB.
- **Dual Pipeline Modes**:
  - *Quick Scan*: Fast acoustic heuristic classification (<25ms latency).
  - *Deep Forensic*: Multi-pass spectral analysis inspecting phase coherence, vocoder jitter, and temporal envelope flatness.
- **Visual Waveform & Spectrogram**: Interactive audio timeline playback with frequency distribution visualization.

### C. Gemini 3.5 Speech-to-Text Transcription Engine
- **Verbatim Voice Transcription**: Direct server-side streaming integration with `gemini-3.5-transcribe`.
- **Microphone Recorder with Waveform Visualizer**: Record spoken notes or suspicious audio directly within the app.
- **Preset Audio Bank**: Built-in test samples (CEO wire transfer memo, bank security check, normal customer service conversation).
- **Export Capabilities**: One-click clipboard copy and raw transcript download.

### D. Intelligent Alerting & Dynamic Threshold Gate
- **High-Priority Alert Confidence Threshold**: Custom slider and numeric stepper enabling users to set their trigger baseline between **50% and 99%**.
- **Contextual Tiers**:
  - `75% Moderate`: Permissive early-warning baseline.
  - `85% Balanced`: Recommended industry standard.
  - `90% Strict`: Minimizes false-positives for high-volume lines.
  - `95% Critical`: Triggers solely on definitive, unmistakable synthetic clones.
- **Interactive Threshold Simulator**: Live test bench demonstrating how varying confidence values trigger or suppress high-priority alarms.
- **Simulated OS Push Notifications**: Preview of system lock-screen and banner alerts.

### E. Telemetry, History & Cloud Sync
- **Recent Incident Log**: Track ID, filename, classification verdict (`real` vs `cloned`), confidence score, and timestamp.
- **Multi-Device Cloud Sync**: User settings and thresholds synchronize to Firestore when signed in via Google Auth.

---

## 4. How VoiceGuard Prevents Impersonation & Voice Clone Attacks

### The Anatomy of an Impersonation Attack
Modern voice clone attacks are no longer simple robotic synthesizer scripts. Threat actors execute sophisticated 4-stage attack chains:

```
[Target Audio Harvesting] ──► [Zero-Shot Neural Synthesis] ──► [Caller-ID Spoofing & Delivery] ──► [Social Engineering Execution]
  • YouTube/Earnings Calls     • Latent diffusion / vocoder      • Virtual SIP trunk spoofing         • CEO wire transfer demand
  • Social media clips         • 3-second reference clone        • Live VoIP injection                • IT password reset bypass
```

1. **Acoustic Harvesting**: Attackers obtain 3 to 15 seconds of clean vocal audio of an executive, finance manager, or family member from public podcasts, earnings calls, or voicemail.
2. **Latent Neural Synthesis**: Using models like ElevenLabs, XTTS v2, VITS, or custom HiFi-GAN pipelines, attackers generate arbitrary speech with the target's pitch, timbre, accent, and inflection.
3. **Telephony Ingress**: The synthesized stream is piped into a virtual VoIP PBX with caller ID spoofing to display the victim company's internal extension.
4. **The Fraud Exploit**: The attacker demands an immediate financial wire, unauthorized credential reset, or emergency payment, relying on the recipient recognizing the familiar voice.

---

### Why Legacy Defenses Completely Fail

| Traditional Defense Mechanism | How Attackers Bypass It | VoiceGuard's Countermeasure |
|---|---|---|
| **Voice Biometrics** *(e.g. Nuance Gatekeeper)* | Compares vocal timbre ("Does this voice sound like John?"). Because modern deepfakes sound identical to John, **legacy biometrics authenticate the clone**. | Ignores superficial pitch matching. Analyzes underlying digital signal physical invariants that generative vocoders cannot replicate. |
| **Carrier STIR/SHAKEN** | Verifies carrier-level phone number signing. Attackers use legitimate domestic SIP trunks or compromised internal softphones. | Analyzes the payload audio waveform directly at the receiver endpoint, regardless of carrier attestations. |
| **Post-Call Audio Auditing** | Scans call recordings hours or days after the incident has already occurred. | Executes sub-25ms synchronous chunked analysis in real-time, alarming within seconds. |
| **Human Intuition** | Cognitive bias causes humans to trust familiar vocal cadence and emotional distress cues. | Provides an objective, mathematical confidence percentage ($0.0 - 1.0$) with color-coded threat meters. |

---

### VoiceGuard's Multi-Layered Defense Shield

VoiceGuard stops impersonation attacks through five continuous defense layers:

#### Layer 1: Vocoder Physical Invariant Detection
Human vocal production is constrained by biomechanics: lungs compress air through the vocal folds ($F_0$), which resonate across the pharyngeal and oral cavities. Neural vocoders, in contrast, approximate audio through mathematical upsampling layers (transposed convolutions or diffusion denoising steps). VoiceGuard detects physical vocoder signatures:
- **Frame Energy Variance Flattener**: Neural speech exhibits robotic steady-state energy distribution lacking natural human respiratory micro-pauses.
- **Phase Inversion & High-Frequency Discontinuities**: Artificial neural vocoders introduce phase misalignment across upper harmonics ($>3.5\text{ kHz}$).
- **Unvoiced Phoneme Statistics**: Consonants (/s/, /t/, /f/) in AI clones exhibit unnatural regularities in Zero-Crossing Rates (ZCR) compared to natural aerodynamic turbulence.

#### Layer 2: Sub-25ms Real-Time In-Call Intercept
Instead of waiting for a call to terminate, VoiceGuard continuously buffers 500ms–1000ms audio slices via `POST /live-analyze`. The lightweight inference engine executes in **under 25 milliseconds**, evaluating incoming voice streams continuously during live dialogue.

#### Layer 3: Dynamic Threshold Gating & Zero-Bypass Active Countermeasures
Users establish an enforceable alert baseline (e.g. $\ge 90\%$ confidence):
- **Visual & Audio Alerting**: Instantly displays a high-visibility pulsing warning banner on screen with push notifications.
- **One-Tap Instant Stream Mute**: Instantly severs the incoming audio feed to the operator's headset, preventing deceptive social engineering manipulation.
- **Emergency Call Termination**: One-tap disconnect triggers an immediate PBX/WebRTC line drop, neutralizing the attack before money or data is transferred.

#### Layer 4: Contextual Semantic Correlation (Gemini 3.5 Transcribe)
VoiceGuard incorporates Google's `gemini-3.5-transcribe` engine to convert the incoming audio to verbatim text simultaneously. When high synthetic probability coincides with high-risk financial triggers (*"wire transfer"*, *"routing number"*, *"emergency authorization"*, *"bypass protocol"*), VoiceGuard escalates the risk severity to Critical.

#### Layer 5: Cryptographic Incident Forensic Auditing
Every flagged event is stored in Firestore with:
- SHA-256 audio buffer digest
- Exact synthetic confidence score and model version
- Millisecond-accurate timestamp and caller identifier
This produces an immutable audit trail admissible for legal, cyber-insurance, and law enforcement investigations.

---

## 5. Competitive Analysis: VoiceGuard vs. Existing Products

VoiceGuard was built specifically to address the architectural gaps and proprietary lock-in found in legacy voice security software.

### Feature-by-Feature Comparison Matrix

| Feature / Capability | VoiceGuard AI | Pindrop (Pulse / Protect) | Resemble AI (Detect) | ElevenLabs Classifier | Nuance / MSFT Gatekeeper |
|---|:---:|:---:|:---:|:---:|:---:|
| **Primary Detection Method** | Neural Vocoder DSP Artifacts + CNN/Transformer | Phone & Network Metadata + Acoustic Heuristics | Deep Learning Classifier + Watermark Check | Platform-specific Classifier | Biometric Voiceprint Matching |
| **Real-Time Live Call Intercept** | ✅ **Yes** (Sub-25ms chunked API) | ✅ Yes (Call center PBX integration) | ❌ No (Primarily async batch) | ❌ No (Single file upload only) | ⚠️ Biometric match only (at call start) |
| **Active In-Call Countermeasures** | ✅ **Yes** (Instant Stream Mute & Call Drop) | ⚠️ Call-center agent flag only | ❌ Passive reporting | ❌ Passive report | ❌ Auth pass/fail only |
| **Pluggable ML Architecture** | ✅ **Yes** (Hot-swap `.onnx` via config with zero code touch) | ❌ Closed proprietary black-box | ❌ Closed SaaS API | ❌ Proprietary model locked | ❌ Closed proprietary stack |
| **User-Configurable Threshold Gate** | ✅ **Yes** (Interactive 50%–99% Slider & Presets) | ❌ Fixed vendor thresholds | ❌ Fixed sensitivity | ❌ Fixed percentage | ❌ Complex admin scoring |
| **Integrated Verbatim Transcription** | ✅ **Yes** (Google Gemini 3.5 Transcribe built-in) | ⚠️ Requires add-on license | ❌ Not included | ❌ Not included | ❌ Not included |
| **Cross-Vocoder Generalization** | ✅ **Yes** (Generic vocoder DSP invariants) | ⚠️ Moderate | ⚠️ Moderate | ❌ Heavily biased to ElevenLabs | ❌ Vulnerable to clones |
| **Self-Hostable / Cloud Run Ready** | ✅ **Yes** (Docker / Cloud Run / Node / Python) | ❌ On-premise appliance or vendor SaaS | ❌ Cloud SaaS API only | ❌ Web SaaS only | ❌ Enterprise on-premise suite |
| **Developer Extensibility** | ✅ **Open REST API** (`/analyze`, `/live-analyze`) | ❌ Custom enterprise contract | ⚠️ REST API | ⚠️ REST API | ❌ Proprietary SDK |

---

### Detailed Market Differentiators

#### 1. VoiceGuard vs. Pindrop
- **Where Pindrop Shines**: Established footprint in Tier-1 banking call centers, analyzing telephony audio codecs and cell tower metadata.
- **Why VoiceGuard is Superior**: Pindrop requires multi-million dollar annual contracts, proprietary hardware appliances, and months of onboarding. VoiceGuard provides modern, containerized REST endpoints (`/analyze`, `/live-analyze`), is fully deployable in minutes on Cloud Run, and allows data science teams to plug in their own proprietary ONNX weights.

#### 2. VoiceGuard vs. Resemble AI (Detect)
- **Where Resemble Shines**: Excellent watermarking capabilities for synthesized audio generated inside their own suite.
- **Why VoiceGuard is Superior**: Watermarking is useless against real-world cybercriminals who never watermark their malicious audio. VoiceGuard focuses on **zero-knowledge passive forensic detection** of unwatermarked audio streams and provides real-time in-call stream interception with active mute and disconnect controls.

#### 3. VoiceGuard vs. ElevenLabs Speech Classifier
- **Where ElevenLabs Shines**: Accurate at identifying audio generated by their own ElevenLabs web models.
- **Why VoiceGuard is Superior**: Attackers routinely use open-source vocoders (XTTS, VITS, Bark, Tortoise) that ElevenLabs' classifier frequently fails to detect. ElevenLabs provides no streaming API, no telephony integration, and no live call defense interface.

#### 4. VoiceGuard vs. Legacy Biometrics (Nuance Gatekeeper)
- **The Fatal Flaw of Legacy Biometrics**: Systems like Nuance verify identity by checking if voice traits match an enrolled voice profile. When an attacker creates a clone of John Doe, **Nuance verifies the attacker as John Doe** because the voiceprint matches. VoiceGuard inspects the synthetic physics of the sound wave itself, stopping the clone regardless of how closely it mimics the victim's timbre.

---

## 6. Pluggable ML Model Service Layer

### The Pluggability Principle
The machine learning model is completely decoupled from web application code. Machine learning researchers and data scientists can update or swap the detection model without modifying API controllers, React components, or deployment scripts.

### Module Structure
```
├── models/
│   └── voiceguard_v1.onnx      # Model artifact separate from source code
├── config.py                   # Python model path & version configuration
├── config.ts                   # TypeScript configuration bridge
├── model_service.py            # Primary isolated ML module
└── model_service.ts            # Server-side TypeScript interface
```

### The Service Contract
The model service layer exposes exactly one unified inference function:

#### Python (`model_service.py`)
```python
def predict(audio_file_path: str) -> dict:
    """
    Returns:
    {
        "label": "real" | "cloned",
        "confidence": float,       # 0.0 to 1.0
        "processing_time_ms": int,
        "model_version": str
    }
    """
```

#### TypeScript (`model_service.ts`)
```typescript
export async function predict(audio_file_path: string): Promise<{
  label: 'real' | 'cloned';
  confidence: number;
  processing_time_ms: number;
  model_version: string;
}>;
```

### Audio Preprocessing & Feature Extraction
Before model inference, `model_service` executes:
1. **Container & Header Validation**: Verifies audio headers and sample width; rejects empty or truncated streams (<44 bytes) with a descriptive 400 error.
2. **Peak Amplitude Normalization**: Scales audio to dynamic range $[-1.0, 1.0]$.
3. **Zero-Crossing Rate (ZCR)**: Quantifies high-frequency noise and unvoiced phonetic transitions.
4. **Frame Energy Variance**: Measures robotic steady-state flatness characteristic of neural vocoders versus natural human respiratory pauses.
5. **High-Frequency Phase Ratio**: Detects spectral discontinuities and vocoder phase inversion artifacts.

### Model Hot-Swapping Workflow
To deploy a new model version:
1. Save the new model weights into `/models/` (e.g. `/models/voiceguard_v2.onnx`).
2. Update environment variables in `.env`:
   ```bash
   MODEL_PATH=/models/voiceguard_v2.onnx
   MODEL_VERSION=2.0.0
   ```
3. Restart the server. The startup diagnostic verifies:
   ```
   ✅ Loaded model v2.0.0 from /models/voiceguard_v2.onnx
   ```
4. If the model file is missing or corrupted, the service logs a clear warning without crashing and falls back to safe acoustic diagnostic mode.

---

## 7. Backend API Reference

### Base URL: `http://localhost:3000` (or `/api/*` aliases)

| Method | Endpoint | Description | Request Type | Success Response |
|---|---|---|---|---|
| `GET` | `/health` | Server & model status | None | `200 OK` + JSON |
| `GET` | `/history` | Past scan history list | None | `200 OK` + JSON Array |
| `POST` | `/analyze` | Analyze uploaded file | `multipart/form-data` or JSON | `200 OK` + JSON |
| `POST` | `/live-analyze` | Analyze audio chunk | Multipart / Base64 JSON | `200 OK` + JSON |
| `POST` | `/api/transcribe` | Gemini 3.5 speech-to-text | `application/json` | `200 OK` + JSON |

---

### Endpoint Details

#### 1. `GET /health`
Returns the operational health of the server and currently loaded model.
```json
{
  "status": "ok",
  "service": "VoiceGuard AI Backend",
  "model_version": "1.0.0",
  "model_path": "/models/voiceguard_v1.onnx",
  "model_status": "ready",
  "models": {
    "deepfake_detector": "1.0.0",
    "transcribe": "gemini-3.5-transcribe"
  },
  "hasGeminiKey": true
}
```

#### 2. `POST /analyze`
Accepts an audio file via multipart form-data (fields: `file` or `audio`) or Base64 JSON.
```bash
curl -X POST http://localhost:3000/analyze \
  -F "file=@suspicious_call.wav"
```
**Response:**
```json
{
  "label": "cloned",
  "confidence": 0.9842,
  "processing_time_ms": 14,
  "model_version": "1.0.0"
}
```
*Note: Temporary upload files are automatically deleted after processing in a `finally` block.*

#### 3. `POST /live-analyze`
Accepts short audio chunks recorded during active voice calls.
```bash
curl -X POST http://localhost:3000/live-analyze \
  -H "Content-Type: application/json" \
  -d '{"chunk": "<base64_pcm_data>", "filename": "chunk_04.wav"}'
```
**Response:**
```json
{
  "label": "real",
  "confidence": 0.9412,
  "processing_time_ms": 11,
  "model_version": "1.0.0"
}
```

#### 4. `GET /history`
Returns historical incident records.
```json
[
  {
    "id": "rec_67fb828c",
    "filename": "ceo_urgent_transfer_memo.wav",
    "label": "cloned",
    "confidence": 0.984,
    "timestamp": "2026-09-07T17:11:05.439Z"
  }
]
```

#### 5. Error Responses
Corrupt, empty, or unreadable audio files return HTTP `400 Bad Request`:
```json
{
  "error": "Invalid or corrupt audio file: file is empty or unreadable (0 bytes)"
}
```

---

## 8. Frontend & User Experience Architecture

```
src/
├── components/
│   ├── Navigation.tsx      # Application header & screen switcher
│   ├── DashboardScreen.tsx # System status, threat feeds & risk metrics
│   ├── UploadScreen.tsx    # Drag-and-drop file forensic inspector
│   ├── LiveCallScreen.tsx  # Active call stream monitor with kill-switch
│   ├── TranscribeScreen.tsx# Gemini 3.5 transcription & mic recorder
│   └── AlertsScreen.tsx    # Push preview & custom threshold test simulator
├── lib/
│   └── firebase.ts         # Firebase Auth & Firestore client
├── types.ts                # TypeScript domain models
├── App.tsx                 # Root coordinator & screen state management
└── main.tsx                # Entry point
```

### Visual & Usability Standards
- **Color Palette**: Dark security operations theme with `#0a0f15` neutral dark canvas, high-contrast text `#dee3eb`, warning amber `#ffc37d`, and alert crimson `#93000a`.
- **Accessibility**: Meets WCAG AA contrast standards; supports keyboard navigation and screen-reader accessible controls.
- **Hardware Integration**: Uses native browser Web Audio API `AudioContext` and `MediaRecorder` with graceful permission handling.

---

## 9. Cloud Persistence & Security Infrastructure

### Firebase Firestore Database
- **Collection**: `users/{userId}/settings`
  - Persists `highPriorityThreshold`, notification channels, and active protection toggles across user devices.
- **Collection**: `scans`
  - Stores authenticated scan logs and forensic incident histories.

### Secret Isolation
- `GEMINI_API_KEY` is kept strictly server-side and never exposed to the client.
- Audio uploads are stored in isolated operating system temporary directories and unlinked immediately after inference.

---

## 10. Getting Started & Local Development

### Prerequisites
- Node.js 18+ or Bun
- Python 3.10+ (for ML service experimentation)
- Google Gemini API Key (for speech-to-text transcription)

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env
# Edit .env with your GEMINI_API_KEY, MODEL_PATH, and MODEL_VERSION

# 3. Start development server (serves frontend + backend on port 3000)
npm run dev
```

### Running Inference Tests Directly
```bash
# Test Python model service directly:
python3 model_service.py /tmp/test_sine.wav

# Test API health:
curl -s http://localhost:3000/health

# Test file upload analysis:
curl -s -X POST http://localhost:3000/analyze -F "file=@models/sample.wav"
```

### Production Build
```bash
# Compile client bundle and bundle Node.js backend
npm run build

# Start production server
npm start
```

---

## 11. Future Roadmap: What to Build Next

Here is the prioritized technical roadmap for expanding VoiceGuard into a comprehensive enterprise defense ecosystem:

### Phase 1: Direct Telephony & VoIP PBX Ingress
- [ ] **SIP / WebRTC Trunk Connector**: Build a direct SIP proxy to inspect live VoIP telephony (Twilio, Asterisk, FreePBX) before calls ring human agents.
- [ ] **In-Call Whisper Warnings**: Inject real-time sub-audible or side-channel audio tones alerting call recipients ("Warning: Caller voice exhibits 94% synthetic confidence").
- [ ] **Automated Call Teardown Webhook**: Automatically hang up or route suspicious callers to an AI honeypot when confidence exceeds the critical threshold.

### Phase 2: Speaker Diarization & Biometric Whitelisting
- [ ] **Multi-Speaker Diarization**: Separate conversation tracks when two or more individuals speak simultaneously on a conference call.
- [ ] **Executive Voice Enrollment**: Allow authenticated leaders to record a 30-second cryptographic voice baseline; flag any incoming call claiming their identity that deviates from their acoustic fingerprint.
- [ ] **Caller Reputation Scoring**: Maintain a reputation database correlating caller ANI/caller-ID with historical acoustic deepfake scores.

### Phase 3: Client-Side Edge Inference (ONNX WebAssembly)
- [ ] **WebAssembly Inference Worker**: Compile `voiceguard_v1.onnx` for in-browser execution via `onnxruntime-web`.
- [ ] **Zero-Data-Transfer Private Mode**: Allow users to verify audio locally without their raw voice data leaving their device.

### Phase 4: Forensic Explainability & Heatmaps
- [ ] **Spectral Anomaly Heatmap**: Generate a color-coded 2D frequency heatmap highlighting exact seconds where neural vocoder synthesis artifacts appear.
- [ ] **Phoneme Discontinuity Breakdown**: Pinpoint specific phonemes (plosives, fricatives) where the clone model struggled with natural vocal tract air pressure.
- [ ] **Exportable Evidentiary PDF Reports**: Generate tamper-evident forensic audit packages (including SHA-256 audio hashes) for legal and law enforcement use.

### Phase 5: Enterprise Compliance & Integrations
- [ ] **SIEM / SOC Webhooks**: Native integrations with Splunk, Datadog, and Microsoft Sentinel to stream voice clone incident events.
- [ ] **Browser Extension**: Build a Chrome/Edge extension that hooks into Zoom, Google Meet, and Microsoft Teams tab audio to display real-time deepfake alerts.
- [ ] **Automated FTC & SOC 2 Compliance Logging**: Export comprehensive activity logs meeting enterprise fraud prevention and cybersecurity compliance mandates.

---

## Summary of Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 (TypeScript) |
| **Styling & UI** | Tailwind CSS v4, Motion, Lucide React, Google Material Symbols |
| **Backend Framework** | Node.js, Express.js (v4), Multer |
| **Machine Learning Core** | Isolated `model_service.py` & `model_service.ts` |
| **Model Runtime** | ONNX Model Format (`voiceguard_v1.onnx`), Acoustic DSP Analysis |
| **Speech-to-Text AI** | Google Gemini 3.5 Transcribe (`@google/genai`) |
| **Cloud Database** | Firebase Firestore |
| **Authentication** | Firebase Auth (Google Identity Services) |
| **Bundler & Tooling** | Vite, ESBuild, TSX, TypeScript 5.8 |

---

*VoiceGuard AI — Securing the authenticity of human voice in the era of generative AI.*
