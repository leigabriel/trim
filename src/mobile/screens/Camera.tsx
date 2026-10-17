/**
 * Try-on filters. Placeholder by design.
 *
 * Deliberately not wired to the camera. A live filter needs a GPU pipeline and
 * a face-tracking model sized for a phone, which is a separate piece of work
 * from the analyzer: the analyzer runs MediaPipe once per few frames and throws
 * the video away, whereas a filter has to touch every frame and never release
 * it. Shipping a black rectangle that claims to be one would be worse than
 * saying plainly that it is not built yet.
 */
const Camera: React.FC = () => (
  <div className="m-screen">
    <h2 className="m-heading">Haircut filters</h2>
    <p className="m-lede">Try a cut on your own face before you commit to it.</p>

    <div className="m-cam m-cam--empty">
      <p className="m-cam__idle">Not built yet</p>
    </div>

    <div className="m-card">
      <h3 className="m-card__title">What this will do</h3>
      <p className="m-card__text">
        Point the camera at yourself and see a cut previewed on your face, so you can
        rule one out without booking it first.
      </p>
      <p className="m-card__text" style={{ marginTop: '0.6rem' }}>
        It is not ready. The analyzer on the Face tab measures your face shape today and
        suggests cuts from it, which answers most of the same question.
      </p>
    </div>
  </div>
);

export default Camera;