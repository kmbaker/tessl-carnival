import { describe, expect, it } from 'vitest';
import {
  CASTS,
  DUCK_VALUES,
  ROD_Y,
  cast,
  createState,
  duckAt,
  duckPosition,
  moveRod,
  step,
  type HookADuckState,
} from './game';

/** Casts at the first duck with the hook almost down, so one short step lands it. */
function castAtFirstDuck(state: HookADuckState) {
  const p = duckPosition(state.ducks[0]);
  moveRod(state, p.x);
  cast(state, p.y);
  state.hook.y = p.y - 1;
  return state.ducks[0];
}

function finishCast(state: HookADuckState) {
  for (let i = 0; i < 100 && state.hook.motion !== 'ready'; i++) step(state, 0.05);
}

describe('hook a duck', () => {
  it('starts with every cast, no score and the hook up', () => {
    const state = createState();
    expect(state.casts).toBe(CASTS);
    expect(state.score).toBe(0);
    expect(state.phase).toBe('playing');
    expect(state.hook.motion).toBe('ready');
    expect(state.ducks.map((d) => d.value)).toEqual([...DUCK_VALUES]);
  });

  it('floats the ducks round the stream', () => {
    const state = createState();
    const before = duckPosition(state.ducks[0]);
    step(state, 0.5);
    expect(duckPosition(state.ducks[0])).not.toEqual(before);
  });

  it('uses one cast per cast, and none while the hook is down', () => {
    const state = createState();
    expect(cast(state, 300)).toBe(true);
    expect(state.casts).toBe(CASTS - 1);
    expect(cast(state, 300)).toBe(false);
    expect(state.casts).toBe(CASTS - 1);
  });

  it('cannot cast once the casts run out', () => {
    const state = createState();
    state.casts = 0;
    expect(cast(state, 300)).toBe(false);
    expect(state.hook.motion).toBe('ready');
  });

  it('only moves the rod while the hook is up', () => {
    const state = createState();
    moveRod(state, 100);
    expect(state.hook.x).toBe(100);
    cast(state, 300);
    moveRod(state, 600);
    expect(state.hook.x).toBe(100);
  });

  it('scores the number on the base of a hooked duck', () => {
    const state = createState();
    const duck = castAtFirstDuck(state);
    step(state, 0.01);
    expect(duck.hooked).toBe(true);
    expect(state.hook.duck).toBe(duck);
    expect(state.score).toBe(duck.value);
  });

  it('puts the duck back in the stream once the hook is up', () => {
    const state = createState();
    const duck = castAtFirstDuck(state);
    step(state, 0.01);
    finishCast(state);
    expect(state.hook.y).toBe(ROD_Y);
    expect(duck.hooked).toBe(false);
    expect(state.hook.duck).toBeNull();
  });

  it('scores nothing when the hook misses', () => {
    const state = createState();
    moveRod(state, 400);
    cast(state, 300); // The middle of the island, away from the stream.
    finishCast(state);
    expect(state.score).toBe(0);
  });

  it('finds a duck within reach and ignores one on the hook', () => {
    const state = createState();
    const p = duckPosition(state.ducks[0]);
    expect(duckAt(state, p.x + 10, p.y)).toBe(state.ducks[0]);
    expect(duckAt(state, p.x + 100, p.y)).toBeNull();
    state.ducks[0].hooked = true;
    expect(duckAt(state, p.x, p.y)).toBeNull();
  });

  it('ends the round once the last cast is back up', () => {
    const state = createState();
    state.casts = 1;
    cast(state, 300);
    step(state, 0.05);
    expect(state.phase).toBe('playing');
    finishCast(state);
    expect(state.phase).toBe('over');
  });
});
