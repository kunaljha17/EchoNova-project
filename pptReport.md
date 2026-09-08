# Smart India Hackathon (SIH) 2026 — Idea Submission
## Problem Statement: SIH26104 — AI-Powered Real-Time Detection and Prevention of Voice Cloning Impersonation Attacks
### Project Title: VoiceGuard AI — Autonomous Acoustic Forensic Sentry

---

## SLIDE 1 – Proposed Solution (Idea / Solution / Prototype)

### Slide Content
- **End-to-End Defense Architecture:** Real-time acoustic sentry detecting synthetic speech artifacts during active cellular, VoIP, and web calls.
- **Multi-Feature Biometric Analysis:** Cross-examines vocal tract resonance, glottal pulse timing, phase continuity, and biological breathing dynamics.
- **Instant Mitigation & Shielding:** Triggers sub-second warning overlays, automated audio attenuation, and step-up biometric verification challenges.
- **Configurable Risk Thresholding:** Dynamic sensitivity slider and custom confidence gating (50%–99%) adapt to high-risk financial environments.
- **Current Prototype Scope:** Working proof-of-concept MVP demonstrates live microphone spectral FFT analysis, threshold gating, and cloud telemetry.
- **Full Solution Target:** Telco-grade network gateway and background smartphone daemon providing zero-latency continuous voice interception.

### Suggested Visual
- **Visual Type:** Split Layout — Prototype Screenshot + System Overview Graphic.
- **Left Side:** High-resolution screenshot of the working VoiceGuard prototype (showing live waveform visualizer, alert banner, and forensic confidence score).
- **Right Side:** Minimalist conceptual graphic illustrating an incoming audio call split through the "Acoustic Shield Neural Link" into "Verified Human" vs. "Cloned Voice Flagged".
- **Icon Accents:** Shield icon (`shield_lock`), acoustic wave icon (`graphic_eq`), alert beacon icon (`notification_important`).

---

## SLIDE 2 – Technical Approach

### Slide Content
- **Front-End & Client Daemon:** React, Web Audio API (real-time FFT spectrogram), Capacitor (native Android/iOS packaging).
- **Backend & Forensics Engine:** Node.js/Express, Python-based acoustic microservices, Firebase Firestore (tamper-proof forensic telemetry).
- **AI / ML Pipeline:** Gemini 2.5 Flash / Transcribe multimodal analysis paired with raw-waveform neural detectors (RawNet2 / AASIST / Wav2Vec2).
- **Pipeline Flow:** Audio Ingest → Noise Suppression & Normalization → Spectral/Phoneme Feature Extraction → Model Inference → Real-Time Alert & SIP Disruption.
- **Prototype Status:** Audio capture, real-time FFT visualization, Gemini transcription, and threshold rule engine are functional.
- **Planned Additions:** Native SIP/VoIP telecom hook, edge-quantized ONNX model execution, and zero-latency carrier API integration.

### Suggested Visual
- **Visual Type:** Custom Horizontal Pipeline Flowchart (recreate using clean Canva shape blocks).
- **Diagram Flow:**
  1. `[Audio Ingest]` (Mic / SIP / Cellular Stream) $\rightarrow$
  2. `[Pre-Processing]` (Bandpass 48kHz, Noise Gate) $\rightarrow$
  3. `[Feature Extraction]` (FFT Spectrogram, Glottal Timing, MFCC) $\rightarrow$
  4. `[Dual Inference Engine]` (Edge CNN/RawNet + Cloud Multimodal LLM) $\rightarrow$
  5. `[Decision Engine]` (Custom Threshold Comparator: $\ge 90\%$) $\rightarrow$
  6. `[Automated Response]` (In-App Alert, Call Mute, SIP Intercept).
- **Status Tags on Diagram:** Badge `[Built in Prototype]` on Steps 1–3 & 5; Badge `[Planned SIH Scale]` on Step 4 (dual-engine) and Step 6 (SIP carrier hook).

---

## SLIDE 3 – Feasibility and Viability

### Slide Content
- **Technical Feasibility:** Validated with open forensic benchmarks (ASVspoof 2021, In-the-Wild) and lightweight edge model quantization (int8 ONNX).
- **Sub-Second Latency Challenge:** Overcome by 2-stage tiering: ultra-light edge heuristic (<50ms) triggers deep cloud forensic pass.
- **Generalization to Zero-Day Vocoders:** Combat unseen diffusion/autoregressive models by detecting biological human artifacts (breath cadences) rather than specific synthetic signatures.
- **False Positive Mitigation:** Dual-channel verification and user-adjustable confidence thresholds (e.g., 90% for high-value banking calls).
- **Telecom & Platform Integration:** Implemented via standard Android TelecomManager / CallScreeningService APIs and cloud SIP proxy webhooks.
- **Team Skill Fit:** Interdisciplinary capability spanning DSP audio processing, full-stack React/Node architecture, and deep learning pipelines.

