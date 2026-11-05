const MASTER_GAIN = 0.1
const HOVER_GAP_MS = 320

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
  const length = Math.floor(audio.sampleRate * 0.4)
  const buffer = audio.createBuffer(1, length, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * 0.55
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
    const low = ctx.createBiquadFilter()
    low.type = 'lowpass'
    low.frequency.value = 900
    low.Q.value = 0.55
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
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.02)
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
  tone(audio, dest, { type: 'sine', freq: 220, endFreq: 140, peak: 0.028, start: now, duration: 0.11 })
  noiseBurst(audio, dest, { peak: 0.018, start: now, duration: 0.06, frequency: 280, q: 0.5, type: 'lowpass' })
}

function playTasbeeh(audio, dest, now) {
  const wood = 120 + Math.random() * 14
  tone(audio, dest, { type: 'sine', freq: wood, endFreq: wood * 0.45, peak: 0.045, start: now, duration: 0.16 })
  noiseBurst(audio, dest, { peak: 0.028, start: now, duration: 0.05, frequency: 260, q: 0.55, type: 'lowpass' })
}

function playHover(audio, dest, now) {
  tone(audio, dest, { type: 'sine', freq: 380, endFreq: 460, peak: 0.007, start: now, duration: 0.16 })
}

function playFlip(audio, dest, now) {
  noiseBurst(audio, dest, { peak: 0.022, start: now, duration: 0.2, frequency: 320, q: 0.6, type: 'lowpass' })
  tone(audio, dest, { type: 'sine', freq: 280, endFreq: 170, peak: 0.018, start: now + 0.02, duration: 0.18 })
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
