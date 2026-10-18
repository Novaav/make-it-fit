/**
 * Sound effects, synthesised with the Web Audio API: no audio files, no network, no music.
 *
 * The context is created lazily, only from a player action, and never while muted. Every call is guarded, so a
 * missing or suspended audio system silently does nothing; nothing in the game waits for sound.
 */

export type SoundEvent = 'pickup' | 'remove' | 'place' | 'rotate' | 'invalid' | 'complete' | 'perfect'

/** The pitch (Hz) of the first tone of each sound; it identifies the sound in tests. */
export const LEAD_HZ: Readonly<Record<SoundEvent, number>> = {
  pickup: 1174.66,
  remove: 987.77,
  place: 1567.98,
  rotate: 2093,
  invalid: 440,
  complete: 659.25,
  perfect: 783.99,
}

/** The two reward melodies (Hz), a C-major pentatonic phrase; the last entry is struck with the one before it. */
export const MELODY = {
  complete: [659.25, 783.99, 1046.5, 1318.51],
  perfect: [783.99, 1046.5, 1318.51, 1567.98, 2093],
} as const

/** Shortest gap (ms) between two sounds of the same kind: a held key or a fast tap never stacks them. */
const MIN_GAP_MS: Readonly<Record<SoundEvent, number>> = {
  pickup: 80,
  remove: 80,
  place: 60,
  rotate: 70,
  invalid: 150,
  complete: 600,
  perfect: 600,
}
const MASTER_GAIN = 1.4
/** A sound that had to wait for the context to resume is dropped if it would now be late. */
const RESUME_GRACE_MS = 250
const noop = () => {}

type ContextFactory = () => AudioContext | null

function browserContext(): AudioContext | null {
  const w = globalThis as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
  const Ctor = w.AudioContext ?? w.webkitAudioContext
  return Ctor ? new Ctor({ latencyHint: 'interactive' }) : null
}

export interface Sound {
  play(event: SoundEvent): void
  /** Call from a player action (click, key, pointer down) so the browser allows audio from then on. */
  unlock(): void
  setMuted(muted: boolean): void
  isMuted(): boolean
  /** Closes the audio context (tests; the game keeps one for the life of the page). */
  dispose(): void
}

