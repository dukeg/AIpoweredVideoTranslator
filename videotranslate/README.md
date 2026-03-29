# 🎬 VideoTranslate AI

> Universal AI-powered video translation — upload any video in any language, get back a fully translated video with burned-in subtitles.

![Pipeline](https://img.shields.io/badge/Pipeline-Whisper%20→%20Claude%20→%20FFmpeg-7c6af7?style=flat-square)
![Node](https://img.shields.io/badge/Node.js-20+-green?style=flat-square&logo=node.js)
![Docker](https://img.shields.io/badge/Docker-ready-blue?style=flat-square&logo=docker)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

---

## 🏗 Architecture

```
┌──────────────┐     ┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│  React UI    │────▶│  Express    │────▶│  OpenAI      │────▶│  Anthropic   │
│  (Vite)      │     │  Server     │     │  Whisper API │     │  Claude API  │
└──────────────┘     └─────────────┘     └──────────────┘     └──────────────┘
                            │                                          │
                            ▼                                          ▼
                     ┌─────────────┐                         ┌──────────────┐
                     │   FFmpeg    │◀────────────────────────│  Translated  │
                     │  (audio +   │                         │  SRT file    │
                     │   render)   │                         └──────────────┘
                     └─────────────┘
                            │
                            ▼
                     ┌─────────────┐
                     │  Output MP4 │
                     │ (with subs) │
                     └─────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- FFmpeg installed on your system
- OpenAI API key (for Whisper)
- Anthropic API key (for Claude)

### 1. Clone & Install
```bash
git clone https://github.com/YOUR_USERNAME/videotranslate-ai.git
cd videotranslate-ai
cp .env.example .env
# Edit .env and add your API keys
npm run install:all
```

### 2. Run in Development
```bash
npm run dev
# → Server: http://localhost:3001
# → Client: http://localhost:5173
```

### 3. Run with Docker
```bash
cp .env.example .env
# Add your API keys to .env
docker-compose up -d
# → App: http://localhost:3001
```

---

## 🔑 Required API Keys

| Service | Purpose | Get Key |
|---------|---------|---------|
| **OpenAI** | Speech-to-text (Whisper) | [platform.openai.com](https://platform.openai.com/api-keys) |
| **Anthropic** | Translation (Claude) | [console.anthropic.com](https://console.anthropic.com) |

Add both keys to your `.env` file:
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 📋 Translation Pipeline

| Step | Technology | Description |
|------|-----------|-------------|
| 1. Upload | Express + express-fileupload | Accept video up to 500MB |
| 2. Extract Audio | FFmpeg (fluent-ffmpeg) | Pull MP3 audio from video |
| 3. Transcribe | OpenAI Whisper v1 | Auto-detect language, generate timed segments |
| 4. Translate | Claude claude-opus-4-6 | Batch translate all subtitle segments |
| 5. Render | FFmpeg subtitle filter | Burn translated SRT into output MP4 |

---

## 📁 Project Structure

```
videotranslate-ai/
├── server/
│   ├── index.js              # Express server entry
│   ├── routes/
│   │   ├── transcribe.js     # Main pipeline route
│   │   ├── translate.js      # Standalone translation
│   │   ├── render.js         # Re-render with custom SRT
│   │   └── jobs.js           # Job status + SSE stream
│   └── utils/
│       ├── ffmpeg.js         # FFmpeg wrappers
│       ├── whisper.js        # Whisper API + SRT utils
│       ├── claude.js         # Claude translation
│       └── jobs.js           # In-memory job store
├── client/
│   ├── src/
│   │   ├── App.jsx           # Root component + stage machine
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── VideoUploader.jsx    # Drag-and-drop upload
│   │   │   ├── LanguageSelector.jsx # Source/target lang config
│   │   │   ├── PipelineProgress.jsx # Live SSE progress tracker
│   │   │   └── ResultPanel.jsx      # Video compare + downloads
│   │   └── styles/globals.css
│   └── vite.config.js
├── .github/workflows/ci-cd.yml
├── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## 🌍 Supported Languages

**Input (Auto-detected by Whisper):** 99+ languages

**Output (Translated by Claude):**
English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, Hindi, Turkish, Dutch, Polish, Swedish, Danish, Finnish, Greek, Hebrew, Thai, Vietnamese, Indonesian, Ukrainian, Czech, Hungarian, Romanian, Bengali, Tamil, Urdu, Persian, Swahili

---

## 🔧 API Endpoints

```
POST /api/transcribe          Upload video + start full pipeline
GET  /api/jobs/:id            Poll job status
GET  /api/jobs/:id/stream     SSE live job updates
POST /api/translate/srt       Translate existing SRT file
GET  /api/translate/languages List supported languages
POST /api/render              Re-render video with custom SRT
GET  /api/health              Server health check
```

---

## 🚢 Deploying to GitHub

```bash
git init
git add .
git commit -m "feat: initial VideoTranslate AI"
git remote add origin https://github.com/YOUR_USERNAME/videotranslate-ai.git
git push -u origin main
```

Configure GitHub Secrets for CI/CD:
- `DOCKER_USERNAME`, `DOCKER_PASSWORD` — Docker Hub credentials
- `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY` — SSH deployment target

---

## 📄 License

MIT © 2025
