import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { shapeAdvice } from '../../dashboards/customer-dashboard/face/advice';
import { matchedStyles } from '../../dashboards/customer-dashboard/face/catalog';
import { useFaceProfile } from '../../dashboards/customer-dashboard/face/useFaceProfile';
import { useFaceScanner } from '../../dashboards/customer-dashboard/face/useFaceScanner';
import type { FaceScanResult } from '../../dashboards/customer-dashboard/face/useFaceScanner';
import { FACE_SHAPE_DEFINITIONS, FACE_SHAPES, faceShapeLabel } from '../../dashboards/customer-dashboard/face/shapes';

const TRACK_MAX = 140;
const asTrackPercent = (percent: number) => `${(percent / TRACK_MAX) * 100}%`;

/** Reuses the whole analyzer: camera, MediaPipe, classification, averaging. */
const FaceShape: React.FC = () => {
  const face = useFaceProfile();
  const navigate = useNavigate();
  const [scan, setScan] = useState<FaceScanResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const scanner = useFaceScanner({
    onResolved: (result) => {
      setScan(result);
      void face.saveScan(result.classification, result.measurements);
    },
  });

  const resolved = scan?.classification ?? null;
  const measurements = scan?.measurements ?? face.profile?.measurements ?? null;
  const shape = resolved?.shape ?? face.profile?.shape ?? null;
  const label = shape ? faceShapeLabel(shape) : null;

  const bars = measurements
    ? [
        { label: 'Forehead', value: Math.round(measurements.foreheadRatio * 100) },
        { label: 'Cheekbones', value: 100 },
        { label: 'Jaw', value: Math.round(measurements.jawRatio * 100) },
        { label: 'Length', value: Math.round(measurements.lengthRatio * 100) },
      ]
    : [];

  return (
    <div className="m-screen">
      <h2 className="m-heading">Face shape</h2>
      <p className="m-lede">Measured on your phone. The image never leaves it.</p>

      {/* Camera. Landscape here so the preview is not a letterbox slot. */}
      <div className="m-cam">
        <video ref={scanner.videoRef} className="m-cam__video" playsInline muted autoPlay />
        {!scanner.result?.preview && scanner.status === 'idle' ? (
          <div className="m-cam__idle">Camera off</div>
        ) : null}
        {scanner.guidance ? <p className="m-cam__guidance">{scanner.guidance}</p> : null}
        {scanner.status === 'sampling' || scanner.status === 'scanning' ? (
          <div className="m-cam__bar">
            <span style={{ transform: `scaleX(${scanner.progress})` }} />
          </div>
        ) : null}
      </div>

      {scanner.error ? (
        <p className="m-error" role="alert">
          {scanner.error}
        </p>
      ) : null}

      <div className="m-actions" style={{ justifyContent: 'stretch', marginBottom: '1rem' }}>
        {scanner.status === 'loading' ? (
          <button className="m-btn" type="button" disabled>
            Starting…
          </button>
        ) : scanner.status === 'idle' || scanner.status === 'error' ? (
          <button className="m-btn" type="button" onClick={() => void scanner.start()}>
            Start camera
          </button>
        ) : null}

        {scanner.status === 'scanning' || scanner.status === 'sampling' ? (
          <button className="m-btn m-btn--ghost" type="button" onClick={scanner.stop}>
            Stop
          </button>
        ) : null}

        {scanner.status === 'resolved' ? (
          <button className="m-btn m-btn--ghost" type="button" onClick={scanner.restart}>
            Scan again
          </button>
        ) : null}

        <button
          className="m-btn m-btn--ghost"
          type="button"
          onClick={() => fileRef.current?.click()}
        >
          Use a photo
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void scanner.analyseImage(file);
          event.target.value = '';
        }}
      />

      {label ? (
        <div className="m-card">
          <h3 className="m-card__title">{label}</h3>
          {resolved ? (
            <p className="m-card__text">{resolved.confidence}% confidence</p>
          ) : null}
          <p className="m-card__text">
            {resolved?.isAmbiguous
              ? 'Close to the line between two shapes. Scan again in better light to settle it.'
              : shapeAdvice(shape!).body}
          </p>
        </div>
      ) : null}

      {bars.length > 0 ? (
        <div className="m-card">
          <h3 className="m-card__title">Landmarks</h3>
          <p className="m-field__hint">Percentage of your cheekbone width</p>

          <ul className="m-bars">
            {bars.map((bar) => (
              <li key={bar.label}>
                <div className="m-bars__head">
                  <span>{bar.label}</span>
                  <span>{bar.value}%</span>
                </div>
                <div className="m-bars__track">
                  <div className="m-bars__fill" style={{ width: asTrackPercent(bar.value) }} />
                  <span className="m-bars__ref" style={{ left: asTrackPercent(100) }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {label ? (
        <>
          <div className="m-card">
            <h3 className="m-card__title">Ask about {label.toLowerCase()} cuts</h3>
            <p className="m-card__text">{shapeAdvice(shape!).headline}</p>
            <button
              className="m-btn"
              type="button"
              style={{ marginTop: '0.75rem' }}
              onClick={() => navigate('/ai')}
            >
              Ask Trimo
            </button>
          </div>

          {matchedStyles(shape!).length > 0 ? (
            <div className="m-grid">
              {matchedStyles(shape!)
                .slice(0, 4)
                .map((style) => (
                  <figure className="m-tile" key={style.id}>
                    <img src={style.image} alt={style.name} loading="lazy" />
                    <figcaption>
                      <span className="m-tile__name">{style.name}</span>
                      <span className="m-tile__meta">{style.match}%</span>
                    </figcaption>
                  </figure>
                ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="m-card">
          <h3 className="m-card__title">Already know your shape?</h3>
          <div className="m-pills">
            {FACE_SHAPES.map((option) => (
              <button
                className={`m-pill${face.shape === option ? ' m-pill--on' : ''}`}
                type="button"
                key={option}
                disabled={face.isSaving}
                onClick={() => void face.setShape(option)}
              >
                {faceShapeLabel(option)}
              </button>
            ))}
          </div>
          <p className="m-field__hint">{FACE_SHAPE_DEFINITIONS[face.shape ?? 'oval'].summary}</p>
        </div>
      )}
    </div>
  );
};

export default FaceShape;