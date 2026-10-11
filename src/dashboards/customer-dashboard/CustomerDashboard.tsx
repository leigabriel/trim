import { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';

import ChatView from './ai/ChatView';
import ConversationList from './ai/ConversationList';
import { useConversations } from './ai/useConversations';
import { DASHBOARD_NAV, FEED_BY_VIEW } from './data';
import type { DashboardView } from './data';
import Account from './sections/Account';
import Booking from './sections/Booking';
import FaceShape from './sections/FaceShape';
import Overview from './sections/Overview';
import Recommendation from './sections/Recommendation';
import ActivityFeed from './shell/ActivityFeed';
import DashboardHeader from './shell/DashboardHeader';
import DashboardRail from './shell/DashboardRail';
import NotificationPanel from './shell/NotificationPanel';
import './CustomerDashboard.css';

/**
 * Customer dashboard. Three column shell: rail, activity feed, section.
 * Account has no feed, so its track is dropped from the grid.
 *
 * No site Nav here: this is an app surface, not a marketing page.
 */
const CustomerDashboard: React.FC = () => {
  const [view, setView] = useState<DashboardView>('overview');
  const [isRailOpen, setIsRailOpen] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Mounted unconditionally so a chat in progress survives switching sections.
  const chat = useConversations();

  const select = (next: DashboardView) => {
    setView(next);
    setIsRailOpen(false);
  };

  const current = DASHBOARD_NAV.find((item) => item.id === view);
  const isAccount = view === 'account';
  const isAi = view === 'ai';
  const sectionLabel = isAccount ? 'Account' : (current?.label ?? '');

  return (
    <IonPage>
      <IonContent>
        <div className="trim-dash">
          <DashboardHeader
            sectionLabel={sectionLabel}
            isRailOpen={isRailOpen}
            onToggleRail={() => setIsRailOpen((open) => !open)}
            isPanelOpen={isPanelOpen}
            onTogglePanel={() => setIsPanelOpen((open) => !open)}
          />

          {/* A hidden grid item still occupies its track, which crushed the main
              pane on Account. The track is removed instead. */}
          <div className={`trim-dash__grid${isAccount ? ' trim-dash__grid--wide' : ''}`}>
            <DashboardRail view={view} onSelect={select} isOpen={isRailOpen} />

            {/* AI swaps the activity feed for the customer's own chat list. */}
            {isAi ? (
              <ConversationList chat={chat} />
            ) : !isAccount ? (
              <ActivityFeed label={sectionLabel} items={FEED_BY_VIEW[view]} />
            ) : null}

            <main
              className={`trim-dash__main${
                isAccount
                  ? ' trim-dash__main--centred'
                  : isAi
                    ? ' trim-dash__main--flush'
                    : ''
              }`}
            >
              {/* Account owns its own centring, so it sits outside the
                  width-capped .trim-section wrapper the data sections use.
                  Chat fills the pane edge to edge, for the same reason. */}
              {isAccount ? (
                <Account />
              ) : isAi ? (
                <ChatView chat={chat} />
              ) : (
                <div className="trim-section">
                  {view === 'overview' ? <Overview /> : null}
                  {view === 'recommendation' ? <Recommendation /> : null}
                  {view === 'face-shape' ? <FaceShape /> : null}
                  {view === 'booking' ? <Booking /> : null}
                </div>
              )}
            </main>
          </div>

          <NotificationPanel
            isOpen={isPanelOpen}
            onClose={() => setIsPanelOpen(false)}
          />
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CustomerDashboard;