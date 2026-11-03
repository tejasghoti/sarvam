# Guru AI — Multilingual AI Avatar Tutor

An interactive, multilingual AI Avatar Tutor powered entirely by the **Sarvam AI** platform stack.

[![Sarvam AI](https://img.shields.io/badge/Powered%20By-Sarvam%20AI-blueviolet)](https://sarvam.ai)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688)](https://fastapi.tiangolo.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 🌟 Key Features

1. **Lifelike Animated AI Avatar ("Guru AI")**:
   - **Autonomous Blinking & Expressive Lip-Sync**: Natural facial micro-animations and mouth movements synchronized in real-time to speech playback.
   - **Interactive Soundwaves**: Audio wave visualizer that pulses with speech energy.
   - **6 Indian Voice Personas**: Choose from Aditya (Male Tutor), Simran (Female Tutor), Shubh (Dynamic Voice), Ritu (Encouraging Voice), Priya (Clear Tone), and Rohan (Energetic Voice).
   - **8+ Languages Supported**: English (`en-IN`), Hindi (`hi-IN`), Tamil (`ta-IN`), Telugu (`te-IN`), Marathi (`mr-IN`), Kannada (`kn-IN`), Bengali (`bn-IN`), and Gujarati (`gu-IN`).

2. **Full Voice Pipeline (STT + TTS)**:
   - **Voice Input (STT)**: Speaks using your microphone via browser `MediaRecorder` streamed to Sarvam's `saaras:v3` Speech-to-Text model.
   - **Voice Output (TTS)**: High-fidelity natural speech generated using Sarvam's `bulbul:v3` Text-to-Speech model.
   - **One-Click Test & Replay**: Dedicated "Test Voice" and "Replay" buttons directly on the UI.

3. **Live Visual Whiteboard**:
   - **Real-Time Diagrams**: Dynamically renders conceptual flowcharts, cycles, and mindmaps using **Mermaid.js**.
   - **KaTeX Mathematical Formulations**: Renders complex mathematical formulas, physics equations, and chemical reactions.
   - **Step-by-Step Notes**: Key conceptual takeaways generated for each lesson turn.

4. **Adaptive Socratic Learning**:
   - **Comprehension Checkpoints**: Every lesson turn provides adaptive multiple-choice checkpoint questions.
   - **Dynamic Mastery Tracking**: Live 0–100% comprehension score meter tracking student progress.
   - **Instant Feedback**: Encouraging remarks and hints tailored to student responses.

---

## 🏗️ Architecture & Sarvam AI Stack

| Component | Model / Engine | Purpose |
| :--- | :--- | :--- |
| **Conversational Brain** | `sarvam-105b-conversations` | Pedagogical Socratic reasoning, visual whiteboard directives, and adaptive questions |
| **Speech-to-Text (STT)** | `saaras:v3` | High-accuracy multilingual audio transcription with native code-mixing support |
| **Text-to-Speech (TTS)** | `bulbul:v3` | Natural, expressive speech synthesis with specialized Indian language voices |
| **Diagram Engine** | `Mermaid.js` | Real-time SVG visual flowcharts & concept maps |
| **Math Engine** | `KaTeX` | Fast mathematical equation rendering |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.9+
- A valid Sarvam AI API Key (from [dashboard.sarvam.ai](https://dashboard.sarvam.ai))

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/tejasghoti/sarvam.git
   cd sarvam
   ```

2. **Install dependencies**:
   ```bash
   pip install sarvamai fastapi uvicorn
   ```

3. **Configure API Key**:
   Create a `.env` file in the root directory:
   ```env
   SARVAM_API_KEY=your_sarvam_api_key_here
   ```

4. **Start the application**:
   ```bash
   python3 -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
   ```

5. **Open in browser**:
   Navigate to:
   ```text
   http://127.0.0.1:8000
   ```

---

## 📂 Project Structure

```
.
├── .env                  # Environment file (ignored by git)
├── .gitignore            # Excludes .env, __pycache__, etc.
├── app.py                # FastAPI backend (Sarvam LLM, Bulbul TTS, Saaras STT)
├── main.py               # Quick CLI test script
├── README.md             # Project documentation
└── static/
    ├── index.html        # Stitch-inspired glassmorphism responsive frontend
    ├── app.js            # Avatar animation, voice recorder, player & whiteboard controller
    └── style.css         # Soundwave visualizer, breathing animations & custom tokens
```
