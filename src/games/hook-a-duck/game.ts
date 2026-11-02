import { canvasFont, recordScore, theme, type CarnivalGame } from '../../carnival';

const { width: WIDTH, height: HEIGHT } = theme.canvas;

export const CASTS = 10;
export const ROD_Y = 70;
export const HOOK_SPEED = 600;
export const CATCH_RADIUS = 26;
/** The stream is an oval loop the ducks float round. */
export const STREAM = { x: WIDTH / 2, y: 300, rx: 300, ry: 120 } as const;
/** Radians per second; every duck floats at the same pace. */
export const DUCK_SPEED = 0.5;
/** The numbers on the ducks' bases, one duck each. */
export const DUCK_VALUES = [5, 10, 5, 20, 5, 10, 5, 50] as const;

export interface Duck {
  /** Where the duck is round the loop, in radians. */
  angle: number;
  value: number;
  /** True while the duck is on the hook, out of the stream. */
  hooked: boolean;
}

export interface Hook {
  x: number;
  y: number;
  /** How far down this cast goes. */
  targetY: number;
  motion: 'ready' | 'lowering' | 'raising';
  /** The duck on the hook, if this cast caught one. */
  duck: Duck | null;
}

export interface Catch {
  x: number;
  y: number;
  value: number;
  age: number;
}

export interface HookADuckState {
  ducks: Duck[];
  hook: Hook;
  catches: Catch[];
  casts: number;
  score: number;
  phase: 'playing' | 'over';
}

export function createState(): HookADuckState {
  const ducks = DUCK_VALUES.map((value, i) => ({
    angle: (i / DUCK_VALUES.length) * Math.PI * 2,
    value,
    hooked: false,
  }));
  return {
    ducks,
    hook: { x: WIDTH / 2, y: ROD_Y, targetY: ROD_Y, motion: 'ready', duck: null },
    catches: [],
    casts: CASTS,
    score: 0,
    phase: 'playing',
  };
}

export function duckPosition(duck: Duck): { x: number; y: number } {
  return {
    x: STREAM.x + STREAM.rx * Math.cos(duck.angle),
    y: STREAM.y + STREAM.ry * Math.sin(duck.angle),
  };
}

/** The duck in the stream closest to the point and within reach of the hook, if any. */
export function duckAt(state: HookADuckState, x: number, y: number): Duck | null {
  let best: Duck | null = null;
  let bestDistance = CATCH_RADIUS;
  for (const duck of state.ducks) {
    if (duck.hooked) continue;
    const p = duckPosition(duck);
    const distance = Math.hypot(p.x - x, p.y - y);
    if (distance <= bestDistance) {
      best = duck;
      bestDistance = distance;
    }
  }
  return best;
}

/** Moves the rod sideways. The hook only follows while it is up. */
export function moveRod(state: HookADuckState, x: number): void {
  if (state.hook.motion === 'ready') state.hook.x = Math.min(Math.max(x, 0), WIDTH);
}

/** Lowers the hook towards `y`. Uses one cast. Returns false if nothing was cast. */
export function cast(state: HookADuckState, y: number): boolean {
  if (state.phase !== 'playing' || state.casts === 0 || state.hook.motion !== 'ready') return false;
  state.hook.targetY = Math.min(Math.max(y, ROD_Y + 1), HEIGHT - 40);
  state.hook.motion = 'lowering';
  state.casts -= 1;
  return true;
}

/** Advances the game by `dt` seconds. */
export function step(state: HookADuckState, dt: number): void {
  for (const duck of state.ducks) {
    if (!duck.hooked) duck.angle = (duck.angle + DUCK_SPEED * dt) % (Math.PI * 2);
  }

  const { hook } = state;
  if (hook.motion === 'lowering') {
    hook.y = Math.min(hook.y + HOOK_SPEED * dt, hook.targetY);
    if (hook.y >= hook.targetY) {
      const duck = duckAt(state, hook.x, hook.y);
      if (duck) {
        duck.hooked = true;
        hook.duck = duck;
        state.score += duck.value;
        state.catches.push({ x: hook.x, y: hook.y, value: duck.value, age: 0 });
      }
      hook.motion = 'raising';
    }
  } else if (hook.motion === 'raising') {
    hook.y = Math.max(hook.y - HOOK_SPEED * dt, ROD_Y);
    if (hook.y <= ROD_Y) {
      // Put the duck back in the stream for the next cast.
      if (hook.duck) hook.duck.hooked = false;
      hook.duck = null;
      hook.motion = 'ready';
    }
  }

  for (const c of state.catches) c.age += dt;
  state.catches = state.catches.filter((c) => c.age < 1);

  if (state.casts === 0 && hook.motion === 'ready') state.phase = 'over';
}

