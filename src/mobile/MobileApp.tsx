import { useEffect, useState } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';

import { useAuth } from '../auth/AuthProvider';
import Account from './screens/Account';
import Camera from './screens/Camera';
import FaceShape from './screens/FaceShape';
import Home from './screens/Home';
import Intro from './screens/Intro';
import Login from './screens/Login';
import Recommendation from './screens/Recommendation';
import Trimo from './screens/Trimo';
import BottomNav from './shell/BottomNav';
import TopBar from './shell/TopBar';

export const MOBILE_TABS = ['/home', '/recommendation', '/face-shape', '/account'] as const;

const isTab = (path: string): boolean =>
  (MOBILE_TABS as readonly string[]).includes(path);

/**
 * Flow: intro, then the login sheet unless a session already exists, then the
 * app. Rendered as one switch rather than routes because the intro must be able
 * to run on a cold start where the router has nothing to restore.
 */
const MobileApp: React.FC = () => {
  const { session, isLoading } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'intro' | 'auth' | 'app'>('intro');

  useEffect(() => {
    // Only a settled auth read decides. Routing while isLoading is true sends a
    // returning customer to the login sheet for a frame.
    if (isLoading || phase === 'intro') return;
    setPhase(session ? 'app' : 'auth');
  }, [isLoading, session, phase]);

  // Hardware back closes the app from the root rather than exiting mid-flow.
  useEffect(() => {
    const handle = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
        return;
      }
      if (phase === 'app') void CapacitorApp.exitApp();
    });

    return () => {
      void handle.then((listener) => listener.remove());
    };
  }, [phase]);

  if (phase === 'intro') return <Intro onDone={() => setPhase('auth')} />;

  if (phase === 'auth') return <Login onDone={() => setPhase('app')} />;

  return (
    <div className="m-shell">
      <TopBar />

      <main className="m-main">
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/recommendation" element={<Recommendation />} />
          <Route path="/face-shape" element={<FaceShape />} />
          <Route path="/account" element={<Account />} />
          <Route path="/ai" element={<Trimo />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      {/* Hidden on the two top-bar destinations, which are tasks rather than
          places you sit in. */}
      <BottomNav hidden={!isTab(window.location.pathname)} onSelect={(path) => navigate(path)} />
    </div>
  );
};

export default MobileApp;