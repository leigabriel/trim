import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from '../auth/AuthProvider';
import '../theme/fonts.css';
import '../theme/variables.css';
import MobileApp from './MobileApp';
import './mobile.css';

/**
 * Native entry.
 *
 * Plain React Router rather than IonReactRouter: the shell is four bottom-nav
 * destinations and a top bar, and the web build already carries Ionic for the
 * marketing site. Keeping it out means the APK never downloads ionicons or the
 * Ionic router for a layout this simple.
 */
const container = document.getElementById('root');
if (!container) throw new Error('Missing #root');

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MobileApp />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);