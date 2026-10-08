import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../../auth/AuthProvider';
import LoginModal from './LoginModal';
import './Nav.css';

/** `tone` adapts the nav to the page behind it: the orange hero needs dark
 *  text, the black about page needs light text. */
interface NavProps {
  tone?: 'dark' | 'light';
}

/**
 * Site nav. Always fixed to the top of the viewport across every page, and no
 * longer hides on scroll. The single page link is derived from the current
 * route, so it always points at the other page rather than at itself.
 */
const Nav: React.FC<NavProps> = ({ tone = 'dark' }) => {
  const { session, profile } = useAuth();
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
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

  const closeMenu = () => setIsMenuOpen(false);

  const openLogin = () => {
    closeMenu();
    setIsLoginOpen(true);
  };

  // One link only, pointing at the page you are not already on.
  const isAbout = pathname.startsWith('/about');
  const pageLink = isAbout ? { to: '/home', label: 'home' } : { to: '/about', label: 'about' };

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
            <li>
              <Link className="trim-nav__link" to={pageLink.to} onClick={closeMenu}>
                {pageLink.label}
              </Link>
            </li>
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