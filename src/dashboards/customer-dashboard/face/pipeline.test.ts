import { describe, expect, it } from 'vitest';

import { classifyFace } from './classify';
import { MeasurementAverager, measureFace } from './landmarks';
import type { LandmarkPoint } from './landmarks';
import { FACE_SHAPE_DEFINITIONS, FACE_SHAPES } from './shapes';
import type { FaceShapeName } from './shapes';

/**
 * End to end over the pure layer: a synthetic face built from a shape's own
 * prototype, measured off the mesh the way the scanner measures a real one,
 * then classified. This is the chain the camera relies on, minus the camera.
 *
 * It cannot prove the landmark indices are the anatomically correct MediaPipe
 * ones — only a real face can do that. It does prove the indices, the aspect
 * correction and the prototypes agree with each other.
 */
const IMAGE = 640;

interface OvalSpec {
  templeWidth: number;
  cheekboneWidth: number;
  jawWidth: number;
  length: number;
}

/**
 * Builds a mesh in the proportions a shape wants, honouring the same
 * normalisation MediaPipe uses: x across the image width, y across its height.
 * Normalizing both by the same number would hide the aspect correction, which
 * is exactly what the last test exists to check.
 */
const buildMesh = (
  { templeWidth, cheekboneWidth, jawWidth, length }: OvalSpec,
  width = IMAGE,
  height = IMAGE,
) => {
  const points: LandmarkPoint[] = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
  const top = height * 0.1;

  const place = (index: number, x: number, y: number) => {
    points[index] = { x: x / width, y: y / height, z: 0 };
  };

  place(10, width / 2, top); // forehead top
  place(152, width / 2, top + length); // chin
  place(234, width / 2 - cheekboneWidth / 2, top + length * 0.38); // left cheekbone
  place(454, width / 2 + cheekboneWidth / 2, top + length * 0.38); // right cheekbone
  place(172, width / 2 - jawWidth / 2, top + length * 0.72); // left jaw
  place(397, width / 2 + jawWidth / 2, top + length * 0.72); // right jaw
  place(109, width / 2 - templeWidth / 2, top + length * 0.12); // left temple
  place(67, width / 2 + templeWidth / 2, top + length * 0.12); // right temple

  return points;
};

/** Builds a face whose measured ratios land on the shape's prototype. */
const meshFor = (shape: FaceShapeName, width = IMAGE, height = IMAGE): LandmarkPoint[] => {
  const { prototype } = FACE_SHAPE_DEFINITIONS[shape];
  const cheekbone = width * 0.3;

  return buildMesh(
    {
      templeWidth: prototype.forehead * cheekbone,
      cheekboneWidth: cheekbone,
      jawWidth: prototype.jaw * cheekbone,
      length: prototype.length * cheekbone,
    },
    width,
    height,
  );
};

describe('measurement to shape', () => {
  it.each(FACE_SHAPES)('reads a %s mesh as %s', (shape) => {
    const mesh = meshFor(shape);
    const aspect = IMAGE / IMAGE;

    const measurements = measureFace(mesh, aspect);
    expect(measurements).not.toBeNull();

    const result = classifyFace(measurements!);
    expect(result.shape).toBe(shape);
  });

  it('holds up with measurement noise, the way a real capture has', () => {
    // Jitters a few percent per frame, as the customer shifts between frames.
    const jitter = (base: number, index: number) => base * (1 + Math.sin(index * 2.7) * 0.04);

    const averager = new MeasurementAverager(12);
    for (let frame = 0; frame < 24; frame += 1) {
      const mesh = buildMesh({
        templeWidth: jitter(200 * FACE_SHAPE_DEFINITIONS.oval.prototype.forehead, frame),
        cheekboneWidth: 200,
        jawWidth: jitter(200 * FACE_SHAPE_DEFINITIONS.oval.prototype.jaw, frame + 7),
        length: 200 * FACE_SHAPE_DEFINITIONS.oval.prototype.length,
      });

      const measurements = measureFace(mesh, 1);
      expect(measurements).not.toBeNull();
      averager.add(measurements!);
    }

    expect(averager.size).toBe(12);
    expect(classifyFace(averager.add(measureFace(meshFor('oval'), 1)!)).shape).toBe('oval');
  });

  it('does not let image aspect change the verdict', () => {
    // Without the aspect correction a 16:9 frame reads every face as longer
    // than it is, and the wrong shape comes back every time.
    for (const shape of FACE_SHAPES) {
      for (const [width, height] of [
        [640, 480],
        [1280, 720],
        [720, 720],
        [1920, 1080],
      ]) {
        const measurements = measureFace(meshFor(shape, width, height), height / width);

        expect(measurements, `${shape} ${width}x${height}`).not.toBeNull();
        expect(classifyFace(measurements!).shape, `${shape} ${width}x${height}`).toBe(shape);
      }
    }
  });
});