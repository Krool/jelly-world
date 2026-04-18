let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;

export function initAudio(): void {
  if (ctx) { void ctx.resume(); return; }
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  ctx = new Ctor();
  master = ctx.createGain();
  master.gain.value = 0.32;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 30;
  master.connect(hp).connect(ctx.destination);

  const len = ctx.sampleRate * 1;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  noiseBuf = buf;
}

function resume(): void {
  if (ctx && ctx.state === 'suspended') void ctx.resume();
}

type ToneOpts = {
  freq: number;
  attack: number;
  decay: number;
  peak: number;
  type?: OscillatorType;
  slideTo?: number;
  when?: number;
  detune?: number;
};

function tone(o: ToneOpts): void {
  if (!ctx || !master) return;
  resume();
  const startAt = ctx.currentTime + (o.when ?? 0);
  const end = startAt + o.attack + o.decay;
  const osc = ctx.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, startAt);
  if (o.slideTo !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.slideTo), end);
  }
  if (o.detune) osc.detune.setValueAtTime(o.detune, startAt);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, startAt);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.peak), startAt + o.attack);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(g).connect(master);
  osc.start(startAt);
  osc.stop(end + 0.02);
}

type NoiseOpts = {
  freq: number;
  q: number;
  attack: number;
  decay: number;
  peak: number;
  type?: BiquadFilterType;
  when?: number;
};

const lastPlay = new Map<string, number>();
function throttle(key: string, minGapMs: number): boolean {
  const now = performance.now();
  const prev = lastPlay.get(key) ?? 0;
  if (now - prev < minGapMs) return false;
  lastPlay.set(key, now);
  return true;
}

function noise(o: NoiseOpts): void {
  if (!ctx || !master || !noiseBuf) return;
  resume();
  const startAt = ctx.currentTime + (o.when ?? 0);
  const end = startAt + o.attack + o.decay;
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf;
  const f = ctx.createBiquadFilter();
  f.type = o.type ?? 'bandpass';
  f.frequency.value = o.freq;
  f.Q.value = o.q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, startAt);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, o.peak), startAt + o.attack);
  g.gain.exponentialRampToValueAtTime(0.0001, end);
  src.connect(f).connect(g).connect(master);
  src.start(startAt);
  src.stop(end + 0.05);
}

export const sfx = {
  jump(): void {
    tone({ freq: 300, slideTo: 620, attack: 0.008, decay: 0.16, peak: 0.28, type: 'triangle' });
  },
  airJump(n: number): void {
    const base = 460 + n * 80;
    tone({ freq: base, slideTo: base * 1.7, attack: 0.005, decay: 0.13, peak: 0.22, type: 'triangle' });
    tone({ freq: base * 2, slideTo: base * 3.2, attack: 0.005, decay: 0.09, peak: 0.06, type: 'sine' });
  },
  land(impact: number): void {
    const heavy = Math.min(1, impact / 16);
    tone({ freq: 120, slideTo: 55, attack: 0.004, decay: 0.09 + heavy * 0.06, peak: 0.2 + heavy * 0.2, type: 'sine' });
    noise({ freq: 220, q: 1.2, attack: 0.003, decay: 0.07 + heavy * 0.05, peak: 0.08 + heavy * 0.12, type: 'lowpass' });
  },
  bouncePad(): void {
    tone({ freq: 240, slideTo: 760, attack: 0.008, decay: 0.22, peak: 0.32, type: 'triangle' });
    tone({ freq: 240, slideTo: 760, attack: 0.008, decay: 0.22, peak: 0.12, type: 'sine', detune: 14 });
  },
  trampoline(): void {
    tone({ freq: 180, slideTo: 980, attack: 0.01, decay: 0.32, peak: 0.34, type: 'triangle' });
    tone({ freq: 90, slideTo: 490, attack: 0.01, decay: 0.3, peak: 0.18, type: 'sine' });
  },
  absorb(size: number): void {
    const base = 760 - Math.min(300, size * 260);
    tone({ freq: base, slideTo: base * 1.25, attack: 0.004, decay: 0.09, peak: 0.2, type: 'sine' });
    tone({ freq: base * 1.5, attack: 0.004, decay: 0.1, peak: 0.18, type: 'sine', when: 0.06 });
  },
  bumpJelly(): void {
    if (!throttle('bump', 180)) return;
    tone({ freq: 170, slideTo: 110, attack: 0.006, decay: 0.14, peak: 0.22, type: 'sine' });
  },
  pinHit(strong: boolean): void {
    if (!throttle(strong ? 'pinS' : 'pinW', strong ? 60 : 180)) return;
    noise({ freq: strong ? 2200 : 1500, q: 8, attack: 0.003, decay: 0.1, peak: strong ? 0.3 : 0.18, type: 'bandpass' });
    tone({ freq: 420, slideTo: 260, attack: 0.004, decay: 0.08, peak: 0.14, type: 'square' });
  },
  thud(strength: number): void {
    if (!throttle('thud', 140)) return;
    const s = Math.min(1, strength / 10);
    tone({ freq: 140, slideTo: 70, attack: 0.005, decay: 0.14, peak: 0.18 + s * 0.16, type: 'sawtooth' });
    noise({ freq: 380, q: 1, attack: 0.003, decay: 0.09, peak: 0.08 + s * 0.1, type: 'lowpass' });
  },
  shed(): void {
    noise({ freq: 900, q: 1.2, attack: 0.004, decay: 0.26, peak: 0.3, type: 'highpass' });
    tone({ freq: 180, slideTo: 70, attack: 0.005, decay: 0.2, peak: 0.22, type: 'sawtooth' });
    tone({ freq: 520, slideTo: 280, attack: 0.005, decay: 0.14, peak: 0.1, type: 'triangle' });
  },
  shard(): void {
    tone({ freq: 980, slideTo: 1400, attack: 0.003, decay: 0.06, peak: 0.14, type: 'sine' });
  },
  respawn(): void {
    tone({ freq: 560, slideTo: 180, attack: 0.01, decay: 0.26, peak: 0.2, type: 'sawtooth' });
    noise({ freq: 600, q: 1, attack: 0.01, decay: 0.2, peak: 0.08, type: 'bandpass' });
  },
  shape(): void {
    tone({ freq: 480, slideTo: 780, attack: 0.004, decay: 0.09, peak: 0.14, type: 'square' });
    tone({ freq: 720, slideTo: 1140, attack: 0.004, decay: 0.09, peak: 0.1, type: 'square', when: 0.03 });
  },
  victory(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      tone({ freq: f, attack: 0.015, decay: 0.35, peak: 0.26, type: 'triangle', when: i * 0.13 });
      tone({ freq: f * 2, attack: 0.015, decay: 0.3, peak: 0.1, type: 'sine', when: i * 0.13 });
    });
    tone({ freq: 1318.5, attack: 0.02, decay: 0.6, peak: 0.3, type: 'triangle', when: 0.52 });
  },
};
