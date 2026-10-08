import { useEffect, useRef, useState } from 'react';

import LoginModal from './LoginModal';
import './Nav.css';

const NAV_LINKS = [{ label: 'about', href: '#about' }];

/**
 * Site nav. Fixed to the viewport so it survives every home section, but it
 * only reads while the hero is on screen: once you scroll from hero to styles
 * it slides away, and it returns when the hero comes back.
 */
const Nav: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Escape closes the panel and returns focus to the toggle.
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsMenuOpen(false);
      toggleRef.current?.focus();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  // Hides only once the hero has fully left the viewport, so the nav still
  // covers the hero to about hand-off.
  useEffect(() => {
    const hero = document.querySelector('.trim-hero');
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isPast = entry.boundingClientRect.bottom <= 0;
        setIsHidden(isPast);
        if (isPast) setIsMenuOpen(false);
      },
      { threshold: 0 },
    );
    observer.observe(hero);

    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setIsMenuOpen(false);

  const openLogin = () => {
    closeMenu();
    setIsLoginOpen(true);
  };

  return (
    <>
      <header className={`trim-nav${isMenuOpen ? ' trim-nav--open' : ''}${isHidden ? ' trim-nav--hidden' : ''}`}>
        <a className="trim-nav__brand" href="/home" aria-label="Trim, home">
          <span aria-hidden="true">T</span>
        </a>

        <button
          ref={toggleRef}
          className="trim-nav__toggle"
          type="button"
          aria-expanded={isMenuOpen}
          aria-controls="trim-nav-menu"
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          <span className="trim-nav__toggle-icon" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="trim-visually-hidden">{isMenuOpen ? 'Close menu' : 'Open menu'}</span>
        </button>

        <nav className="trim-nav__menu" id="trim-nav-menu" aria-label="Main">
          <ul className="trim-nav__links">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a className="trim-nav__link" href={link.href} onClick={closeMenu}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <button className="trim-nav__link trim-nav__link--button" type="button" onClick={openLogin}>
                login
              </button>
            </li>
          </ul>
        </nav>
      </header>

      <LoginModal isOpen={isLoginOpen} onDismiss={() => setIsLoginOpen(false)} />
    </>
  );
};

export default Nav;