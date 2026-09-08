# Smart India Hackathon (SIH) 2026 — Idea Submission
## Problem Statement: SIH26104 — AI-Powered Real-Time Detection and Prevention of Voice Cloning Impersonation Attacks
### Project Title: VoiceGuard AI — Autonomous Acoustic Forensic Sentry

---

## 🎨 Canva Presentation Theme & Color Palette Guide (Matching VoiceGuard App UI)

To ensure the PPT visually mirrors the production app's high-tech, dark forensic cybersecurity aesthetic, use the exact hex codes below in your Canva color picker:

### 1. Primary Palette & Surfaces
| Element | Hex Code | Visual Sample / Name | Canva Usage Guideline |
| :--- | :--- | :--- | :--- |
| **Slide Background** | `#0F141A` | Obsidian Navy | Set as the solid background color for all 5 slides. Gives a professional, low-fatigue cyber defense backdrop. |
| **Content Cards / Boxes** | `#171C22` | Dark Slate Surface | Use for background fill of all content cards, bento-grid tiles, and comparison containers. |
| **Inner Box / Inset Well** | `#0A0F15` | Jet Black Well | Use for inner stat boxes, code/flowchart node containers, or quote highlights inside the main cards. |
| **Hover / Secondary Box** | `#252A31` | Charcoal Accent Fill | Use for button shapes, interactive badge backings, or table row alternations. |

### 2. Typography & Text Hierarchy
| Element | Hex Code | Visual Sample / Name | Canva Usage Guideline |
| :--- | :--- | :--- | :--- |
| **Main Headings & Titles** | `#DEE3EB` | Crisp Off-White | Slide titles, primary bold headings, and high-priority bullet text. Maximum readability on dark background. |
| **Subheadings & Body Text** | `#BBCBBB` | Muted Ice Gray | Explanatory text, secondary descriptions, and diagram label annotations. |
| **Captions & Metadata** | `#869486` | Acoustic Sage Gray | Citations, timestamps, footnote references, and subtle metric labels (e.g., "48 kHz", "Latency <50ms"). |

### 3. Highlight Accents (Word Highlights, Badges & Icons)
| Accent Role | Hex Code | Color Name | Canva Usage Guideline |
| :--- | :--- | :--- | :--- |
| **Primary Brand Accent (Safe / Authentic)** | `#54E98A` | **Cyber Neon Green** | **HIGHLIGHT WORDS:** Bold key terms in bullets (e.g., **Real-Time Defense**, **Authentic Human**, **Sub-second Warning**). Use for checkmarks, primary CTA boxes, and "Built in Prototype" badges. |
| **Deep Green Box Fill** | `#003919` | Forest Shield Base | Background fill for green badge pills (pair with `#54E98A` text and 1px `#54E98A` border). |
| **Threat & Alert Accent (Deepfake / Risk)** | `#FFB4AB` | **Coral / Salmon Red** | **HIGHLIGHT WORDS:** Bold risk terms (e.g., **Voice Cloning**, **Zero-Day Vocoder**, **Critical Glottal Pulse Flagged**). Use for warning icons and "Deepfake Detected" tags. |
| **Deep Red Box Fill** | `#93000A` / `#690005` | Crimson Warning Base | Background fill for threat alerts or risk matrix boxes (pair with `#FFB4AB` text). |
| **Tech, Models & Telemetry** | `#7DD0FF` | **Electric Cyan** | **HIGHLIGHT WORDS:** Technical frameworks, model names (e.g., **RawNet2**, **AASIST**, **Gemini 2.5 Flash**, **Web Audio FFT**). |
| **Caution / Parameter Accent** | `#FFC37D` | Acoustic Amber | Use for threshold indicators (e.g., "90% Sensitivity Threshold"), intermediate timeline phases, or caution tags. |

### 4. Lines, Borders & Flowchart Connectors
| Element | Hex Code / Style | Canva Usage Guideline |
| :--- | :--- | :--- |
| **Box / Card Borders** | `#252A31` *(or White at 10% opacity)* | 1px clean border around cards and containers to give crisp optical separation from the `#0F141A` slide background. |
| **Accent Divider Lines** | `#54E98A` *(or Gradient to `#7DD0FF`)* | 1.5px horizontal separator line directly beneath slide titles or between card header and body. |
| **Flowchart Arrows / Lines** | `#7DD0FF` *(Electric Cyan)* | Connecting arrows between pipeline stages in Slide 2 flowchart. Shows dynamic signal flow. |
| **Status Glow Accent** | `#54E98A` (20% Opacity) | Soft blur circle placed behind key statistics (e.g., "99.2%") for a subtle cyber glow effect. |

---

## SLIDE 1 – Proposed Solution (Idea / Solution / Prototype)

### Color Styling Instructions for Slide 1
- **Slide Background:** `#0F141A`
- **Slide Title:** `#DEE3EB` with bottom accent line in `#54E98A`
- **Cards / Containers:** `#171C22` with 1px border `#252A31`
- **Highlight Words in Bullets:** `#54E98A` (for core capabilities) and `#FFB4AB` (for threat terms)
- **Prototype Status Badge:** Box background `#003919`, text `#54E98A`, border `#54E98A`

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
- **Right Side:** Minimalist conceptual graphic illustrating an incoming audio call split through the "Acoustic Shield Neural Link" into "Verified Human" (`#54E98A`) vs. "Cloned Voice Flagged" (`#FFB4AB`).
- **Icon Accents:** Shield icon (`shield_lock` in `#54E98A`), acoustic wave icon (`graphic_eq` in `#7DD0FF`), alert beacon icon (`notification_important` in `#FFB4AB`).

---

## SLIDE 2 – Technical Approach

