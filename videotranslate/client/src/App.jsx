import { useState } from 'react';
import Header from './components/Header.jsx';
import VideoUploader from './components/VideoUploader.jsx';
import LanguageSelector from './components/LanguageSelector.jsx';
import PipelineProgress from './components/PipelineProgress.jsx';
import ResultPanel from './components/ResultPanel.jsx';
import styles from './App.module.css';

const STAGES = ['idle', 'configuring', 'processing', 'complete'];

export default function App() {
  const [stage, setStage] = useState('idle');
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [config, setConfig] = useState({ targetLang: 'en', sourceLang: 'auto', subtitleStyle: 'burned' });
  const [jobId, setJobId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleVideoSelected = (file, previewUrl) => {
    setVideoFile(file);
    setVideoPreview(previewUrl);
    setStage('configuring');
    setError(null);
  };

  const handleSubmit = async () => {
    if (!videoFile) return;
    setStage('processing');
    setError(null);

    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('targetLang', config.targetLang);
    formData.append('sourceLang', config.sourceLang);
    formData.append('subtitleStyle', config.subtitleStyle);

    try {
      const res = await fetch('/api/transcribe', { method: 'POST', body: formData });
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
      const { jobId } = await res.json();
      setJobId(jobId);
    } catch (err) {
      setError(err.message);
      setStage('configuring');
    }
  };

  const handleJobComplete = (job) => {
    setResult(job.data);
    setStage('complete');
  };

  const handleJobFailed = (job) => {
    setError(job.message);
    setStage('configuring');
  };

  const handleReset = () => {
    setStage('idle');
    setVideoFile(null);
    setVideoPreview(null);
    setJobId(null);
    setResult(null);
    setError(null);
    setConfig({ targetLang: 'en', sourceLang: 'auto', subtitleStyle: 'burned' });
  };

  return (
    <div className={styles.app}>
      {/* Background glow */}
      <div className={styles.glow1} />
      <div className={styles.glow2} />

      <Header />

      <main className={styles.main}>
        {stage === 'idle' && (
          <div className="fade-up">
            <div className={styles.hero}>
              <div className={styles.badge}>
                <span className={styles.badgeDot} />
                AI-POWERED · WHISPER + CLAUDE
              </div>
              <h1 className={styles.heroTitle}>
                Translate Any<br />Video Instantly
              </h1>
              <p className={styles.heroSub}>
                Upload a video in any language. Get back a fully translated video
                with burned-in subtitles — powered by OpenAI Whisper and Claude AI.
              </p>
            </div>
            <VideoUploader onVideoSelected={handleVideoSelected} />
            <div className={styles.features}>
              {[
                { icon: '🎙️', title: 'Auto Transcription', desc: 'Whisper AI detects speech in 99+ languages' },
                { icon: '🌍', title: '35+ Target Languages', desc: 'Claude translates with natural, contextual accuracy' },
                { icon: '🎬', title: 'Burned Subtitles', desc: 'FFmpeg renders subtitles directly into the video' },
                { icon: '⚡', title: 'Fast Pipeline', desc: 'Parallel processing for minimal wait time' }
              ].map((f, i) => (
                <div key={i} className={`${styles.featureCard} fade-up-${i % 3 + 1}`}>
                  <div className={styles.featureIcon}>{f.icon}</div>
                  <div>
                    <div className={styles.featureTitle}>{f.title}</div>
                    <div className={styles.featureDesc}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {stage === 'configuring' && (
          <div className="fade-up">
            <LanguageSelector
              config={config}
              setConfig={setConfig}
              videoFile={videoFile}
              videoPreview={videoPreview}
              onBack={() => setStage('idle')}
              onSubmit={handleSubmit}
              error={error}
            />
          </div>
        )}

        {stage === 'processing' && jobId && (
          <div className="fade-up">
            <PipelineProgress
              jobId={jobId}
              videoPreview={videoPreview}
              config={config}
              onComplete={handleJobComplete}
              onFailed={handleJobFailed}
            />
          </div>
        )}

        {stage === 'complete' && result && (
          <div className="fade-up">
            <ResultPanel
              result={result}
              config={config}
              videoPreview={videoPreview}
              onReset={handleReset}
            />
          </div>
        )}
      </main>
    </div>
  );
}
