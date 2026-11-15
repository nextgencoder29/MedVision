/**
 * Framing check for follow-up photos.
 *
 * Compares a newly captured photo with the previous visit's photo of the same site and
 * reports how well the framing matches, plus which way the lesion has shifted. It runs
 * before the photo is accepted, so the health worker can retake while the patient is
 * still there. It is a capture aid only: it does not measure the lesion. Registration
 * for the actual change measurement is done later in lib/change.ts.
 *
 * Method: both photos are reduced to a small greyscale grid and smoothed, so skin
 * texture and sensor noise matter less than overall layout. The new photo is then slid
 * over the old one by up to ±12% of the frame, and the shift with the highest
 * normalised cross-correlation (NCC) is kept. A large best shift lowers the score,
 * because even a perfect match at the wrong position means the framing moved.
 */

export interface Alignment {
  /** 0 to 1. Correlation at the best shift, reduced for large shifts. */
  score: number;
  /** Horizontal shift of the new photo's content, as a fraction of frame width. Positive = content sits further right. */
  dx: number;
  /** Vertical shift as a fraction of frame height. Positive = content sits lower. */
  dy: number;
}

export type AlignmentLevel = "good" | "fair" | "poor";

const W = 64;
const H = 48;
const MAX_DX = 8; // 8 / 64 = 12.5% of width
const MAX_DY = 6; // 6 / 48 = 12.5% of height
const SHIFT_HINT = 0.04; // shifts under 4% of the frame are not worth mentioning

export const GOOD_ALIGNMENT = 0.8;
export const FAIR_ALIGNMENT = 0.6;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Centre-crops the image to 4:3, scales it to W×H, converts to greyscale and applies two 3×3 box blurs. */
function greyGrid(img: HTMLImageElement): Float32Array {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  const k = Math.max(W / img.width, H / img.height);
  ctx.drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k);
  const px = ctx.getImageData(0, 0, W, H).data;
  const g = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) g[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
  for (let pass = 0; pass < 2; pass++) {
    const src = g.slice();
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        let t = 0;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) t += src[(y + j) * W + x + i];
        g[y * W + x] = t / 9;
      }
    }
  }
  return g;
}

/** Normalised cross-correlation of the inner region of `a` against `b` shifted by (dx, dy). */
function ncc(a: Float32Array, b: Float32Array, dx: number, dy: number): number {
  let sa = 0, sb = 0, n = 0;
  for (let y = MAX_DY; y < H - MAX_DY; y++) {
    for (let x = MAX_DX; x < W - MAX_DX; x++) {
      sa += a[y * W + x];
      sb += b[(y + dy) * W + x + dx];
      n++;
    }
  }
  const ma = sa / n, mb = sb / n;
  let num = 0, da = 0, db = 0;
  for (let y = MAX_DY; y < H - MAX_DY; y++) {
    for (let x = MAX_DX; x < W - MAX_DX; x++) {
      const u = a[y * W + x] - ma;
      const v = b[(y + dy) * W + x + dx] - mb;
      num += u * v;
      da += u * u;
      db += v * v;
    }
  }
  return num / Math.sqrt(da * db + 1e-6);
}

export function alignGrids(prev: Float32Array, next: Float32Array): Alignment {
  let best = { s: -1, dx: 0, dy: 0 };
  for (let dy = -MAX_DY; dy <= MAX_DY; dy++) {
    for (let dx = -MAX_DX; dx <= MAX_DX; dx++) {
      const s = ncc(prev, next, dx, dy);
      if (s > best.s) best = { s, dx, dy };
    }
  }
  const shift = Math.hypot(best.dx / W, best.dy / H);
  const score = Math.max(0, Math.min(1, best.s * (1 - shift * 2.5)));
  return { score, dx: best.dx / W, dy: best.dy / H };
}

/** Scores how well `nextSrc` is framed relative to `prevSrc`. Both are image URLs or data URLs. */
export async function measureAlignment(prevSrc: string, nextSrc: string): Promise<Alignment> {
  const [prev, next] = await Promise.all([loadImage(prevSrc), loadImage(nextSrc)]);
  return alignGrids(greyGrid(prev), greyGrid(next));
}

export function alignmentLevel(a: Alignment): AlignmentLevel {
  return a.score >= GOOD_ALIGNMENT ? "good" : a.score >= FAIR_ALIGNMENT ? "fair" : "poor";
}

/** Plain-language instruction for the health worker. */
export function alignmentHint(a: Alignment): string {
  const where: string[] = [];
  const move: string[] = [];
  if (Math.abs(a.dx) >= SHIFT_HINT) {
    where.push(`${Math.round(Math.abs(a.dx) * 100)}% ${a.dx > 0 ? "right" : "left"}`);
    move.push(a.dx > 0 ? "right" : "left");
  }
  if (Math.abs(a.dy) >= SHIFT_HINT) {
    where.push(`${Math.round(Math.abs(a.dy) * 100)}% ${a.dy > 0 ? "lower" : "higher"}`);
    move.push(a.dy > 0 ? "down" : "up");
  }
  if (where.length) {
    return `The lesion sits ${where.join(" and ")} than last visit. Move the phone slightly ${move.join(" and ")} and retake.`;
  }
  return a.score >= FAIR_ALIGNMENT
    ? "Framing matches the last visit."
    : "Position matches, but the photo looks different. Check the light and angle, or the lesion may have changed.";
}
