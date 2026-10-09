import { useAuth } from '../../../auth/AuthProvider';
import type { DashboardView } from '../data';
import { DASHBOARD_NAV } from '../data';

interface DashboardRailProps {
  view: DashboardView;
  onSelect: (next: DashboardView) => void;
  isOpen: boolean;
}

/**
 * Left rail: the section links, then the identity block pinned to the foot.
 * The identity block is the only route into Account, since the section is
 * absent from the nav list above.
 */
const DashboardRail: React.FC<DashboardRailProps> = ({ view, onSelect, isOpen }) => {
  const { session, profile, signOut } = useAuth();

  const name = profile?.username ?? profile?.displayName ?? 'Guest';
  const initial = name.charAt(0).toUpperCase();
  const isAccount = view === 'account';

  return (
    <aside
      className={`trim-dash__rail${isOpen ? ' trim-dash__rail--open' : ''}`}
      id="trim-dash-rail"
    >
      <nav className="trim-dash__nav" aria-label="Dashboard sections">
        <ul className="trim-dash__sections">
          {DASHBOARD_NAV.map((item) => {
            const isCurrent = view === item.id;

            return (
              <li key={item.id}>
                <button
                  className={`trim-dash__link${isCurrent ? ' trim-dash__link--current' : ''}`}
                  type="button"
                  aria-current={isCurrent ? 'page' : undefined}
                  onClick={() => onSelect(item.id)}
                >
                  <svg
                    className="trim-dash__link-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d={item.icon}
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                  <span className="trim-dash__link-label">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={`trim-dash__identity${isAccount ? ' trim-dash__identity--current' : ''}`}>
        <button
          className="trim-dash__identity-open"
          type="button"
          onClick={() => onSelect('account')}
          aria-current={isAccount ? 'page' : undefined}
        >
          {profile?.avatarUrl ? (
            <img className="trim-dash__identity-avatar" src={profile.avatarUrl} alt="" />
          ) : (
            <span className="trim-dash__identity-initial" aria-hidden="true">
              {initial}
            </span>
          )}

          <span className="trim-dash__identity-text">
            <span className="trim-dash__identity-name">{name}</span>
            <span className="trim-dash__identity-email">{session?.user.email}</span>
          </span>
        </button>

        <button className="trim-dash__identity-out" type="button" onClick={signOut}>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default DashboardRail;