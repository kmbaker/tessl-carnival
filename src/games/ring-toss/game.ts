import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const RINGS_PER_ROUND = 8;
/** Seconds a ring spends in the air. */
export const FLIGHT_TIME = 0.6;
/** How close to a bottle's neck, in pixels, a ring has to land to score. */
export const NECK_RADIUS = 14;
/** How far, in pixels, the thrower's hand sways left and right of the aim. */
export const SWAY = 36;
/** Seconds for one full sway, left and back. */
export const SWAY_PERIOD = 1.6;
export const THROWER = { x: WIDTH / 2, y: HEIGHT - 40 } as const;
/** Back row first: bottles further back score more. */
export const ROWS = [
  { y: 110, points: 30 },
  { y: 175, points: 20 },
  { y: 240, points: 10 },
];
const BOTTLES_PER_ROW = 5;
const BOTTLE_SPACING = 110;

export interface Bottle {
  /** The top of the bottle's neck, where a ring has to land. */
  x: number;
  y: number;
  points: number;
  ringed: boolean;
}

export interface Ring {
  /** Where the ring will land. */
  toX: number;
  toY: number;
  /** Seconds since it was thrown. */
  age: number;
}

export interface RingTossState {
  bottles: Bottle[];
  ring: Ring | null;
  rings: number;
  score: number;
  /** Seconds since the round started; drives the sway. */
  time: number;
  /** The last ring to land, for drawing. */
  last: { x: number; y: number; hit: boolean; age: number } | null;
  phase: 'playing' | 'over';
}

export function createState(): RingTossState {
  const left = WIDTH / 2 - (BOTTLE_SPACING * (BOTTLES_PER_ROW - 1)) / 2;
  const bottles = ROWS.flatMap((row) =>
    Array.from({ length: BOTTLES_PER_ROW }, (_, i) => ({
      x: left + BOTTLE_SPACING * i,
      y: row.y,
      points: row.points,
      ringed: false,
    })),
  );
  return {
    bottles,
    ring: null,
    rings: RINGS_PER_ROUND,
    score: 0,
    time: 0,
    last: null,
    phase: 'playing',
  };
}

/** How far the thrower's hand has swayed from the aim at this moment, in pixels. */
export function swayOffset(time: number): number {
  return SWAY * Math.sin((time / SWAY_PERIOD) * Math.PI * 2);
}

/** The bottle a ring landing here would ring, if any. A bottle already wearing a ring can't take another. */
export function bottleAt(state: RingTossState, x: number, y: number): Bottle | undefined {
  return state.bottles.find((b) => !b.ringed && Math.hypot(x - b.x, y - b.y) <= NECK_RADIUS);
}

/** Throws one ring towards the aim, pushed sideways by the sway. Returns false if nothing was thrown. */
export function toss(state: RingTossState, aimX: number, aimY: number): boolean {
  if (state.phase !== 'playing' || state.rings === 0 || state.ring) return false;
  state.ring = {
    toX: aimX + swayOffset(state.time),
    toY: Math.min(aimY, THROWER.y - 1),
    age: 0,
  };
  state.rings -= 1;
  return true;
}

/** Advances the game by `dt` seconds. */
export function step(state: RingTossState, dt: number): void {
  state.time += dt;
  if (state.last) state.last.age += dt;

  const ring = state.ring;
  if (ring) {
    ring.age += dt;
    if (ring.age >= FLIGHT_TIME) {
      const bottle = bottleAt(state, ring.toX, ring.toY);
      if (bottle) {
        bottle.ringed = true;
        state.score += bottle.points;
      }
      state.last = { x: ring.toX, y: ring.toY, hit: Boolean(bottle), age: 0 };
      state.ring = null;
    }
  }

  if (state.rings === 0 && !state.ring) state.phase = 'over';
}

