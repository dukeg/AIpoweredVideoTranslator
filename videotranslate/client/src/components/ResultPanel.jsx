import { useState } from 'react';
import styles from './ResultPanel.module.css';

const LANG_NAMES = {
  en:'English', es:'Spanish', fr:'French', de:'German', ja:'Japanese',
  zh:'Chinese', ar:'Arabic', hi:'Hindi', pt:'Portuguese', ru:'Russian',
  ko:'Korean', it:'Italian', tr:'Turkish', nl:'Dutch', pl:'Polish',
};

export default function ResultPanel({ result, config, videoPreview, onReset }) {
  const [activeTab, setActiveTab] = useState('video');
  const [copied, setCopied] = useState(false);

  const formatSize = (bytes) => {
    if (!bytes) return '';
    return bytes > 1024*1024 ? `${(bytes/(1024*1024)).toFixed(1)} MB` : `${(bytes/1024).toFixed(0)} KB`;
  };

  const handleCopySRT = async () => {
    if (result.translatedSRT) {
      await navigator.clipboard.writeText(result.translatedSRT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles.wrapper}>
      {/* Success banner */}
      <div className={styles.successBanner}>
        <div className={styles.successIcon}>✅</div>
        <div>
          <div className={styles.successTitle}>Translation Complete!</div>
          <div className={styles.successSub}>
            {result.segmentCount} subtitle segments · Detected: {result.detectedLanguage} → {LANG_NAMES[config.targetLang] || config.targetLang}
          </div>
        </div>
        <button className={styles.newBtn} onClick={onReset}>+ New Video</button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {['video', 'subtitles', 'download'].map(tab => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {{ video: '🎬 Video', subtitles: '📝 Subtitles', download: '⬇ Downloads' }[tab]}
          </button>
        ))}
      </div>

      {/* Video tab */}
      {activeTab === 'video' && (
        <div className={styles.panel}>
          <div className={styles.videoCompare}>
            <div className={styles.videoBox}>
              <div className={styles.videoBoxLabel}>ORIGINAL</div>
              <video className={styles.video} src={videoPreview} controls playsInline />
            </div>
            <div className={styles.videoArrow}>→</div>
            <div className={styles.videoBox}>
              <div className={styles.videoBoxLabel}>TRANSLATED</div>
              {result.outputUrl ? (
                <video className={styles.video} src={result.outputUrl} controls playsInline />
              ) : (
                <div className={styles.videoPlaceholder}>Processing...</div>
              )}
            </div>
          </div>

          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <div className={styles.metaLabel}>SOURCE LANGUAGE</div>
              <div className={styles.metaValue}>{result.detectedLanguage || 'Auto-detected'}</div>
            </div>
            <div className={styles.metaItem}>
              <div className={styles.metaLabel}>TARGET LANGUAGE</div>
              <div className={styles.metaValue}>{LANG_NAMES[config.targetLang] || config.targetLang}</div>
            </div>
            <div className={styles.metaItem}>
              <div className={styles.metaLabel}>SUBTITLE SEGMENTS</div>
              <div className={styles.metaValue}>{result.segmentCount || '—'}</div>
            </div>
            <div className={styles.metaItem}>
              <div className={styles.metaLabel}>OUTPUT SIZE</div>
              <div className={styles.metaValue}>{formatSize(result.outputSize)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Subtitles tab */}
      {activeTab === 'subtitles' && (
        <div className={styles.panel}>
          <div className={styles.srtHeader}>
            <span className={styles.srtTitle}>Translated SRT Subtitles</span>
            <button className={`${styles.copyBtn} ${copied ? styles.copied : ''}`} onClick={handleCopySRT}>
              {copied ? '✓ Copied!' : 'Copy SRT'}
            </button>
          </div>
          <pre className={styles.srtContent}>
            {result.translatedSRT || 'SRT content not available'}
          </pre>
        </div>
      )}

      {/* Downloads tab */}
      {activeTab === 'download' && (
        <div className={styles.panel}>
          <div className={styles.downloadGrid}>
            {[
              {
                label: 'Translated Video',
                desc: 'MP4 with burned-in subtitles',
                icon: '🎬',
                url: result.outputUrl,
                filename: 'translated_video.mp4',
                highlight: true
              },
              {
                label: 'Translated SRT',
                desc: 'Subtitle file for your video editor',
                icon: '💬',
                url: result.translatedSRTUrl,
                filename: 'translated_subtitles.srt'
              },
              {
                label: 'Original SRT',
                desc: 'Original language transcription',
                icon: '📄',
                url: result.originalSRTUrl,
                filename: 'original_subtitles.srt'
              }
            ].map((item, i) => (
              <div key={i} className={`${styles.downloadCard} ${item.highlight ? styles.downloadHighlight : ''}`}>
                <div className={styles.downloadIcon}>{item.icon}</div>
                <div className={styles.downloadMeta}>
                  <div className={styles.downloadLabel}>{item.label}</div>
                  <div className={styles.downloadDesc}>{item.desc}</div>
                </div>
                <a
                  href={item.url}
                  download={item.filename}
                  className={`${styles.downloadBtn} ${!item.url ? styles.downloadDisabled : ''}`}
                  onClick={!item.url ? (e) => e.preventDefault() : undefined}
                >
                  ↓
                </a>
              </div>
            ))}
          </div>

          <div className={styles.notice}>
            <span>💡</span>
            Files are available for 1 hour after processing. Download them now to save locally.
          </div>
        </div>
      )}
    </div>
  );
}
