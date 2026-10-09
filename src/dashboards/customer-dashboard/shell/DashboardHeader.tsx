import { UNREAD_COUNT } from '../notifications';

interface DashboardHeaderProps {
  sectionLabel: string;
  isRailOpen: boolean;
  onToggleRail: () => void;
  isPanelOpen: boolean;
  onTogglePanel: () => void;
}

/**
 * Header. The brand mark is the Tritopani script T in brand orange, echoing the
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
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true">
          <path
            d="M18 9a6 6 0 10-12 0c0 5-2 6-2 6h16s-2-1-2-6M13.7 20a2 2 0 01-3.4 0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="trim-dash__badge">{UNREAD_COUNT}</span>
        <span className="trim-visually-hidden">
          Notifications, {UNREAD_COUNT} unread
        </span>
      </button>

      <a className="trim-dash__icon-btn" href="/home" title="Back to site">
        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true">
          <path
            d="M14 4h5v5M19 4l-8 8M10 5H5v14h14v-5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="trim-visually-hidden">Back to site</span>
      </a>
    </div>
  </header>
);

export default DashboardHeader;