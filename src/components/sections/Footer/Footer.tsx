import Keychain from './Keychain';
import { FOOTER_LINKS, SOCIAL_LINKS } from './data';
import './Footer.css';

const WORDMARK = 'Trim';

// Sits after the styles grid in normal flow. Deliberately not a pinned back
// layer: sticking it behind styles left it with too little scroll travel to
// settle, so it clipped its own nav links.
const Footer: React.FC = () => (
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
    </div>
  </section>
);

export default Footer;