### Color Styling Instructions for Slide 2
- **Slide Background:** `#0F141A`
- **Flowchart Box Fills:** `#171C22` (Outer box), `#0A0F15` (Inner step details)
- **Flowchart Connector Lines & Arrows:** `#7DD0FF` (Electric Cyan)
- **Built in Prototype Badge:** `#003919` fill with `#54E98A` text & border
- **Planned for SIH Scale Badge:** `#1B2026` fill with `#7DD0FF` text & border
- **Highlight Words:** `#7DD0FF` for technologies (React, FFT, RawNet2, Gemini)

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
- **Status Tags on Diagram:** Badge `[Built in Prototype]` (`#54E98A`) on Steps 1–3 & 5; Badge `[Planned SIH Scale]` (`#7DD0FF`) on Step 4 (dual-engine) and Step 6 (SIP carrier hook).

---

## SLIDE 3 – Feasibility and Viability

### Color Styling Instructions for Slide 3
- **Slide Background:** `#0F141A`
- **Left Column Box (Challenges & Risks):** `#171C22` fill, left accent border `#FFB4AB` (Coral Red), heading text `#FFB4AB`
- **Right Column Box (Our Engineering Solutions):** `#171C22` fill, left accent border `#54E98A` (Neon Green), heading text `#54E98A`
- **Highlight Words in Bullets:** `#FFB4AB` on risk side, `#54E98A` on solution side
- **Icons:** Stopwatch & Sliders in `#7DD0FF`

### Slide Content
- **Technical Feasibility:** Validated with open forensic benchmarks (ASVspoof 2021, In-the-Wild) and lightweight edge model quantization (int8 ONNX).
- **Sub-Second Latency Challenge:** Overcome by 2-stage tiering: ultra-light edge heuristic (<50ms) triggers deep cloud forensic pass.
- **Generalization to Zero-Day Vocoders:** Combat unseen diffusion/autoregressive models by detecting biological human artifacts (breath cadences) rather than specific synthetic signatures.
- **False Positive Mitigation:** Dual-channel verification and user-adjustable confidence thresholds (e.g., 90% for high-value banking calls).
- **Telecom & Platform Integration:** Implemented via standard Android TelecomManager / CallScreeningService APIs and cloud SIP proxy webhooks.
- **Team Skill Fit:** Interdisciplinary capability spanning DSP audio processing, full-stack React/Node architecture, and deep learning pipelines.

### Suggested Visual
- **Visual Type:** 2-Column Risk & Mitigation Matrix / Icon Grid.
- **Column 1 (Challenges & Risks - Styled in `#FFB4AB`):**
  - High latency during live calls
  - Evolving zero-day generative AI voices
  - High false positive risk in noisy audio
  - Telecom carrier access hurdles
- **Column 2 (Our Engineering Solutions - Styled in `#54E98A`):**
  - Hierarchical 2-tier edge/cloud inference
  - Biological vocal-tract invariant detection
  - Dynamic user-controlled confidence thresholds
  - Standard OS CallScreening APIs + WebRTC/SIP proxies
- **Visual Accents:** Vector icons for stopwatch (`timer`), neural net (`psychology`), tuning sliders (`tune`), and network gateway (`router`).

---

## SLIDE 4 – Impact and Benefits

### Color Styling Instructions for Slide 4
- **Slide Background:** `#0F141A`
- **Stakeholder Cards (Top 4 Cards):** `#171C22` with 1px border `#252A31`, hover card glow `#54E98A`
- **Roadmap Chevrons (Bottom Phase Bar):**
  - Phase 1 (Prototype / Current): `#54E98A` (Neon Green)
  - Phase 2 (Edge Android Daemon): `#7DD0FF` (Electric Cyan)
  - Phase 3 (SIP Carrier Trunk): `#FFC37D` (Acoustic Amber)
  - Phase 4 (National Mesh): `#DEE3EB` (Bright Off-White)
- **Highlight Words in Bullets:** `#54E98A` for benefits, `#FFB4AB` for fraud prevention

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
  - *BFSI & Fintech* (Fraud prevention, KYC voice authorization) — Icon `#54E98A`
  - *General Public & Elderly* (Family emergency scam protection) — Icon `#7DD0FF`
  - *Telecom Carriers* (Trust-as-a-Service, verified caller tags) — Icon `#FFC37D`
  - *Law Enforcement* (Tamper-proof forensic incident export) — Icon `#FFB4AB`
- **Bottom Section (Roadmap Tracker):** 4-step progressive milestone chevron: `Prototype MVP (Current)` $\rightarrow$ `Edge Android Daemon (SIH Finale)` $\rightarrow$ `Enterprise SIP Trunk` $\rightarrow$ `National Sentry Mesh`.

---

## SLIDE 5 – Research and References

### Color Styling Instructions for Slide 5
- **Slide Background:** `#0F141A`
- **Reference Cards:** `#171C22` background with subtle 1px border `#252A31`
- **Category Badge Pills:**
  - `[Benchmark]`: Background `#003919`, text `#54E98A`
  - `[Neural Architecture]`: Background `#102B3F`, text `#7DD0FF`
  - `[Raw Audio SOTA]`: Background `#102B3F`, text `#7DD0FF`
  - `[Generative Dataset]`: Background `#382A12`, text `#FFC37D`
  - `[Policy / Risk]`: Background `#451014`, text `#FFB4AB`
- **Links & Citations:** URLs in `#7DD0FF` (Electric Cyan underline)
- **Author & Year Text:** `#DEE3EB` (Bold Off-White)

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
- **Accents:** Academic graduation cap icon (`school` in `#54E98A`), research article icon (`article` in `#7DD0FF`), verified link icon (`link` in `#7DD0FF`).
