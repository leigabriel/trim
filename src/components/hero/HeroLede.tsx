import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface HeroLedeProps {
  isEntered: boolean;
}

const WORDS = [
  'Oriental',
  'Mindoro',
  '-',
  'based',
  'barbershops',
  'specializing',
  'in',
  'the',
  'latest',
  'hair',
  'styles',
];

// Line-by-line reveal for the centred lede.
const HeroLede: React.FC<HeroLedeProps> = ({ isEntered }) => {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const frag = document.createDocumentFragment();
    WORDS.forEach((word, index) => {
      // Mask wraps only the word; the space sits outside it so it is never clipped.
      const mask = document.createElement('span');
      mask.className = 'trim-hero__lede-mask';
      const inner = document.createElement('span');
      inner.className = 'trim-hero__lede-word';
      inner.textContent = word;
      mask.appendChild(inner);
      frag.appendChild(mask);
      if (index < WORDS.length - 1) frag.appendChild(document.createTextNode(' '));
    });
    node.replaceChildren(frag);

    if (!isEntered || reduced) return;

    const targets = node.querySelectorAll('.trim-hero__lede-word');
    const context = gsap.context(() => {
      gsap.fromTo(
        targets,
        { yPercent: 110, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: 'power3.out',
          stagger: 0.07,
          delay: 0.15,
        },
      );
    }, node);

    return () => context.revert();
  }, [isEntered]);

  return <p className="trim-hero__lede" ref={ref} aria-label={WORDS.join(' ')} />;
};

export default HeroLede;