import { describe, expect, it } from 'vitest';

import { FACE_OVAL, MeasurementAverager, measureFace } from './landmarks';
import type { LandmarkPoint } from './landmarks';

/**
 * Builds a 478 point mesh with the oval placed at chosen pixel positions, then
 * normalized the way MediaPipe normalizes. Keeps the fixtures readable as real
 * measurements rather than as magic numbers.
 */
const SQUARE = 1000;

interface OvalSpec {
  templeWidth: number;
  cheekboneWidth: number;
  jawWidth: number;
  length: number;
}

const buildMesh = ({ templeWidth, cheekboneWidth, jawWidth, length }: OvalSpec) => {
  const points: LandmarkPoint[] = Array.from({ length: 478 }, () => ({ x: 0, y: 0, z: 0 }));

  const place = (index: number, x: number, y: number) => {
    points[index] = { x: x / SQUARE, y: y / SQUARE, z: 0 };
  };

  place(10, SQUARE / 2, 0); // forehead top
  place(152, SQUARE / 2, length); // chin
  place(234, SQUARE / 2 - cheekboneWidth / 2, length * 0.38); // left cheekbone
  place(454, SQUARE / 2 + cheekboneWidth / 2, length * 0.38); // right cheekbone
  place(172, SQUARE / 2 - jawWidth / 2, length * 0.72); // left jaw
  place(397, SQUARE / 2 + jawWidth / 2, length * 0.72); // right jaw
  place(109, SQUARE / 2 - templeWidth / 2, length * 0.12); // left temple
  place(67, SQUARE / 2 + templeWidth / 2, length * 0.12); // right temple

  return points;
};

describe('measureFace', () => {
  it('normalises every width against the cheekbones', () => {
    const measurements = measureFace(
      buildMesh({ templeWidth: 300, cheekboneWidth: 250, jawWidth: 200, length: 400 }),
      1,
    );

    expect(measurements).not.toBeNull();
    // 300/250, 250/250, 200/250, 400/250
    expect(measurements!.foreheadRatio).toBeCloseTo(1.2, 5);
    expect(measurements!.jawRatio).toBeCloseTo(0.8, 5);
    expect(measurements!.lengthRatio).toBeCloseTo(1.6, 5);
  });

  it('corrects face length for a non-square source image', () => {
    const mesh = buildMesh({ templeWidth: 300, cheekboneWidth: 250, jawWidth: 200, length: 400 });

    const square = measureFace(mesh, 1);
    const wide = measureFace(mesh, 0.5625); // 16:9

    // Widths are unaffected: their shared scale cancels in the ratio.
    expect(wide!.foreheadRatio).toBeCloseTo(square!.foreheadRatio, 5);
    expect(wide!.jawRatio).toBeCloseTo(square!.jawRatio, 5);
    // Length is not, and would otherwise be read as a much longer face.
    expect(wide!.lengthRatio).toBeCloseTo(square!.lengthRatio * 0.5625, 5);
  });

  it('returns null when the mesh is empty or malformed', () => {
    expect(measureFace([], 1)).toBeNull();
    expect(measureFace(Array.from({ length: 478 }, () => ({ x: 0, y: 0, z: 0 })), 1)).toBeNull();
    expect(measureFace(new Array(478).fill(undefined) as LandmarkPoint[], 1)).toBeNull();
  });

  it('publishes an oval contour that stays inside the mesh', () => {
    expect(FACE_OVAL.length).toBeGreaterThan(20);
    for (const index of FACE_OVAL) {
      expect(index).toBeGreaterThanOrEqual(0);
      expect(index).toBeLessThan(478);
    }
  });
});

describe('MeasurementAverager', () => {
  const sample = (value: number) => ({
    foreheadRatio: value,
    jawRatio: value,
    lengthRatio: value,
  });

  it('averages the samples taken so far', () => {
    const averager = new MeasurementAverager(4);

    expect(averager.add(sample(10)).foreheadRatio).toBeCloseTo(10, 5);
    expect(averager.add(sample(20)).foreheadRatio).toBeCloseTo(15, 5);
  });

  it('drops the oldest samples once the window is full', () => {
    const averager = new MeasurementAverager(2);

    averager.add(sample(100));
    averager.add(sample(0));
    expect(averager.size).toBe(2);

    // 100 has aged out, so this averages 0 and 10 rather than all three.
    expect(averager.add(sample(10)).foreheadRatio).toBeCloseTo(5, 5);
    expect(averager.size).toBe(2);
  });

  it('clears on reset', () => {
    const averager = new MeasurementAverager(3);
    averager.add(sample(5));
    averager.reset();

    expect(averager.size).toBe(0);
    expect(averager.add(sample(7)).foreheadRatio).toBeCloseTo(7, 5);
  });
});