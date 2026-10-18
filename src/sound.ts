/**
 * Sound effects, synthesised with the Web Audio API: no audio files, no network, no music.
 *
 * The context is created lazily, only from a player action, and never while muted. Every call is guarded, so a
 * missing or suspended audio system silently does nothing; nothing in the game waits for sound.
 */

export type SoundEvent = 'pickup' | 'remove' | 'place' | 'rotate' | 'invalid' | 'complete' | 'perfect'

/** The pitch (Hz) of the first tone of each sound; it identifies the sound in tests. */
export const LEAD_HZ: Readonly<Record<SoundEvent, number>> = {
  pickup: 392,
  remove: 330,
  place: 147,
  rotate: 2093,
  invalid: 196,
  complete: 523.25,
  perfect: 587.33,
}

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
const MASTER_GAIN = 0.5
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
  let muted = options.muted ?? false
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
      master = made.createGain()
      master.gain.value = MASTER_GAIN
      master.connect(made.destination)
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
  function puff(c: AudioContext, at: number, type: BiquadFilterType, hz: number, q: number, peak: number, decay: number) {
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
    filter.frequency.value = hz
    filter.Q.value = q
    gain.gain.setValueAtTime(peak, at)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + decay)
    src.connect(filter).connect(gain).connect(master!)
    src.onended = () => {
      src.disconnect()
      filter.disconnect()
      gain.disconnect()
    }
    src.start(at)
    src.stop(at + decay + 0.03)
  }

  /** The voices. Each is a few quiet layers, well under a second, and the first tone is the sound's LEAD_HZ. */
  const voices: Record<SoundEvent, (c: AudioContext, t: number) => void> = {
    // a soft lift off the table
    pickup(c, t) {
      tone(c, t, LEAD_HZ.pickup, 0.035, 0.09, 'sine', 470)
      puff(c, t, 'bandpass', 1800, 0.7, 0.05, 0.08)
    },
    remove(c, t) {
      tone(c, t, LEAD_HZ.remove, 0.03, 0.1, 'sine', 247)
      puff(c, t, 'bandpass', 1200, 0.7, 0.04, 0.09)
    },
    // a cloth landing, then two warm notes that say it fits
    place(c, t) {
      tone(c, t, LEAD_HZ.place, 0.14, 0.13, 'sine', 90)
      puff(c, t, 'lowpass', 520, 0.7, 0.16, 0.12)
      tone(c, t + 0.05, 523.25, 0.045, 0.22, 'triangle')
      tone(c, t + 0.09, 659.25, 0.035, 0.26, 'triangle')
    },
    // a delicate two-step ratchet
    rotate(c, t) {
      tone(c, t, LEAD_HZ.rotate, 0.018, 0.03, 'sine', 1500)
      puff(c, t, 'bandpass', 3200, 4, 0.05, 0.02)
      puff(c, t + 0.032, 'bandpass', 3800, 4, 0.035, 0.016)
    },
    // a low, soft step down; it never buzzes
    invalid(c, t) {
      tone(c, t, LEAD_HZ.invalid, 0.06, 0.16, 'sine', 165)
      puff(c, t, 'lowpass', 400, 0.7, 0.04, 0.08)
    },
    complete(c, t) {
      const s = t + 0.16 // after the last piece has landed
      tone(c, s, LEAD_HZ.complete, 0.07, 0.5, 'triangle')
      tone(c, s + 0.1, 659.25, 0.06, 0.5, 'triangle')
      tone(c, s + 0.2, 783.99, 0.06, 0.55, 'triangle')
      tone(c, s + 0.31, 1046.5, 0.05, 0.7, 'sine')
    },
    perfect(c, t) {
      const s = t + 0.16
      tone(c, s, LEAD_HZ.perfect, 0.07, 0.5, 'triangle')
      tone(c, s + 0.09, 783.99, 0.06, 0.5, 'triangle')
      tone(c, s + 0.18, 987.77, 0.06, 0.55, 'triangle')
      tone(c, s + 0.28, 1174.66, 0.05, 0.6, 'sine')
      tone(c, s + 0.4, 1567.98, 0.04, 0.9, 'sine')
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
