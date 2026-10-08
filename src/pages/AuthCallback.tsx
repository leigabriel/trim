import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonContent, IonPage } from '@ionic/react';

import { supabase } from '../lib/supabase';
import './AuthCallback.css';

// Shared by the rejected exchange and the AuthError exchange: the customer only
// needs to know it did not work, never which Supabase error caused it.
const EXCHANGE_FAILED = 'Could not complete sign in. Try again.';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const providerError = params.get('error');

    if (providerError) {
      // `||`, not `??`: a provider can send error_description with an empty
      // value, and '' is falsy, so `??` would store an empty string and the
      // render ternary would fall through to the pending state.
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
        navigate('/home', { replace: true });
      })
      // exchangeCodeForSession rejects on non-AuthError failures: blocked or
      // full localStorage, a failed client init. Unhandled, that strands the
      // customer on "Signing you in" with no way forward.
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
          {error ? (
            <>
              <p className="trim-callback__error">{error}</p>
              <button
                className="trim-callback__back"
                type="button"
                onClick={() => navigate('/home')}
              >
                Back to Trim
              </button>
            </>
          ) : (
            <p className="trim-callback__pending">Signing you in</p>
          )}
        </main>
      </IonContent>
    </IonPage>
  );
};

export default AuthCallback;
