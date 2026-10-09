import { useAuth } from '../../../auth/AuthProvider';

/**
 * Account. Reads the Supabase session and profile.
 *
 * Centred and width-capped rather than filling the pane: this is a settings
 * page, not a dashboard, and stretching four short cards across 1000px left
 * them as a row of thin slivers.
 */
const Account: React.FC = () => {
  const { session, profile, signOut } = useAuth();

  const created = session?.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div className="trim-account-page">
      <header className="trim-section__head">
        <h1 className="trim-section__title">Account</h1>
        <p className="trim-section__lede">
          Your Trim profile is created the first time you sign in and lives under your Google
          account. Change your name or email in Google and it updates here on your next sign in.
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
            Trim stores your profile, the styles you save, your face shape reading and your
            booking history. Nothing is shared with barbers until you book, and the reference
            image only goes with the appointment you confirm.
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
      </div>

      <button className="trim-account__signout" type="button" onClick={signOut}>
        Log out of Trim
      </button>
    </div>
  );
};

export default Account;