import { useNavigate } from 'react-router-dom';

import { shapeAdvice } from '../../dashboards/customer-dashboard/face/advice';
import { useFaceProfile } from '../../dashboards/customer-dashboard/face/useFaceProfile';
import { faceShapeLabel } from '../../dashboards/customer-dashboard/face/shapes';

const relative = (iso: string): string => {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 'Unknown';

  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 60 * 24) return `${Math.round(minutes / 60)} hr ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

/** Same real data as the web overview, laid out for a thumb. */
const Home: React.FC = () => {
  const face = useFaceProfile();
  const navigate = useNavigate();

  return (
    <div className="m-screen">
      <h2 className="m-heading">Overview</h2>
      <p className="m-lede">Everything Trim knows about you right now.</p>

      <div className="m-card">
        <h3 className="m-card__title">Face shape</h3>

        {face.isLoading ? (
          <p className="m-card__text">Loading…</p>
        ) : face.shape ? (
          <>
            <p className="m-card__text">
              <strong>{faceShapeLabel(face.shape)}</strong>
              {face.profile?.source === 'scanned' && face.profile.confidence
                ? ` · ${face.profile.confidence}% confidence`
                : ' · set by you'}
            </p>
            <p className="m-card__text">{shapeAdvice(face.shape).headline}</p>
          </>
        ) : (
          <>
            <p className="m-card__text">
              Not set yet. Measure it and your styles, gallery and Trimo all get ranked
              against it.
            </p>
            <button
              className="m-btn"
              type="button"
              style={{ marginTop: '0.75rem' }}
              onClick={() => navigate('/face-shape')}
            >
              Measure my face
            </button>
          </>
        )}
      </div>

      {face.profile?.measured_at ? (
        <div className="m-card">
          <h3 className="m-card__title">Last reading</h3>
          <p className="m-card__text">{relative(face.profile.measured_at)}</p>
        </div>
      ) : null}
    </div>
  );
};

export default Home;