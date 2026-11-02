import { describe, expect, it } from 'vitest';
import {
  FLIGHT_TIME,
  NECK_RADIUS,
  RINGS_PER_ROUND,
  ROWS,
  SWAY,
  SWAY_PERIOD,
  bottleAt,
  createState,
  step,
  swayOffset,
  toss,
} from './game';

describe('ring toss', () => {
  it('starts with a full set of rings, a grid of bottles and no score', () => {
    const state = createState();
    expect(state.rings).toBe(RINGS_PER_ROUND);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.bottles.length).toBe(ROWS.length * 5);
    expect(state.bottles.every((b) => !b.ringed)).toBe(true);
  });

  it('uses one ring per toss', () => {
    const state = createState();
    expect(toss(state, 400, 110)).toBe(true);
    expect(state.rings).toBe(RINGS_PER_ROUND - 1);
    expect(state.ring).not.toBeNull();
  });

  it('throws one ring at a time', () => {
    const state = createState();
    toss(state, 400, 110);
    expect(toss(state, 400, 110)).toBe(false);
    expect(state.rings).toBe(RINGS_PER_ROUND - 1);
  });

  it('cannot toss once the rings run out', () => {
    const state = createState();
    state.rings = 0;
    expect(toss(state, 400, 110)).toBe(false);
    expect(state.ring).toBeNull();
  });

  it('scores a ring that lands on a bottle neck', () => {
    const state = createState();
    const bottle = state.bottles[0];
    toss(state, bottle.x, bottle.y);
    step(state, FLIGHT_TIME);
    expect(state.score).toBe(bottle.points);
    expect(bottle.ringed).toBe(true);
    expect(state.ring).toBeNull();
  });

  it('scores nothing for a ring that misses every neck', () => {
    const state = createState();
    toss(state, 10, 400);
    step(state, FLIGHT_TIME);
    expect(state.score).toBe(0);
    expect(state.bottles.some((b) => b.ringed)).toBe(false);
  });

  it('keeps the ring in the air until its flight ends', () => {
    const state = createState();
    const bottle = state.bottles[0];
    toss(state, bottle.x, bottle.y);
    step(state, FLIGHT_TIME / 2);
    expect(state.ring).not.toBeNull();
    expect(state.score).toBe(0);
  });

  it('scores bottles further back higher', () => {
    const state = createState();
    const back = state.bottles.find((b) => b.y === ROWS[0].y)!;
    const front = state.bottles.find((b) => b.y === ROWS[ROWS.length - 1].y)!;
    expect(back.points).toBeGreaterThan(front.points);
  });

  it('lands only on a neck within reach, and never on a bottle already ringed', () => {
    const state = createState();
    const bottle = state.bottles[0];
    expect(bottleAt(state, bottle.x + NECK_RADIUS - 1, bottle.y)).toBe(bottle);
    expect(bottleAt(state, bottle.x + NECK_RADIUS + 1, bottle.y)).toBeUndefined();
    bottle.ringed = true;
    expect(bottleAt(state, bottle.x, bottle.y)).toBeUndefined();
  });

  it('sways the throw sideways over time', () => {
    expect(swayOffset(0)).toBeCloseTo(0);
    expect(swayOffset(SWAY_PERIOD / 4)).toBeCloseTo(SWAY);
    const state = createState();
    state.time = SWAY_PERIOD / 4;
    toss(state, 400, 110);
    expect(state.ring!.toX).toBeCloseTo(400 + SWAY);
  });

  it('ends the round when the last ring has landed', () => {
    const state = createState();
    state.rings = 1;
    toss(state, 10, 400);
    step(state, FLIGHT_TIME / 2);
    expect(state.phase).toBe('playing');
    step(state, FLIGHT_TIME);
    expect(state.phase).toBe('over');
  });
});
