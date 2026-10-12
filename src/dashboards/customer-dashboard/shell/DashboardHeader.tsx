import { BackSquare, Bell } from 'reicon-react';

import { UNREAD_COUNT } from '../notifications';

interface DashboardHeaderProps {
  sectionLabel: string;
  isRailOpen: boolean;
  onToggleRail: () => void;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
}

/**
 * Header. The brand mark is the Tritopani script T in brand blue, echoing the
 * public nav. Right side carries the notification bell and the back-to-site
 * control, both icon-only.
 */
const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  sectionLabel,
  isRailOpen,
  onToggleRail,
  isPanelOpen,
  onTogglePanel,
}) => (
  <header className="trim-dash__bar">
    <button
      className="trim-dash__rail-toggle"
      type="button"
      aria-expanded={isRailOpen}
      aria-controls="trim-dash-rail"
      onClick={onToggleRail}
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
        <path
          d="M3 6h18M3 12h18M3 18h18"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
      <span className="trim-visually-hidden">
        {isRailOpen ? 'Close sections' : 'Open sections'}
      </span>
    </button>

    <span className="trim-dash__logo" aria-label="Trim">
      T
    </span>

    <span className="trim-dash__crumb">{sectionLabel}</span>

    <div className="trim-dash__actions">
      <button
        className={`trim-dash__icon-btn${isPanelOpen ? ' trim-dash__icon-btn--on' : ''}`}
        type="button"
        aria-expanded={isPanelOpen}
        aria-controls="trim-dash-notifications"
        onClick={onTogglePanel}
      >
        {/* Decorative: the count beside it carries the meaning. */}
        <Bell size={19} aria-hidden="true" />
        <span className="trim-dash__badge">{UNREAD_COUNT}</span>
        <span className="trim-visually-hidden">
          Notifications, {UNREAD_COUNT} unread
        </span>
      </button>

      <a className="trim-dash__icon-btn" href="/home" title="Back to site">
        <BackSquare size={19} aria-hidden="true" />
        <span className="trim-visually-hidden">Back to site</span>
      </a>
    </div>
  </header>
);

export default DashboardHeader;