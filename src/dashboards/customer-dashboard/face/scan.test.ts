import { describe, expect, it } from 'vitest';

import { RESOLVE_AFTER } from './config';
import { MeasurementAverager, SETTLED_SAMPLES } from './landmarks';
import { scanProgress, shouldResolve } from './scan';

/**
 * The progress bar and the resolve condition must read the same counter.
 *
 * They used not to. The bar counted good frames against RESOLVE_AFTER, while
 * the condition checked the averager's retained sample count, which is capped
 * by its window. The bar reached 100% and the scan never resolved.
 */
describe('scan resolution', () => {
  it('resolves exactly when the progress bar completes', () => {
    expect(scanProgress(RESOLVE_AFTER)).toBe(1);
    expect(shouldResolve(RESOLVE_AFTER)).toBe(true);
  });

  it('does not resolve while the bar is still filling', () => {
    expect(shouldResolve(RESOLVE_AFTER - 1)).toBe(false);
    expect(scanProgress(RESOLVE_AFTER - 1)).toBeLessThan(1);
    expect(shouldResolve(0)).toBe(false);
  });

  it('reaches resolution no matter how many frames arrive', () => {
    // The failure this guards: a resolve threshold above the averaging window
    // is unreachable, because the window discards samples before the count
    // can get there.
    const averager = new MeasurementAverager();
    const goodFrames = RESOLVE_AFTER * 3;

    for (let frame = 0; frame < goodFrames; frame += 1) {
      averager.add({ foreheadRatio: 1, jawRatio: 1, lengthRatio: 1 });
      expect(shouldResolve(frame + 1)).toBe(frame + 1 >= RESOLVE_AFTER);
    }
  });

  it('never resolves off the averager, which is capped', () => {
    // States the old behaviour as an explicit regression guard. The averager
    // saturates at its window, so it must not be what the resolve test reads.
    const averager = new MeasurementAverager();
    for (let frame = 0; frame < RESOLVE_AFTER * 3; frame += 1) {
      averager.add({ foreheadRatio: 1, jawRatio: 1, lengthRatio: 1 });
    }

    expect(averager.size).toBe(SETTLED_SAMPLES);
    expect(SETTLED_SAMPLES).toBeLessThan(RESOLVE_AFTER);
    expect(averager.size >= RESOLVE_AFTER).toBe(false);
  });

  it('keeps the averaging window inside the resolve threshold', () => {
    // Otherwise the final reading averages fewer samples than the window is
    // sized for, and the sample count says otherwise.
    expect(SETTLED_SAMPLES).toBeLessThanOrEqual(RESOLVE_AFTER);
  });
});