### Suggested Visual
- **Visual Type:** 2-Column Risk & Mitigation Matrix / Icon Grid.
- **Column 1 (Challenges & Risks):**
  - High latency during live calls
  - Evolving zero-day generative AI voices
  - High false positive risk in noisy audio
  - Telecom carrier access hurdles
- **Column 2 (Our Engineering Solutions):**
  - Hierarchical 2-tier edge/cloud inference
  - Biological vocal-tract invariant detection
  - Dynamic user-controlled confidence thresholds
  - Standard OS CallScreening APIs + WebRTC/SIP proxies
- **Visual Accents:** Vector icons for stopwatch (`timer`), neural net (`psychology`), tuning sliders (`tune`), and network gateway (`router`).

---

## SLIDE 4 – Impact and Benefits

### Slide Content
- **Banking & Enterprise Protection:** Shields call centers and BFSI desks against CEO fraud, unauthorized fund transfers, and voice-authorized wire theft.
- **Safeguarding Vulnerable Citizens:** Prevents distressing "distress call" / kidnapping scams targeting families and elderly individuals.
- **Telecom Operator Value:** Enables service providers to deliver branded "Voice Verified" premium caller authentication to subscribers.
- **Economic Safeguard:** Mitigates billions in projected financial fraud losses resulting from commoditized zero-shot voice cloning tools.
- **Zero Environmental Overhead:** Lightweight edge preprocessing minimizes redundant high-compute cloud inference, reducing server carbon footprint.
- **Restoring Trust in Communications:** Restores public confidence in telephonic identity, customer support hotlines, and digital voice channels.

### Future Roadmap (Target Milestones Post-Internal Hackathon)
- **Phase 1 (SIH Grand Finale):** On-device Android CallScreening daemon + multi-accent Indian language benchmark evaluation.
- **Phase 2:** Direct SIP trunking & Asterisk/FreeSWITCH carrier gateway integration for enterprise call centers.
- **Phase 3:** Automated federated continuous learning pipeline updating voice signature heuristics against newly released open-source TTS models.
- **Phase 4:** Institutional partnerships with cybercrime cells, banking institutions, and telecom carriers for nationwide threat telemetry.

### Suggested Visual
- **Visual Type:** Multi-Stakeholder Bento-Box Layout + Milestone Timeline Graphic.
- **Top Section (Stakeholder Cards):** 4 clean cards with icons:
  - *BFSI & Fintech* (Fraud prevention, KYC voice authorization)
  - *General Public & Elderly* (Family emergency scam protection)
  - *Telecom Carriers* (Trust-as-a-Service, verified caller tags)
  - *Law Enforcement* (Tamper-proof forensic incident export)
- **Bottom Section (Roadmap Tracker):** 4-step progressive milestone chevron: `Prototype MVP (Current)` $\rightarrow$ `Edge Android Daemon (SIH Finale)` $\rightarrow$ `Enterprise SIP Trunk` $\rightarrow$ `National Sentry Mesh`.

---

## SLIDE 5 – Research and References

### Slide Content
- **ASVspoof 2021 Consortium (2021):** Evaluates voice biometrics under logical access (TTS/VC) and speech deepfake conditions. [https://www.asvspoof.org](https://www.asvspoof.org)
- **Jung et al. (2022) — AASIST:** Audio Anti-Spoofing using Integrated Spectro-Temporal Graph Attention Networks. [https://arxiv.org/abs/2110.01200](https://arxiv.org/abs/2110.01200)
- **Tak et al. (2021) — RawNet2:** End-to-end raw waveform anti-spoofing countering speech synthesis and voice conversion. [https://arxiv.org/abs/2011.01108](https://arxiv.org/abs/2011.01108)
- **Müller et al. (2024) — Deepfake Audio in the Wild:** Large-scale benchmark of modern diffusion and autoregressive vocoders. [https://arxiv.org/abs/2311.14480](https://arxiv.org/abs/2311.14480)
- **Federal Trade Commission (FTC, 2024):** Voice Cloning Technology Challenge Report on consumer impersonation risks. [https://www.ftc.gov](https://www.ftc.gov)

### Suggested Visual
- **Visual Type:** Clean Reference Cards with Academic Journal & Authority Badges.
- **Layout:** 5 stacked horizontal citation pills or cards with distinct colored badges:
  - `[Benchmark]` ASVspoof 2021
  - `[Neural Architecture]` AASIST Graph Attention
  - `[Raw Audio SOTA]` RawNet2 Interspeech
  - `[Generative Dataset]` Audio In-The-Wild 2024
  - `[Policy / Risk]` FTC Voice Cloning Directive
- **Accents:** Academic graduation cap icon (`school`), research article icon (`article`), verified link icon (`link`).
