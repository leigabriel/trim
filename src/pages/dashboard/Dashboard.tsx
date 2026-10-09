import { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';

import { AccountDetail, AccountRail } from './Account';
import Overview from './Overview';
import Section from './Section';
import { DASHBOARD_NAV, FEED_BY_VIEW } from './data';
import type { DashboardView } from './data';
import './Dashboard.css';

/**
 * Three column shell: header, rail of section links, middle feed, section.
 * Account is not in the nav list; it opens from the identity block at the foot
 * of the rail.
 *
 * No site Nav here: this is an app surface, not a marketing page.
 */
const Dashboard: React.FC = () => {
  const [view, setView] = useState<DashboardView>('overview');
  const [isRailOpen, setIsRailOpen] = useState(false);

  const select = (next: DashboardView) => {
    setView(next);
    setIsRailOpen(false);
  };

  const current = DASHBOARD_NAV.find((item) => item.id === view);
  const feed = view === 'account' ? [] : FEED_BY_VIEW[view];

  return (
    <IonPage>
      <IonContent>
        <div className="trim-dash">
          <header className="trim-dash__bar">
            <button
              className="trim-dash__rail-toggle"
              type="button"
              aria-expanded={isRailOpen}
              aria-controls="trim-dash-rail"
              onClick={() => setIsRailOpen((open) => !open)}
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

            <a className="trim-dash__logo" href="/">
              Trim
            </a>

            <span className="trim-dash__crumb">
              {view === 'account' ? 'Account' : current?.label}
            </span>

            <a className="trim-dash__home" href="/">
              Back to site
            </a>
          </header>

          {/* A hidden grid item still occupies its track, which crushed the main
              pane on Account. */}
          <div
            className={`trim-dash__grid${
              view === 'account' ? ' trim-dash__grid--no-feed' : ''
            }`}
          >
            <aside
              className={`trim-dash__rail${isRailOpen ? ' trim-dash__rail--open' : ''}`}
              id="trim-dash-rail"
            >
              <nav className="trim-dash__nav" aria-label="Dashboard sections">
                <ul className="trim-dash__sections">
                  {DASHBOARD_NAV.map((item) => {
                    const isCurrent = view === item.id;

                    return (
                      <li key={item.id}>
                        <button
                          className={`trim-dash__link${
                            isCurrent ? ' trim-dash__link--current' : ''
                          }`}
                          type="button"
                          aria-current={isCurrent ? 'page' : undefined}
                          onClick={() => select(item.id)}
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

                          <span className="trim-dash__link-text">
                            <span className="trim-dash__link-label">{item.label}</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <AccountRail isCurrent={view === 'account'} onOpen={() => select('account')} />
            </aside>

            {/* Middle feed. Hidden on the account view, which has no feed. */}
            <div
              className="trim-dash__feed"
              hidden={view === 'account'}
              aria-label={`${current?.label} activity`}
            >
              <p className="trim-dash__feed-title">Activity</p>

              <ul>
                {feed.map((item) => (
                  <li className="trim-dash__entry" key={item.id}>
                    <p className="trim-dash__entry-meta">{item.meta}</p>
                    <h2 className="trim-dash__entry-title">{item.title}</h2>
                    <p className="trim-dash__entry-body">{item.body}</p>
                  </li>
                ))}
              </ul>
            </div>

            <main className="trim-dash__main">
              <div className="trim-section">
                {view === 'account' ? (
                  <AccountDetail />
                ) : view === 'overview' ? (
                  <Overview />
                ) : (
                  <Section view={view} />
                )}
              </div>
            </main>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;