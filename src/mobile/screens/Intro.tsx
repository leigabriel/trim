import { useEffect, useState } from 'react';

interface IntroProps {
  onDone: () => void;
}

const DURATION_MS = 2200;

/**
 * Cold-start animation.
 *
 * CSS only, no WebGL: the web intro loads Three.js models for its logo, and
 * pulling that onto a phone to draw one letter would cost more than the screen
 * it fills. Runs on every launch because a native splash is dismissed by the
 * system before React mounts, leaving a gap otherwise.
 */
const Intro: React.FC<IntroProps> = ({ onDone }) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const fade = setTimeout(() => setLeaving(true), DURATION_MS - 400);
    const done = setTimeout(onDone, DURATION_MS);

    return () => {
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [onDone]);

  return (
    <div className={`m-intro${leaving ? ' m-intro--out' : ''}`}>
      <span className="m-intro__mark">T</span>
      <span className="m-intro__word">Trim</span>
      <span className="m-intro__tag">Your best haircut</span>
    </div>
  );
};

export default Intro;