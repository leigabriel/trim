import { IonModal } from '@ionic/react';

import GoogleIcon from './GoogleIcon';
import './LoginModal.css';

interface LoginModalProps {
  isOpen: boolean;
  onDismiss: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onDismiss }) => (
  <IonModal
    isOpen={isOpen}
    onDidDismiss={onDismiss}
    className="trim-login"
    initialBreakpoint={1}
    breakpoints={[0, 1]}
  >
    <div className="trim-login__panel">
      <img className="trim-login__mark" src="/assets/ui/T-1.png" alt="" aria-hidden="true" />

      <button className="trim-login__close" type="button" onClick={onDismiss} aria-label="Close login">
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

        <button className="trim-login__google" type="button">
          <GoogleIcon className="trim-login__google-icon" />
          <span>Continue with Google</span>
        </button>

        <p className="trim-login__legal">
          By continuing, you agree to our <strong>Terms of Service</strong>.
          <br />
          Read our <strong>Privacy Policy</strong>.
        </p>
      </div>
    </div>
  </IonModal>
);

export default LoginModal;