import { useEffect, useRef } from 'react';
import { createAnimation } from '@ionic/core';

import './About.css';

// Plays once, when the hero has scrolled clear. The section is pinned behind
// the hero and never enters the viewport on its own.
const About: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const hasPlayed = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const eyebrow = section.querySelector<HTMLElement>('.trim-about__eyebrow');
    const copy = section.querySelector<HTMLElement>('.trim-about__copy');
    if (!eyebrow || !copy) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      eyebrow.style.opacity = '1';
      copy.style.opacity = '1';
      eyebrow.style.transform = 'none';
      copy.style.transform = 'none';
      return;
    }

    const animations = [
      createAnimation()
        .addElement(eyebrow)
        .duration(700)
        .easing('cubic-bezier(0.22, 1, 0.36, 1)')
        .keyframes([
          { offset: 0, opacity: 0, transform: 'translateY(22px)' },
          { offset: 1, opacity: 1, transform: 'translateY(0)' },
        ]),
      createAnimation()
        .addElement(copy)
        .duration(800)
        .delay(110)
        .easing('cubic-bezier(0.22, 1, 0.36, 1)')
        .keyframes([
          { offset: 0, opacity: 0, transform: 'translateY(30px)' },
          { offset: 1, opacity: 1, transform: 'translateY(0)' },
        ]),
    ];

    let observer: IntersectionObserver | null = null;

    const play = () => {
      if (hasPlayed.current) return;
      hasPlayed.current = true;
      observer?.disconnect();
      // The animations must survive completion: destroying them here would drop
      // the final keyframe and snap the copy back to its hidden CSS state.
      animations.forEach((animation) => void animation.play());
    };

    const hero = document.querySelector('.trim-hero');
    if (!hero) {
      play();
      return () => animations.forEach((a) => a.destroy());
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 0.5) play();
      },
      { threshold: [0, 0.5, 1] },
    );
    observer.observe(hero);

    return () => {
      observer.disconnect();
      animations.forEach((a) => a.destroy());
    };
  }, []);

  return (
    <section className="trim-about" id="about" aria-labelledby="trim-about-title" ref={sectionRef}>
      <img className="trim-about__mark" src="/assets/ui/T.png" alt="" aria-hidden="true" />

      <p className="trim-about__eyebrow">Who we are?</p>

      <h2 className="trim-about__copy" id="trim-about-title">
        Trim is a hairstyle discovery and recommendation application designed to help
        customers find hairstyles that complement their face shape, hair type, and hair
        length.
      </h2>
    </section>
  );
};

export default About;