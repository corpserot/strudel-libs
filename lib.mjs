/* --------------------------------- signals -------------------------------- */

/**
 * Visualizes signals
 *
 * @example
 * $: punchcardSignal(32, "c0:major")(tri,sine)
 */
export const punchcardSignal = (segs = 32, scale = mini("c0:major")) => (...sig) =>
  stack(...sig.map(s => n(s.segment(segs).range(0,segs)).scale(scale).lpf(0).punchcard()))

/**
 * `signal()` but `t` begins when it is first triggered instead of when the cycle starts.
 */
export const latch = (f) => {
  let start = undefined;
  return signal((t) => {
    start = start ?? t;
    return f(t - start);
  })
}
/** 0..1 with `cycles` ramp duration */
export const ramp = (cycles) => latch((t) => Math.min(t / cycles, 1));
export const ramp2 = (cycles) => ramp(cycles).toBipolar();
/** 1..0 with `cycles` ramp duration */
export const iramp = (cycles) => latch((t) => Math.max(1 - t / cycles, 0));
export const iramp2 = (cycles) => iramp(cycles).toBipolar();
/** cycling 0..1 with `ratio` between the ramp part and the steady part
 *
 * @example
 * $: note("d4!12".add(partrun(0.7).range(0,12))).s("gm_piano:5").pianoroll()
 */
export const partrun = (ratio) => latch((t) => Math.min((t % 1) / ratio, 1));
export const partrun2 = (ratio) => partrun(ratio).toBipolar();
/** cycling 1..0 with `ratio` between the ramp part and the steady part
 *
 * @example
 * $: note("d4!12".add(ipartrun(0.7).range(0,12))).s("gm_piano:5").pianoroll()
 */
export const ipartrun = (ratio) => latch((t) => Math.max(1 - (t % 1) / ratio, 0));
export const ipartrun2 = (ratio) => ipartrun(ratio).toBipolar();

// random and probabilistic signals

export function _str2seed(seed) {
  const bytes = new TextEncoder().encode(seed);
  let hash = 0;
  for (let i = 0; i < bytes.length; i++) {
    hash = (hash * 31 + bytes[i]) | 0; // simple fast hash
  }
  return hash >>> 0; // force unsigned 32-bit
}

export function _random(seed) {
  seed = seed % 536870912; // stay within [0,2^29]
  const a = (seed << 13) ^ seed;
  const b = (a >> 17) ^ a;
  return (b << 5) ^ b;
}

// looping signals can also be made with .ribbon()

// a simpler and more hackable variation compared to strudel's
// but it is completely different
let salt = _str2seed("strudel is cool and so are you :)");
export const rngseed = (seed) => salt = typeof seed === "string" ? _str2seed(seed) : seed;
export const time2seed = (t) => Math.trunc(t*10000) + salt;
export const rng = (seed = 0) => signal(t => _random(time2seed(t)+_random(seed)))
export const rng2 = (seed = 0) => rng(seed).toBipolar()
export const looprng = (cycles, seed = 0) => signal(t => _random(time2seed(t % cycles)+_random(seed)))
export const looprng2 = (cycles, seed = 0) => looprng(cycles, seed).toBipolar()

// more sporadic perlin noise, meant to emulate a human's biased randomness
export const hurlin = (intensity = 0.1, degrade = 0.25, seed = 0) =>
  perlin.add(rng(seed).mul(degrade)).mul(Math.abs(intensity))
export const hurlin2 = (intensity = 0.1, degrade = 0.25, seed = 0) =>
  perlin.add(rng(seed).mul(degrade)).toBipolar().mul(Math.abs(intensity))

// perlin is looped every 300 cycles? dunno. so don't provide this yet
// export const loophurlin = (cycles, degrade = 0.25, seed = 0) => perlin.add(looprng(cycles, seed).mul(degrade))
// export const loophurlin2 = (cycles, degrade = 0.25, seed = 0) => loophurlin(cycles, degrade, seed).toBipolar()

/* ---------------------------------- color --------------------------------- */

// don't ask how i managed to write this, i don't even remember
// not even an LLM would be able to figure out how on earth i got it
export const getPalette = (theme) => globalThis.themes[theme][1].at(-1).value.specs
  .map(s => s.color).filter((c, i, t) => typeof c === 'string' && t.indexOf(c) === i);
export const getThemePalette = () => getPalette(globalThis.codemirrorSettings.get().theme)

/* -------------------------------------------------------------------------- */

/**
 * Stacks from 0 to values of pat.
 * @example
 * $: n(can("<5 2> 4(3,5) [2 3 4 5]")).legato(1.2)
 *   .chord("<<C7 B5>/2 Dm <F5 A> E2>").voicing()
 *   .add(note("2"))
 *   .jux(rev)
 *   .room(.8)
 *   .s("gm_electric_guitar_jazz:4")
 */
export const can = register('can', (pat) => reify(pat)
   .fmap(stop => stack(...Array(stop).keys()))
   .outerJoin())
// TODO above: i want to allow specifying when can starts, not just 0

/**
 * Applies each function from `fs` to each respective element in `pats`
 *
 * @example
 * $: applyPats([pat1, pat2, pat3], [x=>x.lpf(100),undefined,x=>x.add("<1 4>")])
 */
export const applyPats = (pats,fs) => pats.map((p,i) => fs[i]?.(p) ?? p);

export const fadein = register('fadein', function(cycles, gainstart, gainstop, pat) {
  return pat.gain(ramp(cycles).range(gainstart, gainstop));
})
export const fadeout = register('fadein', function(cycles, gainstart, gainstop, pat) {
  return pat.gain(iramp(cycles).range(gainstart, gainstop));
})

// for arrange()
export const shush = [Math.pow(2,32)-1, silence];

export const bank = registerControl(['bank', 'n']);

Object.assign(globalThis, await import(import.meta.url));