import { useState } from 'react';

import { useAuth } from '../../../auth/AuthProvider';
import ConfirmModal from '../../../components/layout/modals/ConfirmModal';
import { supabase } from '../../../lib/supabase';

/**
 * Account. Reads the Supabase session and profile.
 *
 * Centred and width-capped rather than filling the pane: this is a settings
 * page, not a dashboard, and stretching four short cards across 1000px left
 * them as a row of thin slivers.
 */
const Account: React.FC = () => {
  const { session, profile, signOut } = useAuth();
  const [isConfirmingOut, setIsConfirmingOut] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteAccount = async () => {
    setDeleteError(null);

    const { error } = await supabase.functions.invoke('delete-account', {
      body: { confirm: 'DELETE' },
    });

    if (error) {
      // The account may already be gone even if the response did not arrive,
      // so say what to try rather than pretending it certainly failed.
      setDeleteError('Could not delete your account. Try again in a moment.');
      return;
    }

    // Sign out is what moves them home and clears the local session. The rows
    // are already gone by the time this runs.
    await signOut();
  };

  const created = session?.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <>
      {deleteError ? (
          <p className="trim-account__error" role="alert">
            {deleteError}
          </p>
        ) : null}

        <div className="trim-account-page">
        <header className="trim-section__head">
          <h1 className="trim-section__title">Account</h1>
          <p className="trim-section__lede">
            Your Trim profile is created the first time you sign in and lives
            under your Google account. Change your name or email in Google and
            it updates here on your next sign in.
          </p>
        </header>

        <div className="trim-account">
          <div className="trim-card">
            <h2 className="trim-card__title">Profile</h2>
            <dl className="trim-facts">
              <div>
                <dt>Username</dt>
                <dd>{profile?.username ?? 'Not set'}</dd>
              </div>
              <div>
                <dt>Name</dt>
                <dd>{profile?.displayName ?? 'Not provided'}</dd>
              </div>
              {/* Full width: the longest value here, and it splits mid-word. */}
              <div className="trim-facts__wide">
                <dt>Email</dt>
                <dd>{session?.user.email ?? 'Unavailable'}</dd>
              </div>
              <div>
                <dt>Signed in with</dt>
                <dd>Google</dd>
              </div>
              {created ? (
                <div>
                  <dt>Member since</dt>
                  <dd>{created}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="trim-card">
            <h2 className="trim-card__title">Data</h2>
            <p className="trim-card__text">
              Trim stores your profile, the styles you save, your face shape
              reading and your booking history. Nothing is shared with barbers
              until you book, and the reference image only goes with the
              appointment you confirm.
            </p>
          </div>

          <div className="trim-card">
            <h2 className="trim-card__title">Session</h2>
            <dl className="trim-facts">
              <div>
                <dt>Provider</dt>
                <dd>Google</dd>
              </div>
              <div>
                <dt>Refreshes</dt>
                <dd>Automatically</dd>
              </div>
              <div>
                <dt>On this device</dt>
                <dd>Signed in</dd>
              </div>
            </dl>
          </div>

          <div className="trim-card trim-card--danger">
            <h2 className="trim-card__title">Delete account</h2>
            <p className="trim-card__text">
              Removes your profile, saved styles, face shape reading, bookings and
              every Trimo chat. This cannot be undone.
            </p>
            <button
              className="trim-account__delete"
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
            >
              Delete my account
            </button>
          </div>
        </div>

        <button
          className="trim-account__signout"
          type="button"
          onClick={() => setIsConfirmingOut(true)}
        >
          Log out of Trim
        </button>
      </div>

      <ConfirmModal
        isOpen={isConfirmingOut}
        title="Log out of Trim?"
        message={`You are signed in as ${profile?.username ?? profile?.displayName ?? 'your account'}. You will need to sign in with Google again to get back in.`}
        confirmLabel="Log out"
        onConfirm={signOut}
        onDismiss={() => setIsConfirmingOut(false)}
      />

      <ConfirmModal
        isOpen={isConfirmingDelete}
        title="Delete your account?"
        message="Your profile, saved styles, face shape reading, bookings and every Trimo chat are erased. There is no way back from this."
        confirmLabel="Delete everything"
        verifyText="DELETE"
        onConfirm={deleteAccount}
        onDismiss={() => setIsConfirmingDelete(false)}
      />
    </>
  );
};

export default Account;
