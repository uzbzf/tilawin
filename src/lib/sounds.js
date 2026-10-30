const MASTER_GAIN = 0.42
const HOVER_GAP_MS = 170

let ctx = null
let master = null
let noiseBuffer = null
let enabled = true
let lastHoverAt = 0
let canHover = true

function canUseHover() {
  try {
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches
  } catch {
    return true
  }
}

function createNoiseBuffer(audio) {
  const length = Math.floor(audio.sampleRate * 0.35)
  const buffer = audio.createBuffer(1, length, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1
  }
  return buffer
}

function ensure() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) {
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = MASTER_GAIN
    master.connect(ctx.destination)
    noiseBuffer = createNoiseBuffer(ctx)
    canHover = canUseHover()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function envGain(audio, peak, start, duration) {
  const gain = audio.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  return gain
}

function tone(audio, dest, { type = 'sine', freq, endFreq, peak, start, duration }) {
  const osc = audio.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, start + duration)
  const gain = envGain(audio, peak, start, duration)
  osc.connect(gain)
  gain.connect(dest)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

function noiseBurst(audio, dest, { peak, start, duration, frequency, q = 1.4, type = 'bandpass' }) {
  if (!noiseBuffer) return
  const source = audio.createBufferSource()
  source.buffer = noiseBuffer
  const filter = audio.createBiquadFilter()
  filter.type = type
  filter.frequency.setValueAtTime(frequency, start)
  filter.Q.value = q
  const gain = envGain(audio, peak, start, duration)
  source.connect(filter)
  filter.connect(gain)
  gain.connect(dest)
  source.start(start)
  source.stop(start + duration + 0.02)
}

function playClick(audio, dest, now) {
  tone(audio, dest, { type: 'triangle', freq: 540, endFreq: 320, peak: 0.07, start: now, duration: 0.07 })
  tone(audio, dest, { type: 'sine', freq: 1180, peak: 0.028, start: now, duration: 0.045 })
}

function playTasbeeh(audio, dest, now) {
  const wood = 175 + Math.random() * 28
  tone(audio, dest, { type: 'sine', freq: wood, endFreq: wood * 0.55, peak: 0.11, start: now, duration: 0.11 })
  noiseBurst(audio, dest, { peak: 0.16, start: now, duration: 0.038, frequency: 820 + Math.random() * 90, q: 1.1 })
  noiseBurst(audio, dest, { peak: 0.05, start: now + 0.012, duration: 0.05, frequency: 240, q: 0.8, type: 'lowpass' })
}

function playHover(audio, dest, now) {
  tone(audio, dest, { type: 'sine', freq: 2480, endFreq: 3360, peak: 0.016, start: now, duration: 0.12 })
  noiseBurst(audio, dest, { peak: 0.03, start: now, duration: 0.11, frequency: 4200, q: 0.7, type: 'highpass' })
}

function playFlip(audio, dest, now) {
  noiseBurst(audio, dest, { peak: 0.07, start: now, duration: 0.16, frequency: 1400, q: 0.9 })
  const sweep = audio.createBiquadFilter()
  sweep.type = 'bandpass'
  sweep.Q.value = 1.8
  sweep.frequency.setValueAtTime(1600, now)
  sweep.frequency.exponentialRampToValueAtTime(420, now + 0.18)
  const source = audio.createBufferSource()
  source.buffer = noiseBuffer
  const gain = envGain(audio, 0.055, now, 0.2)
  source.connect(sweep)
  sweep.connect(gain)
  gain.connect(dest)
  source.start(now)
  source.stop(now + 0.22)
  tone(audio, dest, { type: 'sine', freq: 620, endFreq: 380, peak: 0.035, start: now + 0.02, duration: 0.16 })
}

const voices = {
  click: playClick,
  tasbeeh: playTasbeeh,
  hover: playHover,
  flip: playFlip,
}

export function setSoundEnabled(value) {
  enabled = Boolean(value)
}

export function isSoundEnabled() {
  return enabled
}

export function unlockAudio() {
  try {
    ensure()
  } catch {
    /* ignore */
  }
}

export function playSound(kind) {
  if (!enabled) return
  if (kind === 'hover') {
    if (!canHover) return
    const stamp = performance.now()
    if (stamp - lastHoverAt < HOVER_GAP_MS) return
    lastHoverAt = stamp
  }
  const voice = voices[kind]
  if (!voice) return
  try {
    const audio = ensure()
    if (!audio || !master) return
    voice(audio, master, audio.currentTime)
  } catch {
    /* autoplay or unsupported */
  }
}