function drawRing(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.strokeStyle = theme.colors.accent;
  ctx.lineWidth = 4 * scale;
  ctx.beginPath();
  ctx.ellipse(x, y, 18 * scale, 7 * scale, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function draw(ctx: CanvasRenderingContext2D, state: RingTossState, aim: { x: number; y: number }) {
  const { colors } = theme;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Booth awning.
  const stripe = WIDTH / 16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
    ctx.fillRect(i * stripe, 0, stripe, 40);
  }

  for (const row of ROWS) {
    ctx.fillStyle = colors.wood;
    ctx.fillRect(60, row.y + 44, WIDTH - 120, 8);
  }

  for (const bottle of state.bottles) {
    // Body, then neck, standing on the shelf below the neck's tip.
    ctx.fillStyle = colors.water;
    ctx.fillRect(bottle.x - 14, bottle.y + 18, 28, 26);
    ctx.fillRect(bottle.x - 5, bottle.y, 10, 20);
    ctx.fillStyle = colors.surface;
    ctx.fillRect(bottle.x - 5, bottle.y - 2, 10, 4);
    if (bottle.ringed) drawRing(ctx, bottle.x, bottle.y + 10, 0.8);
  }

  ctx.fillStyle = colors.muted;
  ctx.font = canvasFont('small');
  ctx.textAlign = 'left';
  for (const row of ROWS) ctx.fillText(`${row.points}`, 20, row.y + 30);

  if (state.last && !state.last.hit && state.last.age < 0.6) {
    ctx.globalAlpha = 1 - state.last.age / 0.6;
    drawRing(ctx, state.last.x, state.last.y, 0.8);
    ctx.globalAlpha = 1;
  }

  // The aim, swayed the way the next ring would fly.
  if (state.phase === 'playing' && !state.ring && state.rings > 0) {
    const x = aim.x + swayOffset(state.time);
    const y = Math.min(aim.y, THROWER.y - 1);
    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, NECK_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (state.ring) {
    // Fly in a straight line, growing towards the top of the arc and shrinking as it lands.
    const t = Math.min(state.ring.age / FLIGHT_TIME, 1);
    const x = THROWER.x + (state.ring.toX - THROWER.x) * t;
    const y = THROWER.y + (state.ring.toY - THROWER.y) * t - Math.sin(t * Math.PI) * 60;
    drawRing(ctx, x, y, 1 + Math.sin(t * Math.PI) * 0.4 - t * 0.2);
  }

  if (!state.ring && state.rings > 0) drawRing(ctx, THROWER.x, THROWER.y, 1);

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, HEIGHT - 20);
  ctx.textAlign = 'right';
  ctx.fillText(`Rings ${state.rings}/${RINGS_PER_ROUND}`, WIDTH - 16, HEIGHT - 20);

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Out of rings! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 40);
  }
}

export const ringToss: CarnivalGame = {
  id: 'ring-toss',
  name: 'Ring Toss',
  description:
    'Land rings on the bottle necks before you run out. Bottles further back score more.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;
    const aim = { x: WIDTH / 2, y: ROWS[0].y };

    const toCanvas = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
      };
    };
    const onMove = (event: PointerEvent) => Object.assign(aim, toCanvas(event));
    const onDown = (event: PointerEvent) => {
      Object.assign(aim, toCanvas(event));
      if (state.phase === 'over') {
        state = createState();
        scoreRecorded = false;
      } else {
        toss(state, aim.x, aim.y);
      }
    };
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerdown', onDown);

    let frame = 0;
    let last = performance.now();
    const loop = (time: number) => {
      // Cap the step so a background tab doesn't teleport everything.
      const dt = Math.min((time - last) / 1000, 0.05);
      last = time;
      step(state, dt);
      if (state.phase === 'over' && !scoreRecorded) {
        recordScore(ringToss.id, state.score);
        scoreRecorded = true;
      }
      draw(ctx, state, aim);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
    };
  },
};

export default ringToss;
