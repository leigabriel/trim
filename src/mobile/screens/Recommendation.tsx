import { useNavigate } from 'react-router-dom';

import { shapeAdvice } from '../../dashboards/customer-dashboard/face/advice';
import { galleryItemsFor } from '../../dashboards/customer-dashboard/face/gallery';
import { matchedStyles, trendingStyles } from '../../dashboards/customer-dashboard/face/catalog';
import { useFaceProfile } from '../../dashboards/customer-dashboard/face/useFaceProfile';
import { faceShapeLabel } from '../../dashboards/customer-dashboard/face/shapes';

interface GalleryItem {
  src: string;
  name?: string;
}

/** Same content as the web Recommendation, as a vertical scroll for a phone. */
const Recommendation: React.FC = () => {
  const face = useFaceProfile();
  const navigate = useNavigate();

  const shape = face.shape;
  const matched = matchedStyles(shape).slice(0, 4);
  const trending = trendingStyles(shape)
    .filter((style) => !matched.some((other) => other.id === style.id))
    .slice(0, 4);
  const gallery: GalleryItem[] = galleryItemsFor(shape).slice(0, 6);

  return (
    <div className="m-screen">
      <h2 className="m-heading">Recommendation</h2>
      <p className="m-lede">
        {shape
          ? `Matched to your ${faceShapeLabel(shape).toLowerCase()} face.`
          : 'Trending now. Set your face shape and these get ranked against you.'}
      </p>

      {!shape ? (
        <div className="m-card">
          <p className="m-card__text">Nothing is matched to you yet.</p>
          <button
            className="m-btn"
            type="button"
            style={{ marginTop: '0.75rem' }}
            onClick={() => navigate('/face-shape')}
          >
            Set my face shape
          </button>
        </div>
      ) : (
        <div className="m-card">
          <h3 className="m-card__title">{faceShapeLabel(shape)} cuts</h3>
          <p className="m-card__text">{shapeAdvice(shape).headline}</p>
        </div>
      )}

      {matched.length > 0 ? (
        <>
          <h3 className="m-card__title">Suits your face</h3>
          <div className="m-grid">
            {matched.map((style) => (
              <figure className="m-tile" key={style.id}>
                <img src={style.image} alt={style.name} loading="lazy" />
                <figcaption>
                  <span className="m-tile__name">{style.name}</span>
                  <span className="m-tile__meta">{style.match}% match</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      ) : null}

      {gallery.length > 0 ? (
        <>
          <h3 className="m-card__title">Reference</h3>
          {/* Horizontal so it does not push the cuts off the first screen. */}
          <div className="m-strip">
            {gallery.map((item, index) => (
              <img
                className="m-strip__item"
                key={item.src}
                src={item.src}
                alt={item.name ?? `Reference ${index + 1}`}
                loading="lazy"
              />
            ))}
          </div>
        </>
      ) : null}

      {trending.length > 0 ? (
        <>
          <h3 className="m-card__title">Trending</h3>
          <div className="m-grid">
            {trending.map((style) => (
              <figure className="m-tile" key={style.id}>
                <img src={style.image} alt={style.name} loading="lazy" />
                <figcaption>
                  <span className="m-tile__name">{style.name}</span>
                  <span className="m-tile__meta">{style.upkeepWeeks} weeks</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default Recommendation;