import { useEffect, useState } from 'react';

import { useAuth } from '../../auth/AuthProvider';
import {
  normaliseEmail,
  validateCode,
  validateRegistration,
} from '../../auth/credentials';
import type { RegistrationErrors } from '../../auth/credentials';
import { normaliseUsername, validateUsername } from '../../auth/username';
import { consumeLaunchRedirect, watchForOAuthRedirect } from '../auth/oauth';

interface LoginProps {
  onDone: () => void;
}

type Tab = 'signin' | 'create';

const Login: React.FC<LoginProps> = ({ onDone }) => {
  const { register, verifyEmailCode, resendEmailCode, signInWithPassword, signInWithGoogle, isUsernameTaken } =
    useAuth();

  const [tab, setTab] = useState<Tab>('signin');
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreed, setAgreed] = useState(false);

  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [fieldErrors, setFieldErrors] = useState<RegistrationErrors>({});
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [resent, setResent] = useState<string | null>(null);

  // Deep link comes back while this screen is still mounted.
  useEffect(() => {
    let handle: { remove: () => Promise<void> } | null = null;
    void watchForOAuthRedirect(setError).then((listener) => {
      handle = listener;
    });
    return () => {
      void handle?.remove();
    };
  }, []);

  // Cold start that began at the redirect link.
  useEffect(() => {
    void consumeLaunchRedirect(setError);
  }, []);

  const requireConsent = (): boolean => {
    if (agreed) return true;
    setError('Agree to the Terms and Privacy Policy first.');
    return false;
  };

  const handleGoogle = async () => {
    if (!requireConsent()) return;

    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      // The app leaves for Google here. The deep link handler takes it from
      // there, so this screen never learns the outcome.
    } catch {
      setBusy(false);
      setError('Could not start Google sign in. Try again.');
    }
  };

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireConsent()) return;

    setError(null);
    setBusy(true);
    const result = await signInWithPassword(normaliseEmail(signInEmail), signInPassword);
    setBusy(false);

    if (result.ok) onDone();
    else setError(result.error);
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!requireConsent()) return;

    setError(null);
    setFieldErrors({});

    const result = validateRegistration({ email, username, password, confirmation }, validateUsername);
    if (!result.ok) {
      setFieldErrors(result.errors);
      return;
    }

    setBusy(true);
    if (await isUsernameTaken(result.username)) {
      setBusy(false);
      setFieldErrors({ username: 'That username is taken.' });
      return;
    }

    const outcome = await register({
      email: result.email,
      username: result.username,
      password: result.password,
    });
    setBusy(false);

    if (outcome.ok) setStep('verify');
    else setFieldErrors({ email: outcome.error });
  };

  const handleVerify = async (event: React.FormEvent) => {
    event.preventDefault();

    setCodeError(null);
    const token = validateCode(code);
    if (!token.ok) {
      setCodeError(token.error);
      return;
    }

    setBusy(true);
    const result = await verifyEmailCode(email, token.value);
    setBusy(false);

    if (result.ok) onDone();
    else setCodeError(result.error);
  };

  const consent = (
    <label className="m-consent">
      <input
        type="checkbox"
        checked={agreed}
        onChange={(event) => setAgreed(event.target.checked)}
      />
      <span>By continuing you agree to the Terms of Service and Privacy Policy.</span>
    </label>
  );

  return (
    <div className="m-login">
      <span className="m-login__mark">T</span>
      <h1 className="m-login__title">
        {step === 'verify' ? 'Check your email' : 'Your face shape, your best haircut'}
      </h1>

      {step === 'verify' ? (
        <>
          <p className="m-login__lede">
            We sent a six digit code to <strong>{email}</strong>.
          </p>

          <form onSubmit={handleVerify}>
            <label className="m-field">
              <span className="m-field__label">Code</span>
              <input
                className="m-field__input m-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                  setCodeError(null);
                }}
              />
              {codeError ? <span className="m-field__error">{codeError}</span> : null}
            </label>

            <button className="m-btn" type="submit" disabled={busy || code.length !== 6}>
              {busy ? 'Checking' : 'Verify and continue'}
            </button>
          </form>

          {resent ? <p className="m-field__hint">{resent}</p> : null}

          <div className="m-actions">
            <button
              className="m-link"
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const result = await resendEmailCode(email);
                setBusy(false);
                setResent(result.ok ? 'Sent again.' : result.error);
              }}
            >
              Send again
            </button>
            <button
              className="m-link"
              type="button"
              onClick={() => {
                setStep('form');
                setCode('');
              }}
            >
              Change email
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="m-login__lede">
            Measure your face, see the cuts that suit it, and ask Trimo what to say in the chair.
          </p>

          <div className="m-tabs" role="tablist" aria-label="Account">
            <button
              className={`m-tabs__tab${tab === 'signin' ? ' m-tabs__tab--on' : ''}`}
              type="button"
              role="tab"
              aria-selected={tab === 'signin'}
              onClick={() => setTab('signin')}
            >
              Sign in
            </button>
            <button
              className={`m-tabs__tab${tab === 'create' ? ' m-tabs__tab--on' : ''}`}
              type="button"
              role="tab"
              aria-selected={tab === 'create'}
              onClick={() => setTab('create')}
            >
              Create account
            </button>
          </div>

          {tab === 'signin' ? (
            <>
              <form onSubmit={handleSignIn}>
                <label className="m-field">
                  <span className="m-field__label">Email</span>
                  <input
                    className="m-field__input"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    value={signInEmail}
                    onChange={(event) => setSignInEmail(event.target.value)}
                  />
                </label>

                <label className="m-field">
                  <span className="m-field__label">Password</span>
                  <input
                    className="m-field__input"
                    type="password"
                    autoComplete="current-password"
                    value={signInPassword}
                    onChange={(event) => setSignInPassword(event.target.value)}
                  />
                </label>

                <button className="m-btn" type="submit" disabled={busy}>
                  {busy ? 'Signing in' : 'Sign in'}
                </button>
              </form>

              <div className="m-rule">
                <span>or</span>
              </div>

              <button className="m-btn m-btn--ghost" type="button" onClick={handleGoogle} disabled={busy}>
                Continue with Google
              </button>
            </>
          ) : (
            <form onSubmit={handleRegister}>
              <label className="m-field">
                <span className="m-field__label">Email</span>
                <input
                  className="m-field__input"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
                {fieldErrors.email ? (
                  <span className="m-field__error">{fieldErrors.email}</span>
                ) : null}
              </label>

              <label className="m-field">
                <span className="m-field__label">Username</span>
                <input
                  className="m-field__input"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => {
                    setUsername(normaliseUsername(event.target.value));
                    setFieldErrors((current) => ({ ...current, username: undefined }));
                  }}
                />
                {fieldErrors.username ? (
                  <span className="m-field__error">{fieldErrors.username}</span>
                ) : (
                  <span className="m-field__hint">Lowercase letters, numbers and underscores.</span>
                )}
              </label>

              <label className="m-field">
                <span className="m-field__label">Password</span>
                <input
                  className="m-field__input"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                {fieldErrors.password ? (
                  <span className="m-field__error">{fieldErrors.password}</span>
                ) : null}
              </label>

              <label className="m-field">
                <span className="m-field__label">Confirm password</span>
                <input
                  className="m-field__input"
                  type="password"
                  autoComplete="new-password"
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                />
                {fieldErrors.confirmation ? (
                  <span className="m-field__error">{fieldErrors.confirmation}</span>
                ) : null}
              </label>

              <button className="m-btn" type="submit" disabled={busy}>
                {busy ? 'Creating account' : 'Create account'}
              </button>
            </form>
          )}
        </>
      )}

      {consent}

      {error ? (
        <p className="m-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
};

export default Login;