function drawDuck(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const { colors } = theme;
  ctx.fillStyle = colors.accent;
  ctx.beginPath();
  ctx.ellipse(x, y, 18, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 10, y - 12, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.stripeA;
  ctx.beginPath();
  ctx.moveTo(x + 17, y - 14);
  ctx.lineTo(x + 26, y - 11);
  ctx.lineTo(x + 17, y - 8);
  ctx.fill();
  ctx.fillStyle = colors.background;
  ctx.beginPath();
  ctx.arc(x + 12, y - 14, 2, 0, Math.PI * 2);
  ctx.fill();
}

function draw(ctx: CanvasRenderingContext2D, state: HookADuckState) {
  const { colors } = theme;

  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Booth awning.
  const stripe = WIDTH / 16;
  for (let i = 0; i < 16; i++) {
    ctx.fillStyle = i % 2 === 0 ? colors.stripeA : colors.stripeB;
    ctx.fillRect(i * stripe, 0, stripe, 40);
  }

  // The stream: a channel of water round a wooden island.
  ctx.fillStyle = colors.water;
  ctx.beginPath();
  ctx.ellipse(STREAM.x, STREAM.y, STREAM.rx + 36, STREAM.ry + 36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.wood;
  ctx.beginPath();
  ctx.ellipse(STREAM.x, STREAM.y, STREAM.rx - 36, STREAM.ry - 36, 0, 0, Math.PI * 2);
  ctx.fill();

  for (const duck of state.ducks) {
    if (duck.hooked) continue;
    const p = duckPosition(duck);
    drawDuck(ctx, p.x, p.y);
  }

  // Rod along the top, with the line and hook hanging from it.
  const { hook } = state;
  ctx.fillStyle = colors.wood;
  ctx.fillRect(hook.x - 60, ROD_Y - 24, 120, 8);
  ctx.strokeStyle = colors.muted;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(hook.x, ROD_Y - 16);
  ctx.lineTo(hook.x, hook.y);
  ctx.stroke();
  ctx.strokeStyle = colors.text;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(hook.x - 6, hook.y, 6, 0, Math.PI);
  ctx.stroke();
  if (hook.duck) drawDuck(ctx, hook.x, hook.y + 18);

  ctx.textAlign = 'center';
  ctx.font = canvasFont('title', 'bold');
  for (const c of state.catches) {
    ctx.globalAlpha = 1 - c.age;
    ctx.fillStyle = colors.accent;
    ctx.fillText(`+${c.value}`, c.x, c.y - 30 - c.age * 40);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = colors.text;
  ctx.font = canvasFont('body', 'bold');
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${state.score}`, 16, HEIGHT - 20);
  ctx.textAlign = 'right';
  ctx.fillText(`Casts ${state.casts}/${CASTS}`, WIDTH - 16, HEIGHT - 20);

  if (state.phase === 'over') {
    ctx.fillStyle = colors.background;
    ctx.globalAlpha = 0.8;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.accent;
    ctx.font = canvasFont('title', 'bold');
    ctx.fillText(`Out of casts! You scored ${state.score}`, WIDTH / 2, HEIGHT / 2);
    ctx.fillStyle = colors.text;
    ctx.font = canvasFont('body');
    ctx.fillText('Click to play again', WIDTH / 2, HEIGHT / 2 + 40);
  }
}

export const hookADuck: CarnivalGame = {
  id: 'hook-a-duck',
  name: 'Hook a Duck',
  description:
    'Lower your hook to catch the ducks floating by. Each duck hides a score on its base.',

  start(canvas) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    let state = createState();
    let scoreRecorded = false;

    const toCanvas = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((event.clientX - rect.left) / rect.width) * WIDTH,
        y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
      };
    };
    const onMove = (event: PointerEvent) => moveRod(state, toCanvas(event).x);
    const onDown = (event: PointerEvent) => {
      const point = toCanvas(event);
      if (state.phase === 'over') {
        state = createState();
        scoreRecorded = false;
      } else {
        moveRod(state, point.x);
        cast(state, point.y);
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
        recordScore(hookADuck.id, state.score);
        scoreRecorded = true;
      }
      draw(ctx, state);
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

export default hookADuck;
