import { describe, expect, it } from 'vitest';

import { buildSystemPrompt, describeCustomer } from './prompt';
import type { CustomerContext } from './prompt';

const base: CustomerContext = {
  username: 'rei',
  faceShape: null,
  faceShapeSource: null,
  faceShapeConfidence: null,
  faceMeasurements: null,
  createdAt: '2026-01-04T09:00:00.000Z',
};

const measured: CustomerContext = {
  ...base,
  faceShape: 'diamond',
  faceShapeSource: 'scanned',
  faceShapeConfidence: 94,
  faceMeasurements: { forehead: 82, jaw: 74, length: 150 },
};

describe('describeCustomer', () => {
  it('says so plainly when there is no shape at all', () => {
    const text = describeCustomer(base);

    expect(text).toContain('not set');
    // Must not imply a measurement that never happened.
    expect(text).not.toContain('measured by the analyzer');
    expect(text).not.toContain('%');
  });

  it('gives a measured shape its confidence', () => {
    const text = describeCustomer(measured);

    expect(text).toContain('diamond');
    expect(text).toContain('measured by the analyzer');
    expect(text).toContain('94% confidence');
    expect(text).toContain('forehead 82%');
    expect(text).toContain('jaw 74%');
    expect(text).toContain('length 150%');
  });

  it('marks a self-reported shape as a claim, not a reading', () => {
    const text = describeCustomer({ ...base, faceShape: 'round', faceShapeSource: 'manual' });

    expect(text).toContain('round');
    expect(text).toContain('chosen by the customer');
    expect(text).toContain('Not measured');
    // The whole point: no confidence figure to lean on.
    expect(text).not.toContain('confidence');
  });

  it('omits measurements when a shape was picked by hand', () => {
    const text = describeCustomer({
      ...base,
      faceShape: 'round',
      faceShapeSource: 'manual',
      faceMeasurements: { forehead: 90, jaw: 90, length: 90 },
    });

    expect(text).not.toContain('Landmarks');
  });

  it('explains what the landmark percentages mean', () => {
    const text = describeCustomer(measured);

    // Without this the model cannot tell 82% is narrower than the cheekbones.
    expect(text).toContain('100% is the cheekbones');
    expect(text).toContain('over is wider');
  });

  it('survives partial measurements', () => {
    const text = describeCustomer({
      ...base,
      faceShape: 'oval',
      faceShapeSource: 'scanned',
      faceShapeConfidence: 70,
      faceMeasurements: { forehead: null, jaw: null, length: null },
    });

    expect(text).toContain('unknown');
    expect(text).not.toContain('null');
  });

  it('keeps the username and joining date', () => {
    const text = describeCustomer(base);

    expect(text).toContain('rei');
    expect(text).toContain('2026-01-04');
  });

  it('handles a missing username without leaving a hole', () => {
    expect(describeCustomer({ ...base, username: null })).toContain('Username: not set');
  });
});

describe('buildSystemPrompt', () => {
  it('carries the customer block after the standing prompts', async () => {
    const prompt = await buildSystemPrompt(measured);

    expect(prompt).toContain('# This customer');
    expect(prompt).toContain('diamond');
    expect(prompt.indexOf('# This customer')).toBeGreaterThan(prompt.indexOf('You are Trimo'));
  });

  it('describes all seven shapes in the product prompt', async () => {
    const prompt = await buildSystemPrompt(base);

    for (const shape of ['oval', 'round', 'square', 'heart', 'diamond', 'long', 'triangle']) {
      expect(prompt, `missing ${shape}`).toContain(shape);
    }
  });

  it('no longer claims the analyzer returns an oblong face', async () => {
    expect(await buildSystemPrompt(base)).not.toContain('oblong');
  });

  it('tells the model how to treat a hand-picked shape', async () => {
    const prompt = await buildSystemPrompt(base);

    expect(prompt).toContain('How much to trust the shape reading');
    expect(prompt).toContain('Chosen by the customer');
  });
});