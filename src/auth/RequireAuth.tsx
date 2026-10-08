import type { ReactNode } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { Navigate } from 'react-router-dom';

import { useAuth } from './AuthProvider';

interface RequireAuthProps {
  children: ReactNode;
  /** Route to /welcome when the profile has no username yet. */
  requireUsername?: boolean;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, requireUsername }) => {
  const { session, profile, isLoading } = useAuth();

  // Must not redirect while loading, or a hard refresh on a protected route
  // bounces a signed-in customer to /home before the session is read.
  // Renders an ion-page shell because this guard is a route element and
  // IonRouterOutlet expects one.
  if (isLoading) {
    return (
      <IonPage>
        <IonContent>
          <div className="trim-guard" aria-busy="true">
            <span className="trim-visually-hidden">Loading</span>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!session) return <Navigate to="/home" replace />;

  if (requireUsername && !profile?.username) {
    return <Navigate to="/welcome" replace />;
  }

  return <>{children}</>;
};