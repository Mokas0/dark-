// Web Audio API sound effect synth. No external assets — every cue is a small
// oscillator + envelope. Lazily created so the audio context only spawns
// after the first user gesture (browsers block silent autoplay).

let ctx = null;
let masterGain = null;
let enabled = true;

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.25;
      masterGain.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  return ctx;
}

export function setAudioEnabled(v) {
  enabled = v;
  if (masterGain) masterGain.gain.value = v ? 0.25 : 0;
}

export function isAudioEnabled() {
  return enabled;
}

function blip({ freq = 440, dur = 0.08, type = 'square', sweep = 0, vol = 0.5 }) {
  const a = getCtx();
  if (!a || !enabled) return;
  const osc = a.createOscillator();
  const env = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, a.currentTime);
  if (sweep) {
    osc.frequency.linearRampToValueAtTime(freq + sweep, a.currentTime + dur);
  }
  env.gain.setValueAtTime(0, a.currentTime);
  env.gain.linearRampToValueAtTime(vol, a.currentTime + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  osc.connect(env);
  env.connect(masterGain);
  osc.start();
  osc.stop(a.currentTime + dur + 0.02);
}

export const sfx = {
  click:    () => blip({ freq: 800, dur: 0.04, type: 'square', vol: 0.3 }),
  bid:      () => blip({ freq: 1200, dur: 0.06, type: 'square', sweep: -400, vol: 0.4 }),
  hatch:    () => { blip({ freq: 200, dur: 0.18, type: 'sawtooth', sweep: 600, vol: 0.5 }); setTimeout(() => blip({ freq: 880, dur: 0.1, type: 'square', vol: 0.4 }), 120); },
  win:      () => { blip({ freq: 660, dur: 0.08 }); setTimeout(() => blip({ freq: 880, dur: 0.12, sweep: 200, vol: 0.5 }), 80); },
  loss:     () => blip({ freq: 220, dur: 0.3, type: 'sawtooth', sweep: -120, vol: 0.5 }),
  catch:    () => { blip({ freq: 400, dur: 0.06 }); setTimeout(() => blip({ freq: 660, dur: 0.1, type: 'square', vol: 0.4 }), 60); },
  alarm:    () => { blip({ freq: 880, dur: 0.12, type: 'square', vol: 0.5 }); setTimeout(() => blip({ freq: 660, dur: 0.12, type: 'square', vol: 0.5 }), 140); },
  rumble:   () => blip({ freq: 80, dur: 0.5, type: 'sawtooth', vol: 0.5 }),
  ticker:   () => blip({ freq: 1400, dur: 0.03, type: 'square', vol: 0.18 }),
};
