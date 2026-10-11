import { describe, expect, it } from 'vitest';

import { AMBIGUOUS_CONFIDENCE, classifyFace } from './classify';
import { FACE_SHAPES } from './shapes';

/**
 * Fixtures are each shape's own prototype. They test that scoring prefers the
 * shape it was written for; they are not a claim about real faces, which is
 * what the runner-up and ambiguity cases below are for.
 */
const PROTOTYPE_FIXTURES = {
  oval: { foreheadRatio: 1.02, jawRatio: 0.92, lengthRatio: 1.45 },
  round: { foreheadRatio: 0.95, jawRatio: 0.95, lengthRatio: 1.12 },
  square: { foreheadRatio: 1.0, jawRatio: 1.0, lengthRatio: 1.24 },
  heart: { foreheadRatio: 1.14, jawRatio: 0.72, lengthRatio: 1.38 },
  diamond: { foreheadRatio: 0.82, jawRatio: 0.74, lengthRatio: 1.5 },
  long: { foreheadRatio: 0.97, jawRatio: 0.93, lengthRatio: 1.85 },
  triangle: { foreheadRatio: 0.76, jawRatio: 1.16, lengthRatio: 1.42 },
} as const;

describe('classifyFace', () => {
  it.each(FACE_SHAPES)('reads a %s fixture as that shape', (shape) => {
    const result = classifyFace(PROTOTYPE_FIXTURES[shape]);
    expect(result.shape).toBe(shape);
  });

  it('gives a textbook face high but not absolute confidence', () => {
    const result = classifyFace(PROTOTYPE_FIXTURES.diamond);
    // Seven shapes compete, so a perfect prototype match is not 100%. Asserting
    // an exact figure here would be asserting the sharpness constant, not the
    // behaviour; the bounds are what actually matter.
    expect(result.confidence).toBeGreaterThan(85);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it('separates a distinctive face from an ambiguous one', () => {
    const distinctive = classifyFace({
      foreheadRatio: 0.78,
      jawRatio: 0.7,
      lengthRatio: 1.54,
    });
    // Halfway between the Heart and Oval prototypes, where both readings are
    // defensible and the classifier is expected to refuse to commit.
    const ambiguous = classifyFace({
      foreheadRatio: 1.08,
      jawRatio: 0.82,
      lengthRatio: 1.415,
    });

    expect(distinctive.shape).toBe('diamond');
    expect(distinctive.confidence).toBeGreaterThan(90);

    expect(ambiguous.isAmbiguous).toBe(true);
    expect(ambiguous.confidence).toBeLessThan(AMBIGUOUS_CONFIDENCE);
    expect(ambiguous.confidence).toBeLessThan(distinctive.confidence);
    // Both readings should be live, which is what makes it ambiguous.
    expect([ambiguous.shape, ambiguous.runnerUp].sort()).toEqual(['heart', 'oval']);
  });

  it('keeps real-looking proportions on the high end', () => {
    // Not prototypes, but plausible readings with measurement noise. Guards
    // against the sharpness constant being set so high that ordinary faces
    // report a coin-flip.
    const readings = [
      { shape: 'oval', measurement: { foreheadRatio: 1.03, jawRatio: 0.9, lengthRatio: 1.47 } },
      { shape: 'long', measurement: { foreheadRatio: 0.98, jawRatio: 0.92, lengthRatio: 1.88 } },
      { shape: 'heart', measurement: { foreheadRatio: 1.16, jawRatio: 0.7, lengthRatio: 1.36 } },
      { shape: 'triangle', measurement: { foreheadRatio: 0.74, jawRatio: 1.18, lengthRatio: 1.44 } },
    ] as const;

    for (const { shape, measurement } of readings) {
      const result = classifyFace(measurement);
      expect(result.shape, `${shape} fixture`).toBe(shape);
      expect(result.isAmbiguous, `${shape} should not be ambiguous`).toBe(false);
      expect(result.confidence, `${shape} confidence`).toBeGreaterThan(70);
    }
  });

  it('reports the runner-up as the next best scoring shape', () => {
    const result = classifyFace(PROTOTYPE_FIXTURES.heart);

    expect(result.runnerUp).not.toBeNull();
    expect(result.runnerUp).not.toBe(result.shape);

    const runnerUpScore = result.scores.find((entry) => entry.shape === result.runnerUp);
    expect(runnerUpScore).toBeDefined();
    expect(result.scores[0].score).toBeLessThanOrEqual(runnerUpScore!.score);
  });

  it('returns probabilities that sum to one', () => {
    const result = classifyFace(PROTOTYPE_FIXTURES.square);
    const total = result.scores.reduce((sum, entry) => sum + entry.probability, 0);

    expect(result.scores).toHaveLength(FACE_SHAPES.length);
    expect(total).toBeCloseTo(1, 6);
  });

  it('orders scores best to worst', () => {
    const result = classifyFace(PROTOTYPE_FIXTURES.long);
    const sorted = [...result.scores].sort((a, b) => a.score - b.score);

    expect(result.scores.map((entry) => entry.shape)).toEqual(
      sorted.map((entry) => entry.shape),
    );
  });

  it('stays in range for proportions far outside anything realistic', () => {
    // Guards the softmax shift: without subtracting the best score these
    // exponents would overflow and every probability would become NaN.
    const result = classifyFace({
      foreheadRatio: 4,
      jawRatio: 3,
      lengthRatio: 9,
    });

    expect(result.shape).toBeDefined();
    expect(Number.isFinite(result.confidence)).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });
});