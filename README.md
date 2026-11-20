# 🧠 MindMate AI — Personal Wellness & Student Productivity Companion

> **An AI-powered emotional wellness and academic productivity assistant designed for college students.**  
> Project developed by **Yash Kumar** (Roll No: `2400521520071`), 6th Semester, Computer Science & Engineering (Artificial Intelligence), **Institute of Engineering and Technology (IET), Lucknow**.

---

## 🌟 Overview & Problem Statement

College students often face significant academic stress, exam anxiety, erratic study habits, and emotional fatigue. Balancing dense engineering syllabi (like AI/ML, Operating Systems, Algorithms) while maintaining mental health is a continuous challenge.

**MindMate AI** bridges this gap by functioning as a dual-purpose companion:
1. **Mental Health & Emotional Wellness**: Real-time sentiment and emotion analysis, daily mood tracking with historical wellness analytics, parasympathetic 4-7-8 breathing resets, and 24/7 crisis helpline support (Tele-MANAS 14416).
2. **Academic Productivity**: Automated exam countdowns, syllabus micro-sprint breakdowns, interactive study checklists, and a customized Pomodoro deep-work timer.

---

## 🎨 UI/UX Design: Minimal Clean Light Glassmorphism

The user interface follows a modern **light-themed glassmorphism** aesthetic:
- **Frosted Glass Panels**: `backdrop-filter: blur(20px) saturate(180%)` with translucent white surfaces (`rgba(255, 255, 255, 0.75)`).
- **Ambient Gradient Orbs**: Soft pastel background orbs (`#bfdbfe`, `#fed7aa`, `#bbf7d0`) creating depth without visual distraction.
- **Micro-Interactions**: Smooth scale transitions on hover, dynamic SVG mood trend curves, breathing circle rhythm animations, and pulse indicators.
- **Accessibility**: High contrast typography, clear status badges, and responsive multi-device layout.

---

## 🚀 Key Features

### 1. 💬 AI Conversational Companion
- **Real-Time Emotion Detection**: Detects emotions (`stressed`, `exhausted`, `motivated`, `calm`, `sad`, `neutral`, `crisis`, `study_query`) and intent from user messages.
- **Context-Aware Dialogue**: Offers empathetic advice tailored to academic workloads at IET Lucknow.
- **Voice Speech-to-Text (STT)**: Direct microphone input via the Web Speech API (`SpeechRecognition`).
- **Text-to-Speech (TTS)**: Built-in voice readout (🔊) for AI messages via `window.speechSynthesis`.
- **National Crisis Helpline Integration**: Automatically triggers 24/7 toll-free crisis helpline alerts (India's **Tele-MANAS 14416 / 1800-891-4416** & **KIRAN 1800-599-0019**) if critical distress signals are detected.

### 2. 📊 Daily Mood Tracker & Analytics
- **5-State Mood Logger**: Motivated (90), Calm (80), Okay (70), Stressed (50), Exhausted (40).
- **Categorized Tags**: Academic, Coding, Exams, Health, Wellness.
- **7-Day Dynamic SVG Chart**: Smooth bezier curve chart with gradient fill rendering weekly score fluctuations, average wellness score, and active tracking streak.

### 3. 📚 AI Study Planner & Exam Countdown
- **Pre-populated IET Lucknow CSE(AI) Subjects**:
  - `CSE-601`: Artificial Intelligence & Machine Learning
  - `CSE-602`: Design & Analysis of Algorithms
  - `CSE-604`: Operating Systems & Systems Programming
- **Interactive Checklists**: Real-time task completion toggle that recalculates syllabus progress percentages.
- **AI Schedule Generator**: Modal dialog to break down new subjects into actionable study sprints.

### 4. 🌿 Focus & Calm Hub
- **4-7-8 Parasympathetic Reset**: Interactive breathing circle animation guided through 4s Inhale, 7s Hold, and 8s Exhale phases to lower cortisol levels before exams.
- **Study Focus Pomodoro Timer**: Switch between 25-minute sprints, 50-minute deep work, and 5-minute restorative breaks with audio synthesizer notifications.
- **Student Wellness & Cognitive Tips**: Curated guidance on the Feynman technique, spaced repetition, sleep architecture, and hydration.

### 5. 👤 Student Profile
- Pre-populated profile for **Yash Kumar** (`2400521520071`, IET Lucknow CSE-AI, 6th Semester), showcasing weekly study hours, wellness score, and active streaks.

---

## 🛠️ Tech Stack & Architecture

- **AI Model**: **Google Gemini AI API** (`gemini-3.5-flash-lite`, `gemini-flash-lite-latest`) with automatic resilience fallback to local NLP engine
- **Backend**: Node.js & Express.js REST API with `dotenv` configuration
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, Modern CSS3 Glassmorphism
- **Speech APIs**: Web Speech API (`webkitSpeechRecognition`) & Web SpeechSynthesis
- **Audio Synthesis**: Web Audio API (`AudioContext`) for custom timer chimes
- **Visuals**: Dynamic SVG Vector Graphics (gradient area curves, data points)
- **Deployment**: Localhost server on port `4000`

---

## 🔑 Environment Configuration

Create or update a `.env` file in the root folder:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=4000
```
*Note: If no Gemini API key is provided, MindMate automatically falls back to its built-in rule-based NLP engine.*

---

## 📂 Project Directory Structure

```
/home/yash/Desktop/mindmate-ai/
├── package.json          # Project metadata and dependencies (express, cors)
├── package-lock.json     # Locked dependency graph
├── README.md             # Complete documentation
├── src/
│   ├── mockData.js       # Profile, 7-day mood history, study plans, wellness tips
│   ├── nlpService.js     # Emotion classification, intent parsing, crisis safety rules
│   └── server.js         # Express REST API & static file server
└── public/
    ├── index.html        # Single-page application structure & glass UI layout
    ├── style.css         # Glassmorphism design system & responsive styling
    └── app.js            # UI controller, voice STT/TTS, SVG charts, timers
```

---

## 🏃 Running the Application

### 1. Prerequisites
Ensure **Node.js** (v16+) and **npm** are installed on your system.

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server (No API Key Required)
The project works **without a Gemini API key** - it automatically falls back to a built-in rule-based NLP engine for emotion analysis and companion responses.

```bash
npm start
# Alternatively:
node src/server.js
```

### 4. Open in Browser
Open your favorite web browser and navigate to:
```
http://localhost:4000
```

---

## 📡 REST API Reference

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/profile` | GET | Retrieve student profile (Yash Kumar, IET Lucknow) |
| `GET /api/chat/history` | GET | Fetch companion conversation messages |
| `POST /api/chat` | POST | Send user message, returns emotion analysis & AI reply |
| `GET /api/mood/history` | GET | Retrieve 7-day mood logs and calculated statistics |
| `POST /api/mood` | POST | Log daily mood score, tags, and notes |
| `GET /api/study/plans` | GET | Get all subject exam countdowns and task checklists |
| `PATCH /api/study/tasks/:id`| PATCH | Toggle task completion and recalculate progress |
| `POST /api/study/generate` | POST | Generate a new AI subject study schedule |
| `GET /api/wellness` | GET | Retrieve cognitive techniques and wellness tips |

---

## 🛡️ Student Safety & Ethics
MindMate AI is built in accordance with mental health safety guidelines. In any scenario where self-harm, severe clinical depression, or acute crisis keywords are identified, the application overrides standard responses with emergency helpline resources:
- **Tele-MANAS**: `14416` / `1800-891-4416` (National Mental Health Helpline)
- **KIRAN**: `1800-599-0019`
