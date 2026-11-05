const DEFAULT_VOLUME = 0.72
const MAX_MASTER = 0.85
const HOVER_GAP_MS = 280

let ctx = null
let master = null
let noiseBuffer = null
let enabled = true
let volume = DEFAULT_VOLUME
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
  const length = Math.floor(audio.sampleRate * 0.4)
  const buffer = audio.createBuffer(1, length, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.55
  }
  return buffer
}

function applyMasterGain() {
  if (!master) return
  master.gain.value = enabled ? volume * MAX_MASTER : 0
}

function ensure() {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!ctx) {
    ctx = new AC()
    master = ctx.createGain()
    applyMasterGain()
    const low = ctx.createBiquadFilter()
    low.type = 'lowpass'
    low.frequency.value = 2400
    low.Q.value = 0.45
    master.connect(low)
    low.connect(ctx.destination)
    noiseBuffer = createNoiseBuffer(ctx)
    canHover = canUseHover()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function envGain(audio, peak, start, duration) {
  const gain = audio.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.018)
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
  osc.stop(start + duration + 0.03)
}

function noiseBurst(audio, dest, { peak, start, duration, frequency, q = 0.9, type = 'lowpass' }) {
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
  source.stop(start + duration + 0.03)
}

function playClick(audio, dest, now) {
  tone(audio, dest, { type: 'sine', freq: 260, endFreq: 160, peak: 0.12, start: now, duration: 0.1 })
  noiseBurst(audio, dest, { peak: 0.06, start: now, duration: 0.05, frequency: 320, q: 0.5, type: 'lowpass' })
}

function playTasbeeh(audio, dest, now) {
  const wood = 130 + Math.random() * 14
  tone(audio, dest, { type: 'sine', freq: wood, endFreq: wood * 0.45, peak: 0.16, start: now, duration: 0.16 })
  noiseBurst(audio, dest, { peak: 0.08, start: now, duration: 0.05, frequency: 280, q: 0.5, type: 'lowpass' })
}

function playHover(audio, dest, now) {
  tone(audio, dest, { type: 'sine', freq: 400, endFreq: 480, peak: 0.035, start: now, duration: 0.14 })
}

function playFlip(audio, dest, now) {
  noiseBurst(audio, dest, { peak: 0.07, start: now, duration: 0.18, frequency: 360, q: 0.55, type: 'lowpass' })
  tone(audio, dest, { type: 'sine', freq: 280, endFreq: 180, peak: 0.07, start: now + 0.02, duration: 0.16 })
}

function playChime(audio, dest, now) {
  tone(audio, dest, { type: 'sine', freq: 523.25, endFreq: 523.25, peak: 0.11, start: now, duration: 0.38 })
  tone(audio, dest, { type: 'sine', freq: 659.25, endFreq: 659.25, peak: 0.09, start: now + 0.08, duration: 0.42 })
  tone(audio, dest, { type: 'triangle', freq: 783.99, endFreq: 783.99, peak: 0.06, start: now + 0.16, duration: 0.48 })
}

function playSuccess(audio, dest, now) {
  tone(audio, dest, { type: 'sine', freq: 392, endFreq: 523.25, peak: 0.12, start: now, duration: 0.24 })
  tone(audio, dest, { type: 'sine', freq: 523.25, endFreq: 659.25, peak: 0.1, start: now + 0.12, duration: 0.3 })
}

function playWhoosh(audio, dest, now) {
  noiseBurst(audio, dest, { peak: 0.1, start: now, duration: 0.22, frequency: 480, q: 0.4, type: 'bandpass' })
  tone(audio, dest, { type: 'sine', freq: 200, endFreq: 100, peak: 0.05, start: now, duration: 0.2 })
}

function playPage(audio, dest, now) {
  tone(audio, dest, { type: 'sine', freq: 320, endFreq: 230, peak: 0.07, start: now, duration: 0.18 })
  noiseBurst(audio, dest, { peak: 0.05, start: now, duration: 0.12, frequency: 320, q: 0.45, type: 'lowpass' })
}

const voices = {
  click: playClick,
  tasbeeh: playTasbeeh,
  hover: playHover,
  flip: playFlip,
  chime: playChime,
  success: playSuccess,
  whoosh: playWhoosh,
  page: playPage,
}

export function setSoundEnabled(value) {
  enabled = Boolean(value)
  applyMasterGain()
}

export function isSoundEnabled() {
  return enabled
}

/** @param {number} value 0..1 */
export function setSoundVolume(value) {
  volume = Math.min(1, Math.max(0, Number(value) || 0))
  applyMasterGain()
}

export function getSoundVolume() {
  return volume
}

export function unlockAudio() {
  try {
    ensure()
  } catch {
    /* ignore */
  }
}

export function playSound(kind) {
  if (!enabled || volume <= 0.01) return
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
