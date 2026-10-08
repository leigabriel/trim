import { useEffect, useRef, useState } from 'react';

import './IntroOverlay.css';

interface IntroOverlayProps {
  progress: number;
  isModelReady: boolean;
  isWarm: boolean;
  onDone: () => void;
}

// The assets are far larger than the localStorage quota, so only a readiness
// marker is cached. Repeat visits rely on the HTTP cache for the bytes.
const CACHE_KEY = 'trim.models.ready';
const MIN_MS = 900;
const MAX_MS = 30000;

const IntroOverlay: React.FC<IntroOverlayProps> = ({ progress, isModelReady, isWarm, onDone }) => {
  const [isDone, setIsDone] = useState(false);
  // Held in a ref so the timers do not restart when the parent re-renders.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!isModelReady && !isWarm) return;

    try {
      window.localStorage.setItem(CACHE_KEY, new Date().toISOString());
    } catch {
      // Private mode or quota exceeded; the intro still works without it.
    }

    const done = () => {
      setIsDone(true);
      onDoneRef.current();
    };
    const id = window.setTimeout(done, MIN_MS);
    return () => window.clearTimeout(id);
  }, [isModelReady, isWarm]);

  // Never trap the user behind a stalled download.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setIsDone(true);
      onDoneRef.current();
    }, MAX_MS);
    return () => window.clearTimeout(id);
  }, []);

  if (isDone) return null;

  // Warm start jumps straight to full; otherwise show real load progress.
  const display = isWarm ? 100 : Math.min(100, Math.round(progress * 100));

  return (
    <div className="trim-intro">
      <img className="trim-intro__mark" src="/icon-intro.png" alt="" />

      <output className="trim-intro__number" aria-live="polite">
        {String(display).padStart(3, '0')}
      </output>
    </div>
  );
};

export default IntroOverlay;