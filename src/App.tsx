import { useState } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import IntroOverlay from './components/layout/IntroOverlay';
import Home from './pages/Home';

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

const App: React.FC = () => {
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
    <IonApp>
      <IntroOverlay
        progress={progress}
        isModelReady={isModelReady}
        isWarm={isWarm}
        onDone={() => setIsEntered(true)}
      />
      <IonReactRouter>
        <IonRouterOutlet>
          <Route
            path="/home"
            element={
              <Home
                isEntered={isEntered}
                onProgress={setProgress}
                onModelsReady={handleReady}
              />
            }
          />
          <Route path="/" element={<Navigate to="/home" replace />} />
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
