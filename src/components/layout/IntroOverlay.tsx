import { useEffect, useRef, useState } from 'react';

import './IntroOverlay.css';

interface IntroOverlayProps {
  onDone: () => void;
}

// Fixed length. Not tied to model loading: the hero assets are tens of
// megabytes, so the wait would be unpredictable on a cold cache.
const DURATION_MS = 3000;

/** Eased ramp, so the counter settles rather than ticking linearly. */
const ease = (t: number) => 1 - (1 - t) ** 3;

const IntroOverlay: React.FC<IntroOverlayProps> = ({ onDone }) => {
  const [display, setDisplay] = useState(0);
  // The overlay is fixed and covers the app, so it must unmount itself.
  // Firing onDone is not enough: the parent only flips the hero's flag, and
  // the overlay keeps painting over everything.
  const [isDone, setIsDone] = useState(false);

  // Refs, so a parent re-render does not restart the animation.
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const finishRef = useRef<() => void>(() => {});
  finishRef.current = () => {
    setIsDone(true);
    onDoneRef.current();
  };

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(100);
      finishRef.current();
      return;
    }

    const start = performance.now();
    let frame = 0;

    const tick = () => {
      const elapsed = performance.now() - start;
      const ratio = Math.min(1, elapsed / DURATION_MS);
      setDisplay(Math.round(ease(ratio) * 100));

      if (ratio < 1) {
        frame = requestAnimationFrame(tick);
        return;
      }
      finishRef.current();
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  if (isDone) return null;

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