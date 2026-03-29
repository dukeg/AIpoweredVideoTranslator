import styles from './Header.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 10l-4 4 2 2 6-6-2-2z" fill="currentColor" opacity=".5"/>
              <path d="M3 10l4-4 2 2-4 4-2-2zM12 3l2 2-8 8-2-2 8-8z" fill="currentColor"/>
              <rect x="16" y="16" width="5" height="5" rx="1" fill="var(--accent)"/>
            </svg>
          </div>
          <span className={styles.logoText}>VideoTranslate<span className={styles.logoAi}>.AI</span></span>
        </div>
        <nav className={styles.nav}>
          <a href="https://platform.openai.com/docs/guides/speech-to-text" target="_blank" rel="noopener" className={styles.navLink}>Whisper Docs</a>
          <a href="https://docs.anthropic.com" target="_blank" rel="noopener" className={styles.navLink}>Claude API</a>
          <a href="https://github.com" target="_blank" rel="noopener" className={styles.navBtn}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
