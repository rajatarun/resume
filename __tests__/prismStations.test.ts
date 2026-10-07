/**
 * The prism landing lights up "Software Architect", "Photographer", "AI Researcher" or
 * "Traveller" in step with the walk video, and jumps the video when one is
 * picked. These hold the timings to the shape that needs: four stops, in
 * walk order, covering the whole loop with no gap or overlap, each jump
 * landing inside its own stop.
 */
import { PRISM_LOOP_SECONDS, PRISM_STATIONS, stationIndexAt, stationProgressAt } from '../lib/prismStations';

describe('prism stations', () => {
  it('are the four sides of Tarun, in the order he walks past them', () => {
    expect(PRISM_STATIONS.map((s) => s.label)).toEqual(['Software Architect', 'Photographer', 'AI Researcher', 'Traveller']);
  });

  it('tile the loop exactly: no gaps, no overlaps', () => {
    expect(PRISM_STATIONS[0].start).toBe(0);
    expect(PRISM_STATIONS[PRISM_STATIONS.length - 1].end).toBe(PRISM_LOOP_SECONDS);
    for (let i = 1; i < PRISM_STATIONS.length; i++) {
      expect(PRISM_STATIONS[i].start).toBe(PRISM_STATIONS[i - 1].end);
    }
  });

  it('jump into their own stop', () => {
    PRISM_STATIONS.forEach((station, index) => expect(stationIndexAt(station.seekTo)).toBe(index));
  });

  it('read the stop at a time, including past the end of a loop', () => {
    expect(stationIndexAt(0)).toBe(0);
    expect(stationIndexAt(2)).toBe(1);
    expect(stationIndexAt(4.6)).toBe(2);
    expect(stationIndexAt(7.99)).toBe(3);
    expect(stationIndexAt(PRISM_LOOP_SECONDS + 2)).toBe(1);
    expect(stationIndexAt(Number.NaN)).toBe(0);
  });

  it('report progress through the current stop', () => {
    expect(stationProgressAt(0)).toBe(0);
    expect(stationProgressAt(0.7)).toBeCloseTo(0.5);
    expect(stationProgressAt(4.99)).toBeGreaterThan(0.99);
  });

  it('link only to pages that exist, or say so', () => {
    for (const station of PRISM_STATIONS) {
      if (station.href === null) expect(station.hrefLabel).toMatch(/coming soon/i);
      else expect(station.href).toMatch(/^(#prism-|\/)/);
    }
  });
});
