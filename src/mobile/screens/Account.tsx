import { useState } from 'react';

import { useAuth } from '../../auth/AuthProvider';
import ConfirmModal from '../../components/layout/modals/ConfirmModal';
import { supabase } from '../../lib/supabase';
import { useFaceProfile } from '../../dashboards/customer-dashboard/face/useFaceProfile';
import { faceShapeLabel } from '../../dashboards/customer-dashboard/face/shapes';

const Account: React.FC = () => {
  const { session, profile, signOut } = useAuth();
  const face = useFaceProfile();

  const [confirmingOut, setConfirmingOut] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const name = profile?.username ?? profile?.displayName ?? 'Guest';
  const joined = session?.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  const deleteAccount = async () => {
    setError(null);

    const { error: failure } = await supabase.functions.invoke('delete-account', {
      body: { confirm: 'DELETE' },
    });

    if (failure) {
      // The rows may already be gone even if the response did not arrive.
      setError('Could not delete your account. Try again in a moment.');
      return;
    }

    await signOut();
  };

  return (
    <div className="m-screen">
      <h2 className="m-heading">Account</h2>
      <p className="m-lede">Your profile and what Trim stores.</p>

      {error ? (
        <p className="m-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="m-card">
        <h3 className="m-card__title">Profile</h3>
        <dl className="m-facts">
          <div>
            <dt>Username</dt>
            <dd>{profile?.username ?? 'Not set'}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd className="m-break">{session?.user.email ?? 'Unavailable'}</dd>
          </div>
          {joined ? (
            <div>
              <dt>Member since</dt>
              <dd>{joined}</dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="m-card">
        <h3 className="m-card__title">Face shape</h3>
        {face.isLoading ? (
          <p className="m-card__text">Loading…</p>
        ) : face.shape ? (
          <>
            <p className="m-card__text">
              <strong>{faceShapeLabel(face.shape)}</strong>
              {face.profile?.source === 'scanned' ? ' · measured' : ' · set by you'}
            </p>
            {face.profile?.confidence ? (
              <p className="m-card__text">{face.profile.confidence}% confidence</p>
            ) : null}
          </>
        ) : (
          <p className="m-card__text">Not set yet.</p>
        )}
      </div>

      <div className="m-card">
        <h3 className="m-card__title">Data</h3>
        <p className="m-card__text">
          Trim stores your profile, the styles you save, your face reading and your Trimo
          history. Nothing is shared with barbers until you book.
        </p>
      </div>

      <button
        className="m-btn m-btn--ghost"
        type="button"
        style={{ marginBottom: '0.75rem' }}
        onClick={() => setConfirmingOut(true)}
      >
        Log out
      </button>

      <button className="m-btn m-btn--danger" type="button" onClick={() => setConfirmingDelete(true)}>
        Delete my account
      </button>

      <ConfirmModal
        isOpen={confirmingOut}
        title="Log out of Trim?"
        message={`You are signed in as ${name}. You will need to sign in again to get back in.`}
        confirmLabel="Log out"
        onConfirm={signOut}
        onDismiss={() => setConfirmingOut(false)}
      />

      <ConfirmModal
        isOpen={confirmingDelete}
        title="Delete your account?"
        message="Your profile, face reading and every Trimo chat are erased. There is no way back from this."
        confirmLabel="Delete everything"
        verifyText="DELETE"
        onConfirm={deleteAccount}
        onDismiss={() => setConfirmingDelete(false)}
      />
    </div>
  );
};

export default Account;