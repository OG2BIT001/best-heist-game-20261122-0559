// Aurum Heist — audio.js
// Every sound is synthesised with WebAudio: no audio files, nothing to load.
// Silent (a no-op) until the first user gesture creates the audio context,
// and safe to call from Node, where there is no AudioContext at all.

export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.alarmOsc = null;
  }

  ensure() {
    if (this.ctx || typeof AudioContext === 'undefined') return;
    try {
      this.ctx = new AudioContext();
    } catch {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) this.stopAlarm();
    return this.muted;
  }

  tone(freq, dur, type = 'sine', gain = 0.12, slideTo = null) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(amp).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noiseBurst(dur = 0.08, gain = 0.06, lowpass = 1200) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const amp = this.ctx.createGain();
    amp.gain.setValueAtTime(gain, t0);
    amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(amp).connect(this.ctx.destination);
    src.start(t0);
  }

  footstep() {
    this.noiseBurst(0.05, 0.035, 700);
  }

  pickup() {
    this.tone(880, 0.1, 'sine', 0.1);
    setTimeout(() => this.tone(1318, 0.14, 'sine', 0.1), 70);
  }

  coinToss() {
    this.tone(1568, 0.07, 'triangle', 0.08, 2093);
  }

  smokePop() {
    this.noiseBurst(0.25, 0.1, 900);
  }

  empZap() {
    this.tone(2200, 0.3, 'sawtooth', 0.06, 110);
  }

  spotted() {
    this.tone(392, 0.16, 'square', 0.07, 523);
  }

  startAlarm() {
    if (!this.ctx || this.muted || this.alarmOsc) return;
    const osc = this.ctx.createOscillator();
    const amp = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 620;
    amp.gain.value = 0.045;
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 2.2;
    const lfoAmp = this.ctx.createGain();
    lfoAmp.gain.value = 0.03;
    lfo.connect(lfoAmp).connect(amp.gain);
    osc.connect(amp).connect(this.ctx.destination);
    osc.start();
    lfo.start();
    this.alarmOsc = { osc, lfo, amp };
  }

  stopAlarm() {
    if (!this.alarmOsc) return;
    try {
      this.alarmOsc.osc.stop();
      this.alarmOsc.lfo.stop();
    } catch {
      // Already stopped.
    }
    this.alarmOsc = null;
  }

  caught() {
    this.stopAlarm();
    this.tone(330, 0.22, 'square', 0.1, 110);
    setTimeout(() => this.tone(220, 0.4, 'square', 0.1, 55), 160);
  }

  levelClear() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.18, 'triangle', 0.1), i * 110));
  }

  winFanfare() {
    [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => setTimeout(() => this.tone(f, 0.25, 'triangle', 0.11), i * 130));
  }
}
