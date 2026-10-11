import { useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';

import ChatView from './ai/ChatView';
import ConversationList from './ai/ConversationList';
import { useConversations } from './ai/useConversations';
import { useFaceProfile } from './face/useFaceProfile';
import { DASHBOARD_NAV, FEED_BY_VIEW } from './data';
import type { DashboardView, FeedItem } from './data';
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
  const [trimoPrompt, setTrimoPrompt] = useState<string | null>(null);
  // The scanner is owned by FaceShape rather than lifted here, because lifting
  // it would keep the camera running after the customer navigated away. Its log
  // is handed up instead, for the activity column to render.
  const [scanEntries, setScanEntries] = useState<FeedItem[]>([]);

  // Mounted unconditionally so a chat in progress survives switching sections.
  const chat = useConversations();
  // Shared, so a scan that lands in FaceShape is already reflected in Profile
  // and Recommendation when the customer clicks through. Three sections reading
  // independently is how a just-saved shape shows up as "not set" next screen.
  const face = useFaceProfile();

  const select = (next: DashboardView) => {
    setView(next);
    setIsRailOpen(false);
  };

  /** Carries a question from FaceShape into Trimo rather than asking again. */
  const askTrimo = (prompt: string) => {
    setTrimoPrompt(prompt);
    select('ai');
  };

  const current = DASHBOARD_NAV.find((item) => item.id === view);
  const isAccount = view === 'account';
  const isAi = view === 'ai';
  const isFaceShape = view === 'face-shape';
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
              /* On Face Shape the feed narrates the scanner rather than showing
                 generic filler, so the column describes what is actually
                 happening on screen. */
              isFaceShape && scanEntries.length > 0 ? (
                <ActivityFeed label={sectionLabel} items={scanEntries} />
              ) : (
                <ActivityFeed label={sectionLabel} items={FEED_BY_VIEW[view]} />
              )
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
                <Account face={face} onAnalyzeFace={() => select('face-shape')} />
              ) : isAi ? (
                <ChatView chat={chat} pendingPrompt={trimoPrompt} />
              ) : (
                <div className="trim-section">
                  {view === 'overview' ? (
                    <Overview
                      face={face}
                      conversations={chat.conversations}
                      onAnalyzeFace={() => select('face-shape')}
                      onOpenAi={() => select('ai')}
                    />
                  ) : null}
                  {view === 'recommendation' ? (
                    <Recommendation
                      face={face}
                      onSetFace={() => select('account')}
                    />
                  ) : null}
                  {view === 'face-shape' ? (
                    <FaceShape
                      profile={face}
                      onAskTrimo={askTrimo}
                      onScanEntries={setScanEntries}
                    />
                  ) : null}
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