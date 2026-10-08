import { IonContent, IonPage } from '@ionic/react';

import Nav from '../components/layout/Nav';
import { useAuth } from '../auth/AuthProvider';
import './Dashboard.css';

// Protected by RequireAuth at the route level in src/App.tsx, not here: the
// guard must run before this IonPage mounts so a signed-out visitor never sees
// the nav flash.
const Dashboard: React.FC = () => {
  const { profile, session, signOut } = useAuth();
  const name = profile?.username ?? profile?.displayName ?? 'Guest';
  const initial = name.charAt(0).toUpperCase();

  return (
    <IonPage>
      {/* Light tone: the page behind the nav is black. */}
      <Nav tone="light" />

      <IonContent>
        <div className="trim-dashboard">
          <header className="trim-dashboard__bar">
            <span className="trim-dashboard__brand">Trim</span>
          </header>

          <div className="trim-dashboard__body">
            <aside className="trim-dashboard__side">
              {profile?.avatarUrl ? (
                <img className="trim-dashboard__avatar" src={profile.avatarUrl} alt="" />
              ) : (
                <span className="trim-dashboard__initial" aria-hidden="true">
                  {initial}
                </span>
              )}

              <p className="trim-dashboard__name">{name}</p>
              <p className="trim-dashboard__email">{session?.user.email}</p>

              <button className="trim-dashboard__signout" type="button" onClick={signOut}>
                Sign out
              </button>
            </aside>

            <main className="trim-dashboard__main" aria-label="Dashboard" />
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Dashboard;