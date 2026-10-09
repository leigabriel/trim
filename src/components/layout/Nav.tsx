import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from '../../auth/AuthProvider';
import LoginModal from './LoginModal';
import './Nav.css';

/** `tone` matches the page behind the nav: dark text on the hero, light on black. */
interface NavProps {
  tone?: 'dark' | 'light';
}

/**
 * Site nav. Fixed to the top of the viewport and never hides on scroll. There
 * is no second page to link to, so the menu carries the account entry only.
 */
const Nav: React.FC<NavProps> = ({ tone = 'dark' }) => {
  const { session, profile } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Escape closes the panel and restores focus to the toggle.
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

  const closeMenu = () => setIsMenuOpen(false);

  const openLogin = () => {
    closeMenu();
    setIsLoginOpen(true);
  };

  return (
    <>
      <header
        className={`trim-nav trim-nav--${tone}${isMenuOpen ? ' trim-nav--open' : ''}`}
      >
        <Link className="trim-nav__brand" to="/home" aria-label="Trim, home" onClick={closeMenu}>
          <span aria-hidden="true">T</span>
        </Link>

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
            {session ? (
              <li>
                <Link
                  className="trim-nav__avatar"
                  to="/dashboard"
                  aria-label={`Dashboard, signed in as ${profile?.username ?? profile?.displayName ?? 'your account'}`}
                  onClick={closeMenu}
                >
                  {profile?.avatarUrl ? (
                    <img src={profile.avatarUrl} alt="" />
                  ) : (
                    <span aria-hidden="true">
                      {(profile?.username ?? '?').charAt(0).toUpperCase()}
                    </span>
                  )}
                </Link>
              </li>
            ) : (
              <li>
                <button
                  className="trim-nav__link trim-nav__link--button"
                  type="button"
                  onClick={openLogin}
                >
                  login
                </button>
              </li>
            )}
          </ul>
        </nav>
      </header>

      <LoginModal isOpen={isLoginOpen} onDismiss={() => setIsLoginOpen(false)} />
    </>
  );
};

export default Nav;