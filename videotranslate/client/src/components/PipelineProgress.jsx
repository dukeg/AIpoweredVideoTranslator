import { useEffect, useState } from 'react';
import styles from './PipelineProgress.module.css';

const STEPS = [
  { key: 'uploading',        label: 'Uploading Video',       icon: '📤', desc: 'Saving your video to the server' },
  { key: 'extracting_audio', label: 'Extracting Audio',      icon: '🎵', desc: 'Separating audio track with FFmpeg' },
  { key: 'transcribing',     label: 'Transcribing Speech',   icon: '🎙️', desc: 'OpenAI Whisper detecting language & speech' },
  { key: 'translating',      label: 'Translating Subtitles', icon: '🌍', desc: 'Claude AI translating all subtitle segments' },
  { key: 'rendering',        label: 'Rendering Video',       icon: '🎬', desc: 'FFmpeg burning subtitles into video' },
  { key: 'complete',         label: 'Complete!',             icon: '✅', desc: 'Your translated video is ready' },
];

const STATUS_ORDER = ['uploading','extracting_audio','transcribing','translating','rendering','complete'];

export default function PipelineProgress({ jobId, videoPreview, config, onComplete, onFailed }) {
  const [job, setJob] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [startTime] = useState(Date.now());

  // Timer
  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startTime]);

  // SSE polling
  useEffect(() => {
    if (!jobId) return;
    const es = new EventSource(`/api/jobs/${jobId}/stream`);
    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setJob(data);
      if (data.status === 'complete') { es.close(); onComplete(data); }
      if (data.status === 'failed')   { es.close(); onFailed(data); }
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [jobId]);

  const currentStepIdx = job ? STATUS_ORDER.indexOf(job.status) : 0;
  const fmt = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;

  const LANG_NAMES = {
    en:'English', es:'Spanish', fr:'French', de:'German', ja:'Japanese',
    zh:'Chinese', ar:'Arabic', hi:'Hindi', pt:'Portuguese', ru:'Russian',
    ko:'Korean', it:'Italian', tr:'Turkish', nl:'Dutch', pl:'Polish',
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.top}>
        {videoPreview && (
          <div className={styles.videoWrap}>
            <video className={styles.videoThumb} src={videoPreview} muted playsInline />
            <div className={styles.videoBadge}>Processing...</div>
          </div>
        )}
        <div className={styles.topMeta}>
          <div className={styles.topTitle}>Translating your video</div>
          <div className={styles.topSub}>
            Target: <strong>{LANG_NAMES[config.targetLang] || config.targetLang}</strong>
            &nbsp;·&nbsp;Elapsed: <strong>{fmt(elapsed)}</strong>
          </div>
          {job?.data?.segmentCount && (
            <div className={styles.topSub}>
              Segments: <strong>{job.data.segmentCount}</strong>
              {job?.data?.detectedLanguage && (
                <>&nbsp;·&nbsp;Detected: <strong>{job.data.detectedLanguage}</strong></>
              )}
            </div>
          )}
          <div className={styles.overallBar}>
            <div
              className={styles.overallFill}
              style={{ width: `${job?.progress || 0}%` }}
            />
          </div>
          <div className={styles.overallLabel}>{job?.progress || 0}% complete</div>
        </div>
      </div>

      <div className={styles.steps}>
        {STEPS.map((step, i) => {
          const isDone    = currentStepIdx > i;
          const isActive  = STATUS_ORDER[currentStepIdx] === step.key;
          const isPending = currentStepIdx < i;

          return (
            <div
              key={step.key}
              className={`${styles.step} ${isDone ? styles.done : ''} ${isActive ? styles.active : ''} ${isPending ? styles.pending : ''}`}
            >
              <div className={styles.stepLeft}>
                <div className={styles.stepIconWrap}>
                  {isDone ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : isActive ? (
                    <div className={styles.stepSpinner} />
                  ) : (
                    <span className={styles.stepNum}>{i + 1}</span>
                  )}
                </div>
                <div className={styles.stepConnector} />
              </div>
              <div className={styles.stepBody}>
                <div className={styles.stepHeader}>
                  <span className={styles.stepIcon}>{step.icon}</span>
                  <span className={styles.stepLabel}>{step.label}</span>
                  {isActive && (
                    <span className={styles.stepLiveBadge}>LIVE</span>
                  )}
                </div>
                <div className={styles.stepDesc}>{step.desc}</div>
                {isActive && job?.message && (
                  <div className={styles.stepMessage}>{job.message}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.footer}>
        <div className={styles.footerDot} />
        <span>Processing securely on your server · Do not close this tab</span>
      </div>
    </div>
  );
}
