import { describe, expect, it } from 'vitest';

import {
  EXPECTED_GALLERY_DIRS,
  GALLERY_SIZE,
  galleryFor,
  shapeGallery,
  trendingGallery,
} from './gallery';
import { FACE_SHAPES } from './shapes';

describe('shape galleries', () => {
  it('addresses one folder per shape plus trending', () => {
    expect(EXPECTED_GALLERY_DIRS).toEqual([...FACE_SHAPES, 'trending']);
  });

  it('numbers slots so a gallery sorts the way a human numbers them', () => {
    for (const shape of FACE_SHAPES) {
      const images = shapeGallery(shape);
      expect(images, `${shape} count`).toHaveLength(GALLERY_SIZE);
      expect(images[0]).toBe(`/assets/faceshapes/${shape}/01.png`);
      expect(images.at(-1)).toBe(`/assets/faceshapes/${shape}/10.png`);
    }
  });

  it('gives every shape a distinct, correctly rooted set of paths', () => {
    const seen = new Set<string>();

    for (const shape of FACE_SHAPES) {
      for (const src of shapeGallery(shape)) {
        expect(src.startsWith(`/assets/faceshapes/${shape}/`)).toBe(true);
        // A duplicate would mean one shape is showing another's art.
        expect(seen.has(src), `duplicate path ${src}`).toBe(false);
        seen.add(src);
      }
    }

    expect(seen.size).toBe(FACE_SHAPES.length * GALLERY_SIZE);
  });

  it('falls back to trending when no shape is set', () => {
    expect(galleryFor(null)).toEqual(trendingGallery());
    expect(galleryFor(null)).toHaveLength(GALLERY_SIZE);
  });

  it('keeps trending in its own folder, out of the shape sets', () => {
    for (const src of trendingGallery()) {
      expect(src).toMatch(/^\/assets\/faceshapes\/trending\/\d{2}\.png$/);
    }
  });
});