import { useState } from 'react';
import { IonModal } from '@ionic/react';

import { useAuth } from '../../auth/AuthProvider';
import GoogleIcon from './GoogleIcon';
import './LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onDismiss }) => {
  const { signInWithGoogle } = useAuth();
  const [isAgreed, setIsAgreed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGoogle = async () => {
    if (!isAgreed) {
      setNotice('Please agree to the Terms and Privacy Policy first.');
      return;
    }

    setNotice(null);
    setIsRedirecting(true);
    try {
      await signInWithGoogle();
    } catch {
      // The redirect has already happened on success, so reaching here is a
      // failure worth showing rather than swallowing.
      setIsRedirecting(false);
      setNotice('Could not start Google sign in. Check your connection and try again.');
    }
  };

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDismiss}
      className="trim-login"
      initialBreakpoint={1}
      breakpoints={[0, 1]}
    >
      <div className="trim-login__panel">
        <img className="trim-login__mark" src="/assets/ui/T-1.png" alt="" aria-hidden="true" />

        <button
          className="trim-login__close"
          type="button"
          onClick={onDismiss}
          aria-label="Close login"
        >
          <span aria-hidden="true">X</span>
        </button>

        <div className="trim-login__body">
          <p className="trim-login__eyebrow">Login to</p>

          <h2 className="trim-login__title">
            Trim
            <br />
            Your Face Shape,
            <br />
            Your Best Haircut
          </h2>

          <button
            className="trim-login__google"
            type="button"
            onClick={handleGoogle}
            disabled={isRedirecting}
          >
            <GoogleIcon className="trim-login__google-icon" />
            <span>{isRedirecting ? 'Opening Google' : 'Continue with Google'}</span>
          </button>

          <label className="trim-login__consent">
            <input
              className="trim-login__checkbox"
              type="checkbox"
              checked={isAgreed}
              onChange={(event) => {
                setIsAgreed(event.target.checked);
                if (event.target.checked) setNotice(null);
              }}
            />
            <span className="trim-login__legal">
              By continuing, you agree to our <strong>Terms of Service</strong>. Read our <strong>Privacy Policy</strong>.
            </span>
          </label>

          {notice && (
            <p className="trim-login__notice" role="alert">
              {notice}
            </p>
          )}
        </div>
      </div>
    </IonModal>
  );
};

export default LoginModal;
