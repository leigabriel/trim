import { useEffect, useState } from 'react';

import './IntroOverlay.css';

interface IntroOverlayProps {
  onDone: () => void;
}

const IntroOverlay: React.FC<IntroOverlayProps> = ({ onDone }) => {
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    // Safety net in case the animation never fires its end event.
    const timer = window.setTimeout(() => {
      setIsDone(true);
      onDone();
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  if (isDone) return null;

  return (
    <div
      className="trim-intro"
      onAnimationEnd={(event) => {
        if (event.target !== event.currentTarget) return;
        setIsDone(true);
        onDone();
      }}
    >
      <img className="trim-intro__mark" src="/icon-intro.png" alt="" />
    </div>
  );
};

export default IntroOverlay;