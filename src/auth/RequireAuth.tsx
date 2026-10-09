import type { ReactNode } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { Navigate } from 'react-router-dom';

import { useAuth } from './AuthProvider';

interface RequireAuthProps {
  children: ReactNode;
  /** Route to /welcome while the profile has no username. */
  requireUsername?: boolean;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({ children, requireUsername }) => {
  const { session, profile, isLoading } = useAuth();

  // No redirect while loading, or a hard refresh bounces a signed-in customer
  // to /home. The ion-page shell is required: IonRouterOutlet expects one.
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