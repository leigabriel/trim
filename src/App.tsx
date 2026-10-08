import { useState } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { AuthProvider } from './auth/AuthProvider';
import { RequireAuth } from './auth/RequireAuth';
import IntroOverlay from './components/layout/IntroOverlay';
import About from './pages/About';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Welcome from './pages/Welcome';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
import '@ionic/react/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

setupIonicReact();

// The model assets exceed the localStorage quota, so this only records that
// they have been fetched once. The HTTP cache handles the bytes.
const MODEL_CACHE_KEY = 'trim.models.ready';

const HomeRoute: React.FC<{
  isEntered: boolean;
  onProgress: (ratio: number) => void;
  onModelsReady: () => void;
}> = ({ isEntered, onProgress, onModelsReady }) => (
  <Home isEntered={isEntered} onProgress={onProgress} onModelsReady={onModelsReady} />
);

/** Owns the loading state, which only the home page has anything to load. */
const HomeWithLoader: React.FC = () => {
  const [isEntered, setIsEntered] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isModelReady, setIsModelReady] = useState(false);
  const [isWarm] = useState(() => {
    try {
      return window.localStorage.getItem(MODEL_CACHE_KEY) !== null;
    } catch {
      return false;
    }
  });

  const handleReady = () => {
    setProgress(1);
    setIsModelReady(true);
  };

  return (
    <>
      <IntroOverlay
        progress={progress}
        isModelReady={isModelReady}
        isWarm={isWarm}
        onDone={() => setIsEntered(true)}
      />

      <HomeRoute
        isEntered={isEntered}
        onProgress={setProgress}
        onModelsReady={handleReady}
      />
    </>
  );
};

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      {/* Inside IonReactRouter, not outside: AuthProvider calls useNavigate,
          which needs a Router ancestor. */}
      <AuthProvider>
        <IonRouterOutlet>
          {/* The intro overlay lives inside the home route: it waits on the hero
              models, and on any other page nothing would ever flip them, so it
              sat over the content until its own timeout fired. */}
          <Route path="/home" element={<HomeWithLoader />} />
          <Route path="/about" element={<About />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/welcome" element={<Welcome />} />
          {/* Dashboard is an IonPage and RequireAuth is not, so the guard sits
              outside it here rather than wrapping it inside its IonContent. */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth requireUsername>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </IonRouterOutlet>
      </AuthProvider>
    </IonReactRouter>
  </IonApp>
);

export default App;