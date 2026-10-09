import { CHEEKBONE_REFERENCE, FACE_FINDINGS, FACE_METRICS } from '../data';
import SectionHead from './SectionHead';

const FaceShape: React.FC = () => (
  <>
    <SectionHead
      title="Faceshape Analyzer"
      lede="Four landmarks measured from your photo. Each bar is how far that measurement sits from your cheekbones, which is the reference the shape is read against."
    />

    <div className="trim-card">
      <h2 className="trim-card__title">Landmarks</h2>

      {/* The scale is stated once, and the tick marks the cheekbones on it. */}
      <p className="trim-card__scale">
        Width as a percentage of your cheekbones
        <span className="trim-card__scale-mark" aria-hidden="true" />
      </p>

      <ul className="trim-landmarks">
        {FACE_METRICS.map((metric) => (
          <li className="trim-landmark" key={metric.label}>
            <div className="trim-landmark__head">
              <span className="trim-landmark__label">{metric.label}</span>
              <span className="trim-landmark__value">{metric.value}%</span>
            </div>

            <div className="trim-landmark__track">
              <div className="trim-landmark__fill" style={{ width: `${metric.value}%` }} />
              <span
                className="trim-landmark__reference"
                style={{ left: `${CHEEKBONE_REFERENCE}%` }}
                aria-hidden="true"
              />
            </div>

            <p className="trim-landmark__reading">{metric.reading}</p>
          </li>
        ))}
      </ul>
    </div>

    <div className="trim-card">
      <h2 className="trim-card__title">Result</h2>
      <p className="trim-result">
        <strong>Oval</strong>
        <span className="trim-result__confidence">92% confidence</span>
      </p>
      <p className="trim-card__text">
        Forehead slightly wider than the cheekbones with a tapered jaw and no strong brow
        shelf. Oval takes almost every short cut well, so your choice comes down to upkeep
        rather than shape.
      </p>
    </div>

    <div className="trim-card">
      <h2 className="trim-card__title">What it means</h2>
      <ul className="trim-findings">
        {FACE_FINDINGS.map((finding) => (
          <li className="trim-finding" key={finding.label}>
            <span className="trim-finding__head">
              <span className="trim-finding__label">{finding.label}</span>
              <span className="trim-finding__value">{finding.value}</span>
            </span>
            <span className="trim-finding__body">{finding.body}</span>
          </li>
        ))}
      </ul>
    </div>
  </>
);

export default FaceShape;