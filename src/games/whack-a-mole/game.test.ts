import { describe, expect, it } from 'vitest';
import {
  COLUMNS,
  HOLE_RADIUS,
  POINTS_PER_WHACK,
  ROUND_SECONDS,
  ROWS,
  SPAWN_GAP,
  UP_TIME,
  createState,
  isMoleUp,
  popUp,
  spawnGap,
  step,
  upTime,
  whack,
} from './game';

const first = () => 0;

describe('whack-a-mole', () => {
  it('starts with a full clock, no score and every mole down', () => {
    const state = createState();
    expect(state.holes).toHaveLength(COLUMNS * ROWS);
    expect(state.timeLeft).toBe(ROUND_SECONDS);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.holes.some(isMoleUp)).toBe(false);
  });

  it('pops a mole up once the spawn wait runs out', () => {
    const state = createState();
    step(state, SPAWN_GAP.start + 0.01, first);
    expect(state.holes.filter(isMoleUp)).toHaveLength(1);
  });

  it('drops a mole back down when its time is up', () => {
    const state = createState();
    popUp(state, first);
    state.nextSpawn = 100;
    step(state, UP_TIME.start + 0.01);
    expect(state.holes.some(isMoleUp)).toBe(false);
  });

  it('scores a whack on a mole that is up and knocks it down', () => {
    const state = createState();
    popUp(state, first);
    const hole = state.holes[0];
    expect(whack(state, hole.x + HOLE_RADIUS / 2, hole.y)).toBe(true);
    expect(state.score).toBe(POINTS_PER_WHACK);
    expect(isMoleUp(hole)).toBe(false);
  });

  it('scores nothing for a whack on an empty hole or a miss', () => {
    const state = createState();
    popUp(state, first);
    const empty = state.holes[1];
    expect(whack(state, empty.x, empty.y)).toBe(false);
    expect(whack(state, state.holes[0].x + HOLE_RADIUS + 1, state.holes[0].y + 200)).toBe(false);
    expect(state.score).toBe(0);
  });

  it('scores a mole only once', () => {
    const state = createState();
    popUp(state, first);
    const hole = state.holes[0];
    whack(state, hole.x, hole.y);
    expect(whack(state, hole.x, hole.y)).toBe(false);
    expect(state.score).toBe(POINTS_PER_WHACK);
  });

  it('pops moles up faster and for less time as the round goes on', () => {
    const state = createState();
    expect(upTime(state)).toBe(UP_TIME.start);
    expect(spawnGap(state)).toBe(SPAWN_GAP.start);
    state.timeLeft = ROUND_SECONDS / 2;
    expect(upTime(state)).toBeLessThan(UP_TIME.start);
    expect(spawnGap(state)).toBeLessThan(SPAWN_GAP.start);
    state.timeLeft = 0;
    expect(upTime(state)).toBeCloseTo(UP_TIME.end);
    expect(spawnGap(state)).toBeCloseTo(SPAWN_GAP.end);
  });

  it('only pops a mole from an empty hole', () => {
    const state = createState();
    for (const hole of state.holes) hole.up = 1;
    expect(popUp(state, first)).toBe(false);
  });

  it('ends the round when the clock runs out, and stops scoring', () => {
    const state = createState();
    popUp(state, first);
    state.timeLeft = 0.01;
    step(state, 0.05);
    expect(state.phase).toBe('over');
    expect(state.holes.some(isMoleUp)).toBe(false);
    const hole = state.holes[0];
    hole.up = 1;
    expect(whack(state, hole.x, hole.y)).toBe(false);
    expect(state.score).toBe(0);
  });
});
