import { useState } from 'react';
import styles from './LanguageSelector.module.css';

const LANGUAGES = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', ru: 'Russian', ja: 'Japanese',
  ko: 'Korean', zh: 'Chinese (Simplified)', ar: 'Arabic', hi: 'Hindi',
  tr: 'Turkish', nl: 'Dutch', pl: 'Polish', sv: 'Swedish',
  da: 'Danish', fi: 'Finnish', el: 'Greek', he: 'Hebrew',
  th: 'Thai', vi: 'Vietnamese', id: 'Indonesian', uk: 'Ukrainian',
  cs: 'Czech', hu: 'Hungarian', ro: 'Romanian', bn: 'Bengali',
  ta: 'Tamil', ur: 'Urdu', fa: 'Persian', sw: 'Swahili',
};

const FLAGS = {
  en:'🇬🇧', es:'🇪🇸', fr:'🇫🇷', de:'🇩🇪', it:'🇮🇹', pt:'🇵🇹',
  ru:'🇷🇺', ja:'🇯🇵', ko:'🇰🇷', zh:'🇨🇳', ar:'🇸🇦', hi:'🇮🇳',
  tr:'🇹🇷', nl:'🇳🇱', pl:'🇵🇱', sv:'🇸🇪', da:'🇩🇰', fi:'🇫🇮',
  el:'🇬🇷', he:'🇮🇱', th:'🇹🇭', vi:'🇻🇳', id:'🇮🇩', uk:'🇺🇦',
  cs:'🇨🇿', hu:'🇭🇺', ro:'🇷🇴', bn:'🇧🇩', ta:'🇮🇳', ur:'🇵🇰',
  fa:'🇮🇷', sw:'🇰🇪',
};

const POPULAR_TARGETS = ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ar', 'hi', 'pt', 'ru'];

export default function LanguageSelector({ config, setConfig, videoFile, videoPreview, onBack, onSubmit, error }) {
  const [showAllLangs, setShowAllLangs] = useState(false);
  const displayedLangs = showAllLangs ? Object.keys(LANGUAGES) : POPULAR_TARGETS;

  const formatBytes = (bytes) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={styles.wrapper}>
      {/* Video preview strip */}
      <div className={styles.videoStrip}>
        {videoPreview && (
          <video className={styles.videoThumb} src={videoPreview} muted playsInline />
        )}
        <div className={styles.videoMeta}>
          <div className={styles.videoName}>{videoFile?.name}</div>
          <div className={styles.videoSize}>{formatBytes(videoFile?.size || 0)}</div>
        </div>
        <button className={styles.changeBtn} onClick={onBack}>Change video</button>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>SOURCE LANGUAGE</div>
        <div className={styles.sourceRow}>
          <select
            className={styles.select}
            value={config.sourceLang}
            onChange={e => setConfig({ ...config, sourceLang: e.target.value })}
          >
            <option value="auto">🔍 Auto-detect (recommended)</option>
            {Object.entries(LANGUAGES).map(([code, name]) => (
              <option key={code} value={code}>{FLAGS[code] || '🌐'} {name}</option>
            ))}
          </select>
          <div className={styles.sourceNote}>Whisper AI will detect the spoken language automatically</div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>TRANSLATE TO</div>
        <div className={styles.langGrid}>
          {displayedLangs.map(code => (
            <button
              key={code}
              className={`${styles.langBtn} ${config.targetLang === code ? styles.langActive : ''}`}
              onClick={() => setConfig({ ...config, targetLang: code })}
            >
              <span className={styles.langFlag}>{FLAGS[code] || '🌐'}</span>
              <span className={styles.langName}>{LANGUAGES[code]}</span>
            </button>
          ))}
          <button className={styles.moreBtn} onClick={() => setShowAllLangs(!showAllLangs)}>
            {showAllLangs ? '▲ Show less' : `+ ${Object.keys(LANGUAGES).length - POPULAR_TARGETS.length} more`}
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionLabel}>SUBTITLE STYLE</div>
        <div className={styles.styleRow}>
          {[
            { value: 'burned', label: 'Burned In', desc: 'Subtitles permanently embedded in video', icon: '🔥' },
            { value: 'soft', label: 'Soft Subtitles', desc: 'Separate track, can be toggled on/off', icon: '💬' },
          ].map(opt => (
            <button
              key={opt.value}
              className={`${styles.styleCard} ${config.subtitleStyle === opt.value ? styles.styleActive : ''}`}
              onClick={() => setConfig({ ...config, subtitleStyle: opt.value })}
            >
              <span className={styles.styleIcon}>{opt.icon}</span>
              <div>
                <div className={styles.styleLabel}>{opt.label}</div>
                <div className={styles.styleDesc}>{opt.desc}</div>
              </div>
              {config.subtitleStyle === opt.value && <span className={styles.styleCheck}>✓</span>}
            </button>
          ))}
        </div>
      </div>

      {error && <div className={styles.error}>⚠ {error}</div>}

      <div className={styles.actions}>
        <button className={styles.backBtn} onClick={onBack}>← Back</button>
        <button className={styles.submitBtn} onClick={onSubmit}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="5 3 19 12 5 21 5 3"/>
          </svg>
          Start Translation
        </button>
      </div>

      <div className={styles.pipeline}>
        {['Extract Audio', 'Transcribe (Whisper)', 'Translate (Claude)', 'Render Video'].map((step, i) => (
          <div key={i} className={styles.pipeStep}>
            <div className={styles.pipeNum}>{i + 1}</div>
            <div className={styles.pipeLabel}>{step}</div>
            {i < 3 && <div className={styles.pipeArrow}>→</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
