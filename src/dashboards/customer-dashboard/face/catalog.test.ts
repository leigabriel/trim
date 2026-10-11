import { describe, expect, it } from 'vitest';

import { matchedStyles, STYLES, trendingStyles } from './catalog';
import { SHAPE_ADVICE } from './advice';
import { FACE_SHAPES } from './shapes';
import type { FaceShapeName } from './shapes';

describe('style catalogue', () => {
  it('has an image for every style, and no image is shared', () => {
    const images = STYLES.map((style) => style.image);
    expect(new Set(images).size).toBe(images.length);
  });

  it('offers at least two cuts for every shape', () => {
    for (const shape of FACE_SHAPES) {
      expect(matchedStyles(shape).length, `no cuts for ${shape}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('has advice for every shape, and nothing orphaned', () => {
    expect(Object.keys(SHAPE_ADVICE).sort()).toEqual([...FACE_SHAPES].sort());
    for (const shape of FACE_SHAPES) {
      expect(SHAPE_ADVICE[shape].shape).toBe(shape);
      expect(SHAPE_ADVICE[shape].cuts.length).toBeGreaterThanOrEqual(3);
      expect(SHAPE_ADVICE[shape].askTrimo.length).toBeGreaterThan(0);
    }
  });

  it('never recommends a cut that does not suit the shape', () => {
    const shapes = FACE_SHAPES as readonly FaceShapeName[];
    for (const shape of shapes) {
      for (const style of matchedStyles(shape)) {
        expect(style.suits, `${style.name} matched ${shape}`).toContain(shape);
        expect(style.match).toBeGreaterThan(0);
      }
    }
  });

  it('excludes cuts that do not suit the shape', () => {
    const excluded = STYLES.filter((style) => !style.suits.includes('triangle')).map(
      (style) => style.id,
    );
    expect(excluded.length).toBeGreaterThan(0);

    for (const style of matchedStyles('triangle')) {
      expect(excluded).not.toContain(style.id);
    }
  });

  it('ranks the strongest cut first', () => {
    for (const shape of FACE_SHAPES) {
      const matches = matchedStyles(shape);
      const scores = matches.map((style) => style.match);
      expect(scores, `${shape} not sorted`).toEqual([...scores].sort((a, b) => b - a));

      // The leader is the best this shape has, not necessarily a perfect one.
      // Round and Long have no strength-5 cut, and that is a real gap in the
      // catalogue rather than a bug to paper over.
      const best = Math.max(...matches.map((style) => style.strength));
      expect(matches[0].strength, `${shape} leader`).toBe(best);
      expect(matches[0].match).toBe(Math.round((best / 5) * 94));
    }
  });

  it('never reports a perfect match', () => {
    for (const shape of FACE_SHAPES) {
      for (const style of matchedStyles(shape)) {
        expect(style.match).toBeLessThanOrEqual(94);
      }
    }
  });

  it('returns nothing when no shape is set, rather than everything', () => {
    expect(matchedStyles(null)).toEqual([]);
  });

  it('shows trending with no shape, scoring everything zero', () => {
    const trending = trendingStyles(null);

    expect(trending.length).toBeGreaterThan(0);
    for (const style of trending) {
      expect(style.match).toBe(0);
    }
  });

  it('orders trending by its editorial rank', () => {
    const ranks = trendingStyles('oval').map((style) => style.trend);
    expect(ranks).toEqual([...ranks].sort((a, b) => a! - b!));
  });

  it('scores trending against the shape when one is known', () => {
    const scored = trendingStyles('oval');
    const suited = scored.filter((style) => style.suits.includes('oval'));

    expect(suited.length).toBeGreaterThan(0);
    for (const style of suited) expect(style.match).toBeGreaterThan(0);
  });
});