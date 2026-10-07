import { useEffect, useRef, useState } from 'react';

import './Nav.css';

const NAV_LINKS = [
  { label: 'about', href: '#about' },
  { label: 'styles', href: '#styles' },
  { label: 'services', href: '#services' },
  { label: 'download app', href: '#download' },
];

/**
 * Site nav. Links sit inline on wide viewports and collapse behind a
 * toggle button below 48rem.
 */
const Nav: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  return (
    <header className={`trim-nav${isMenuOpen ? ' trim-nav--open' : ''}`}>
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
              <a
                className="trim-nav__link"
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Nav;