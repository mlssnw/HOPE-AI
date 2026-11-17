const clamp = value => Math.max(0, Math.min(1, value));

export function calculateVoiceLevel(samples, previous = 0, options = {}) {
  if (options.reset) return 0;
  if (!samples?.length) return clamp(previous * .65);
  let energy = 0;
  for (const sample of samples) energy += sample * sample;
  const rms = Math.sqrt(energy / samples.length);
  const ceiling = Math.max(.01, options.ceiling ?? .55);
  const target = clamp(rms / ceiling);
  const smoothing = clamp(options.smoothing ?? .72);
  return clamp(previous * smoothing + target * (1 - smoothing));
}

export class LocalAudioMeter {
  constructor(audio, onLevel, options = {}) {
    this.audio = audio;
    this.onLevel = onLevel;
    this.AudioContext = options.AudioContext
      ?? globalThis.AudioContext ?? globalThis.webkitAudioContext;
    this.requestFrame = options.requestFrame ?? requestAnimationFrame;
    this.cancelFrame = options.cancelFrame ?? cancelAnimationFrame;
    this.level = 0;
    this.frame = null;
  }

  start() {
    if (!this.AudioContext || this.context) return;
    try {
      this.context = new this.AudioContext();
      this.source = this.context.createMediaElementSource(this.audio);
      this.analyser = this.context.createAnalyser();
      this.analyser.fftSize = 256;
      this.samples = new Float32Array(this.analyser.fftSize);
      this.source.connect(this.analyser);
      this.analyser.connect(this.context.destination);
      const tick = () => {
        this.analyser.getFloatTimeDomainData(this.samples);
        this.level = calculateVoiceLevel(this.samples, this.level);
        this.onLevel(this.level);
        this.frame = this.requestFrame(tick);
      };
      tick();
    } catch {
      this.stop();
    }
  }

  stop() {
    if (this.frame != null) this.cancelFrame(this.frame);
    this.frame = null;
    this.source?.disconnect?.();
    this.analyser?.disconnect?.();
    this.context?.close?.();
    this.context = null; this.source = null; this.analyser = null;
    this.level = 0; this.onLevel(0);
  }
}
