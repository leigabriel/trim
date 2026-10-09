import { useState } from 'react';

import LocationModal from '../../layout/modals/LocationModal';
import { SHOP } from '../Location/shop';
import Keychain from './Keychain';
import { FOOTER_LINKS, SOCIAL_LINKS } from './data';
import './Footer.css';

const WORDMARK = 'Trim';

// Normal flow after the styles grid. A pinned back layer left it too little
// scroll travel to settle, which clipped the nav links.
const Footer: React.FC = () => {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <section className="trim-footer" aria-labelledby="trim-footer-title">
      <Keychain />

      <div className="trim-footer__inner">
        <nav className="trim-footer__nav" aria-label="Footer">
          {FOOTER_LINKS.map((link) => (
            <a className="trim-footer__link" href={link.href} key={link.index}>
              <span className="trim-footer__index" aria-hidden="true">
                {link.index}
              </span>
              <span className="trim-footer__label">{link.label}</span>
              <span className="trim-footer__hint" aria-hidden="true">
                View
              </span>
            </a>
          ))}
        </nav>

        <div className="trim-footer__base">
          <div className="trim-footer__socials">
            {SOCIAL_LINKS.map((link) => (
              <a
                className="trim-footer__social"
                href={link.href}
                key={link.label}
                target={link.label === 'email' ? undefined : '_blank'}
                rel="noopener noreferrer"
              >
                [{link.label}]
              </a>
            ))}
          </div>

          <h2 className="trim-footer__wordmark" id="trim-footer-title" aria-label="Trim">
            {WORDMARK.split('').map((char, index) => (
              <span className="trim-footer__char" key={index} aria-hidden="true">
                {char}
              </span>
            ))}
          </h2>
        </div>

        {/* Bottom right of the footer. Text only: the map is heavy to build, so
            it lives behind the button and mounts when the modal opens. */}
        <div className="trim-footer__foot">
          <div className="trim-footer__shop">
            <h3 className="trim-footer__shop-title">{SHOP.name}</h3>
            <p className="trim-footer__shop-branch">{SHOP.branch}</p>

            <dl className="trim-footer__shop-list">
              <div>
                <dt>Address</dt>
                <dd>{SHOP.address}</dd>
              </div>
              <div>
                <dt>Hours</dt>
                <dd>{SHOP.hours}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>
                  <a href={`tel:${SHOP.phone.replace(/\s/g, '')}`}>{SHOP.phone}</a>
                </dd>
              </div>
            </dl>

            <button
              className="trim-footer__shop-map"
              type="button"
              onClick={() => setIsMapOpen(true)}
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" aria-hidden="true">
                <path
                  d="M9 4L3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4zM9 4v13M15 6.5v13"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
              </svg>
              View on map
            </button>
          </div>
        </div>
      </div>

      <LocationModal isOpen={isMapOpen} onDismiss={() => setIsMapOpen(false)} />
    </section>
  );
};

export default Footer;