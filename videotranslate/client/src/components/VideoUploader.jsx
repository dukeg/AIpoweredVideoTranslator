import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './VideoUploader.module.css';

const ACCEPTED = { 'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.m4v'] };
const MAX_SIZE = 500 * 1024 * 1024; // 500MB

export default function VideoUploader({ onVideoSelected }) {
  const [error, setError] = useState('');

  const onDrop = useCallback((accepted, rejected) => {
    setError('');
    if (rejected.length > 0) {
      const err = rejected[0].errors[0];
      if (err.code === 'file-too-large') setError('File too large. Maximum size is 500MB.');
      else if (err.code === 'file-invalid-type') setError('Please upload a valid video file.');
      else setError(err.message);
      return;
    }
    if (accepted.length > 0) {
      const file = accepted[0];
      const url = URL.createObjectURL(file);
      onVideoSelected(file, url);
    }
  }, [onVideoSelected]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop, accept: ACCEPTED, maxSize: MAX_SIZE, multiple: false
  });

  return (
    <div className={styles.wrapper}>
      <div
        {...getRootProps()}
        className={`${styles.zone} ${isDragActive ? styles.active : ''} ${isDragReject ? styles.reject : ''}`}
      >
        <input {...getInputProps()} />
        <div className={styles.iconWrap}>
          <svg className={styles.icon} viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="31" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3"/>
            <path d="M26 22l16 10-16 10V22z" fill="var(--accent)" opacity=".9"/>
            <circle cx="32" cy="32" r="16" stroke="var(--accent)" strokeWidth="1" opacity=".2"/>
          </svg>
          {isDragActive && <div className={styles.pulse} />}
        </div>

        <div className={styles.label}>
          {isDragActive ? (
            <span className={styles.labelActive}>Drop video here</span>
          ) : (
            <>
              <span className={styles.labelMain}>Drop your video file</span>
              <span className={styles.labelSub}>or click to browse</span>
            </>
          )}
        </div>

        <div className={styles.formats}>
          {['MP4', 'MOV', 'AVI', 'MKV', 'WEBM', 'FLV'].map(f => (
            <span key={f} className={styles.formatTag}>{f}</span>
          ))}
          <span className={styles.formatTag} style={{ color: 'var(--text3)' }}>up to 500MB</span>
        </div>
      </div>

      {error && <div className={styles.error}>⚠ {error}</div>}

      <div className={styles.orDivider}>
        <span>or try with a sample</span>
      </div>

      <div className={styles.samples}>
        {[
          { label: 'Spanish News Clip', lang: 'Spanish', dur: '0:45' },
          { label: 'French Documentary', lang: 'French', dur: '1:12' },
          { label: 'Japanese Interview', lang: 'Japanese', dur: '0:58' },
        ].map((s, i) => (
          <button key={i} className={styles.sampleBtn} disabled title="Upload your own video to get started">
            <span className={styles.sampleIcon}>🎬</span>
            <span>
              <span className={styles.sampleLabel}>{s.label}</span>
              <span className={styles.sampleMeta}>{s.lang} · {s.dur}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
