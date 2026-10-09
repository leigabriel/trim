import { useAuth } from '../../auth/AuthProvider';

/**
 * Identity block at the foot of the rail, and the only route into Account.
 * The section is absent from the nav list above, because two entries for one
 * page was the confusing part.
 */
export const AccountRail: React.FC<{
  isCurrent: boolean;
  onOpen: () => void;
}> = ({ isCurrent, onOpen }) => {
  const { session, profile, signOut } = useAuth();

  const name = profile?.username ?? profile?.displayName ?? 'Guest';
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className={`trim-dash__identity${isCurrent ? ' trim-dash__identity--current' : ''}`}>
      <button
        className="trim-dash__identity-open"
        type="button"
        onClick={onOpen}
        aria-current={isCurrent ? 'page' : undefined}
      >
        {profile?.avatarUrl ? (
          <img className="trim-dash__identity-avatar" src={profile.avatarUrl} alt="" />
        ) : (
          <span className="trim-dash__identity-initial" aria-hidden="true">
            {initial}
          </span>
        )}

        <span className="trim-dash__identity-text">
          <span className="trim-dash__identity-name">{name}</span>
          <span className="trim-dash__identity-email">{session?.user.email}</span>
        </span>
      </button>

      <button className="trim-dash__identity-out" type="button" onClick={signOut}>
        Logout
      </button>
    </div>
  );
};

/** Account panel. Reads the Supabase session and profile. */
export const AccountDetail: React.FC = () => {
  const { session, profile, signOut } = useAuth();

  const created = session?.user.created_at
    ? new Date(session.user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <>
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
          <button className="trim-card__action" type="button" onClick={signOut}>
            Log out of Trim
          </button>
        </div>
      </div>
    </>
  );
};