export function createSound(options: { createContext?: ContextFactory; now?: () => number; muted?: boolean } = {}): Sound {
  const makeContext = options.createContext ?? browserContext
  const now = options.now ?? (() => performance.now())
  let muted = options.muted ?? true // silent until told otherwise
  let ctx: AudioContext | null = null
  let master: GainNode | null = null
  let noise: AudioBuffer | null = null
  let unsupported = false
  const lastPlayed: Partial<Record<SoundEvent, number>> = {}

  function context(): AudioContext | null {
    if (ctx) return ctx
    if (unsupported) return null
    try {
      const made = makeContext()
      if (!made) {
        unsupported = true
        return null
      }
      // gain, then a high-pass that keeps every sound free of low-frequency thump (and off tiny speakers' weak spot),
      // then a gentle low-pass that takes the edge off the highest clicks
      master = made.createGain()
      master.gain.value = MASTER_GAIN
      const high = made.createBiquadFilter()
      high.type = 'highpass'
      high.frequency.value = 400
      const low = made.createBiquadFilter()
      low.type = 'lowpass'
      low.frequency.value = 8000
      master.connect(high)
      high.connect(low)
      low.connect(made.destination)
      ctx = made
    } catch {
      unsupported = true
      ctx = null
    }
    return ctx
  }

  /** A short decaying tone. */
  function tone(c: AudioContext, at: number, hz: number, peak: number, decay: number, type: OscillatorType = 'sine', toHz?: number) {
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(hz, at)
    if (toHz) osc.frequency.exponentialRampToValueAtTime(toHz, at + decay)
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.linearRampToValueAtTime(peak, at + 0.004)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.004 + decay)
    osc.connect(gain).connect(master!)
    osc.onended = () => {
      osc.disconnect()
      gain.disconnect()
    }
    osc.start(at)
    osc.stop(at + decay + 0.03)
  }

  /** A short filtered puff of noise: the fabric and the click. */
  function puff(c: AudioContext, at: number, type: BiquadFilterType, hz: number, q: number, peak: number, decay: number, toHz?: number) {
    if (!noise) {
      noise = c.createBuffer(1, Math.ceil(c.sampleRate * 0.3), c.sampleRate)
      const data = noise.getChannelData(0)
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
    }
    const src = c.createBufferSource()
    const filter = c.createBiquadFilter()
    const gain = c.createGain()
    src.buffer = noise
    filter.type = type
    filter.frequency.setValueAtTime(hz, at)
    if (toHz) filter.frequency.exponentialRampToValueAtTime(toHz, at + decay)
    filter.Q.value = q
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.linearRampToValueAtTime(peak, at + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.006 + decay)
    src.connect(filter).connect(gain).connect(master!)
    src.onended = () => {
      src.disconnect()
      filter.disconnect()
      gain.disconnect()
    }
    src.start(at)
    src.stop(at + decay + 0.03)
  }

  /** A soft bell: a pure tone with a quiet octave above it and a slow decay (music-box, not alarm). */
  function bell(c: AudioContext, at: number, hz: number, peak: number, decay: number) {
    tone(c, at, hz, peak, decay)
    tone(c, at, hz * 2, peak * 0.3, decay * 0.5)
  }

  /**
   * The voices. One identity: soft cloth (filtered noise), tiny tick-like tones, warm bells for rewards. Nothing is
   * below 400 Hz (see the high-pass in context()), nothing is a drum, and ordinary actions carry no melody.
   * The first tone of each is its LEAD_HZ.
   */
  const voices: Record<SoundEvent, (c: AudioContext, t: number) => void> = {
    // an airy lift: a breath of cloth rising, with a faint high shimmer
    pickup(c, t) {
      tone(c, t, LEAD_HZ.pickup, 0.012, 0.07, 'sine', 1397)
      puff(c, t, 'bandpass', 1500, 0.8, 0.05, 0.09, 2800)
    },
    // the same breath, falling away: settling back
    remove(c, t) {
      tone(c, t, LEAD_HZ.remove, 0.01, 0.08, 'sine', 784)
      puff(c, t, 'bandpass', 2600, 0.8, 0.04, 0.09, 1400)
    },
    // light contact with the lining, then a tiny settling tick; a single small event, not a note
    place(c, t) {
      tone(c, t + 0.008, LEAD_HZ.place, 0.04, 0.05, 'sine', 1397)
      puff(c, t, 'bandpass', 2000, 0.9, 0.07, 0.05)
    },
    // two small mechanical ticks, the second a little higher: a notch moving past
    rotate(c, t) {
      tone(c, t, LEAD_HZ.rotate, 0.01, 0.025, 'sine', 1760)
      puff(c, t, 'bandpass', 2800, 5, 0.05, 0.014)
      puff(c, t + 0.03, 'bandpass', 3500, 5, 0.037, 0.012)
    },
    // two soft falling notes, "hm-mm": clearly not a success, gentle, no buzz
    invalid(c, t) {
      tone(c, t, LEAD_HZ.invalid, 0.04, 0.11, 'sine')
      tone(c, t + 0.085, 370, 0.036, 0.14, 'sine')
    },
    // a short rising phrase of soft bells, ending on two notes together
    complete(c, t) {
      const s = t + 0.14 // after the last piece has settled
      const m = MELODY.complete
      bell(c, s, m[0], 0.05, 0.42)
      bell(c, s + 0.11, m[1], 0.05, 0.42)
      bell(c, s + 0.22, m[2], 0.052, 0.5)
      bell(c, s + 0.36, m[3], 0.05, 0.9)
      bell(c, s + 0.36, m[2], 0.034, 0.9)
    },
    // the same phrase, climbing further, with a faint shimmer on top
    perfect(c, t) {
      const s = t + 0.14
      const m = MELODY.perfect
      bell(c, s, m[0], 0.05, 0.42)
      bell(c, s + 0.1, m[1], 0.05, 0.42)
      bell(c, s + 0.2, m[2], 0.052, 0.45)
      bell(c, s + 0.31, m[3], 0.05, 0.6)
      bell(c, s + 0.44, m[4], 0.04, 1.1)
      bell(c, s + 0.44, m[2], 0.03, 1.1)
      puff(c, s + 0.44, 'highpass', 5000, 0.7, 0.012, 0.35)
    },
  }

  function start(event: SoundEvent, c: AudioContext) {
    try {
      voices[event](c, c.currentTime + 0.005)
    } catch {
      // a failing voice must never reach the game
    }
  }

  return {
    play(event) {
      if (muted) return
      const t = now()
      const prev = lastPlayed[event]
      if (prev !== undefined && t - prev < MIN_GAP_MS[event]) return
      lastPlayed[event] = t
      const c = context()
      if (!c) return
      if (c.state === 'running') return start(event, c)
      // suspended (no gesture yet) or interrupted (a call, the silent switch): ask to resume, and play only if it is prompt
      try {
        Promise.resolve(c.resume())
          .then(() => {
            if (!muted && c.state === 'running' && now() - t < RESUME_GRACE_MS) start(event, c)
          })
          .catch(noop)
      } catch {
        // ignore
      }
    },
    unlock() {
      if (muted) return
      const c = context()
      if (!c || c.state === 'running') return
      try {
        Promise.resolve(c.resume()).catch(noop)
      } catch {
        // ignore
      }
    },
    setMuted(value) {
      muted = value
    },
    isMuted: () => muted,
    dispose() {
      const c = ctx
      ctx = null
      master = null
      noise = null
      if (c) void Promise.resolve(c.close()).catch(noop)
    },
  }
}

/** The one sound system of the page. */
export const sound = createSound()
