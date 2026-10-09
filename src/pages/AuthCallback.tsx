import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';

import { supabase } from '../lib/supabase';
import './AuthCallback.css';

// Shared by both failure paths: the customer only needs to know it failed.
const EXCHANGE_FAILED = 'Could not complete sign in. Try again.';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const providerError = params.get('error');

    if (providerError) {
      // `||`, not `??`: an empty error_description is falsy, so `??` would store
      // '' and the ternary would fall through to the pending state.
      setError(
        params.get('error_description') ||
          'Sign in was cancelled. You can try again whenever you like.',
      );
      return;
    }

    const code = params.get('code');
    if (!code) {
      setError('Google did not return a sign in code. Try again.');
      return;
    }

    let active = true;
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error: exchangeError }) => {
        if (!active) return;
        if (exchangeError) {
          setError(EXCHANGE_FAILED);
          return;
        }
        // Held here rather than redirected, so the customer chooses where to land.
        setIsSignedIn(true);
      })
      // exchangeCodeForSession rejects on non-AuthError failures too: blocked or
      // full localStorage, failed client init.
      .catch(() => {
        if (active) setError(EXCHANGE_FAILED);
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
      <IonPage>
          <IonContent>
              <main className="trim-callback">
                  {error && (
                      <>
                          <p className="trim-callback__error">{error}</p>
                          <button
                              className="trim-callback__back"
                              type="button"
                              onClick={() => navigate("/home")}
                          >
                              Back to Trim
                          </button>
                      </>
                  )}

                  {!error && isSignedIn && (
                      <div className="trim-callback__panel">
                          <span className="trim-callback__tick" aria-hidden="true">
                              <svg viewBox="0 0 24 24" width="30" height="30" fill="none">
                                  <path
                                      d="M5 13l4.5 4.5L19 7"
                                      stroke="currentColor"
                                      strokeWidth="2.25"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                  />
                              </svg>
                          </span>

                          <h1 className="trim-callback__title">
                              You&apos;re signed in to Trim
                          </h1>

                          <p className="trim-callback__note">
                              Your Google account is connected. Next, choose a username for
                              your profile, then Trim will start matching styles to your face
                              shape.
                          </p>

                          <div className="trim-callback__actions">
                              <button
                                  className="trim-callback__primary"
                                  type="button"
                                  onClick={() =>
                                      navigate("/welcome", { replace: true })
                                  }
                              >
                                  Continue
                              </button>

                              <button
                                  className="trim-callback__back"
                                  type="button"
                                  onClick={() =>
                                      navigate("/home", { replace: true })
                                  }
                              >
                                  Back to Trim
                              </button>
                          </div>
                      </div>
                  )}

                  {!error && !isSignedIn && (
                      <p className="trim-callback__pending">Signing you in</p>
                  )}
              </main>
          </IonContent>
      </IonPage>
  );
};

export default AuthCallback;
