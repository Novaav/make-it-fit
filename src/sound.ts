/**
 * Sound effects, synthesised with the Web Audio API: no audio files, no network, no music.
 *
 * The context is created lazily, only from a player action, and never while muted. Every call is guarded, so a
 * missing or suspended audio system silently does nothing; nothing in the game waits for sound.
 */

export type SoundEvent = 'pickup' | 'remove' | 'place' | 'rotate' | 'invalid' | 'complete' | 'perfect' | 'click' | 'paper'

/** The pitch (Hz) of the first tone of each sound (for the tone-less paper sound, its filter's centre); it identifies the sound in tests. */
export const LEAD_HZ: Readonly<Record<SoundEvent, number>> = {
  pickup: 330,
  remove: 987.77,
  place: 262,
  rotate: 2093,
  invalid: 440,
  complete: 523.25,
  perfect: 587.33,
  click: 880,
  paper: 2500,
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
  click: 60,
  paper: 120,
}
/** A sound that had to wait for the context to resume is dropped if it would now be late. */
/** The sounds that go through the high-pass and low-pass; the others (cloth, reward melodies) go straight out. */
const SHAPED: ReadonlySet<SoundEvent> = new Set(['remove', 'rotate', 'invalid', 'click', 'paper'])
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
  // two outputs: `plain` goes straight to the speakers; `shaped` first passes a 400 Hz high-pass and an 8 kHz low-pass
  let plain: GainNode | null = null
  let shaped: GainNode | null = null
  let out: GainNode | null = null // where the voice being started sends its sound
  let noise: AudioBuffer | null = null
  let zipper: AudioBuffer | null = null
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
      plain = made.createGain()
      plain.gain.value = 0.5
      plain.connect(made.destination)
      // the ticks and clicks (rotate, invalid, remove) keep clear of low-frequency thump and of the harshest highs
      shaped = made.createGain()
      shaped.gain.value = 2.8
      const high = made.createBiquadFilter()
      high.type = 'highpass'
      high.frequency.value = 400
      const low = made.createBiquadFilter()
      low.type = 'lowpass'
      low.frequency.value = 8000
      shaped.connect(high)
      high.connect(low)
      low.connect(plain)
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
    osc.connect(gain).connect(out!)
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
    src.connect(filter).connect(gain).connect(out!)
    src.onended = () => {
      src.disconnect()
      filter.disconnect()
      gain.disconnect()
    }
    src.start(at)
    src.stop(at + decay + 0.03)
  }

  /**
   * A suitcase zipper closing, from noise only: a run of tiny, slightly uneven tooth clicks that speed up as the slider
   * does, rendered once into a buffer, then band-passed with a rising centre and faded in and out. No tone, so it sits
   * under the reward melody as texture rather than a note.
   */
  function zip(c: AudioContext, at: number) {
    const seconds = 0.5
    if (!zipper) {
      const rate = c.sampleRate
      zipper = c.createBuffer(1, Math.ceil(rate * (seconds + 0.05)), rate)
      const data = zipper.getChannelData(0)
      let seed = 7 // fixed seed: the same zipper every time
      const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296
      const burst = Math.max(2, Math.floor(rate * 0.0018))
      for (let t = 0; t < seconds; ) {
        const start = Math.floor(t * rate)
        const strength = 0.55 + 0.45 * random()
        for (let k = 0; k < burst && start + k < data.length; k++) data[start + k] += (random() * 2 - 1) * Math.exp(-k / (burst * 0.35)) * strength
        t += (0.0125 - 0.005 * (t / seconds)) * (0.85 + 0.3 * random()) // about 80 teeth a second, speeding up to about 130
      }
    }
    const src = c.createBufferSource()
    const filter = c.createBiquadFilter()
    const gain = c.createGain()
    src.buffer = zipper
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(2200, at)
    filter.frequency.exponentialRampToValueAtTime(4200, at + seconds)
    filter.Q.value = 1.2
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.linearRampToValueAtTime(0.16, at + 0.05)
    gain.gain.setValueAtTime(0.16, at + seconds - 0.12)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + seconds)
    src.connect(filter).connect(gain).connect(out!)
    src.onended = () => {
      src.disconnect()
      filter.disconnect()
      gain.disconnect()
    }
    src.start(at)
    src.stop(at + seconds + 0.03)
  }

  /**
   * The voices, quiet and short. Pickup and place are soft cloth contact and a low, warm settling tone; rotate, invalid
   * and remove are small ticks and falling notes; the two rewards are short melodies. The first tone of each is its
   * LEAD_HZ.
   */
  const voices: Record<SoundEvent, (c: AudioContext, t: number) => void> = {
    // fingertips taking hold of cloth: a very short, dull touch, no sweep and nothing bright
    pickup(c, t) {
      tone(c, t, LEAD_HZ.pickup, 0.03, 0.05)
      puff(c, t, 'lowpass', 1100, 0.5, 0.14, 0.045)
    },
    // the same breath, falling away: settling back
    remove(c, t) {
      tone(c, t, LEAD_HZ.remove, 0.01, 0.08, 'sine', 784)
      puff(c, t, 'bandpass', 2600, 0.8, 0.04, 0.09, 1400)
    },
    // an object settling into a lined case: a soft, dull landing and one warm low tone that does not fall
    place(c, t) {
      puff(c, t, 'lowpass', 750, 0.5, 0.25, 0.07)
      tone(c, t + 0.004, LEAD_HZ.place, 0.07, 0.09)
    },
    // two small mechanical ticks, the second a little higher: a notch moving past
    rotate(c, t) {
      tone(c, t, LEAD_HZ.rotate, 0.01, 0.025, 'sine', 1760)
      puff(c, t, 'bandpass', 2800, 5, 0.05, 0.014)
      puff(c, t + 0.03, 'bandpass', 3500, 5, 0.037, 0.012)
    },
    // one small, round button click: a short tap of cloth and a soft body tone, shared by every ordinary button
    click(c, t) {
      tone(c, t, LEAD_HZ.click, 0.012, 0.03)
      puff(c, t, 'bandpass', 1800, 1.5, 0.05, 0.016)
    },
    // paper handled gently: a soft slide, and a faint crinkle of fibres at its end
    paper(c, t) {
      puff(c, t, 'bandpass', LEAD_HZ.paper, 0.8, 0.045, 0.1, 1400)
      puff(c, t + 0.05, 'highpass', 4500, 0.7, 0.012, 0.05)
    },
    // two soft falling notes, "hm-mm": clearly not a success, gentle, no buzz
    invalid(c, t) {
      tone(c, t, LEAD_HZ.invalid, 0.04, 0.11, 'sine')
      tone(c, t + 0.085, 370, 0.036, 0.14, 'sine')
    },
    complete(c, t) {
      zip(c, t + 0.04) // the case is zipped shut, under the melody
      const s = t + 0.16 // after the last piece has landed
      tone(c, s, LEAD_HZ.complete, 0.07, 0.5, 'triangle')
      tone(c, s + 0.1, 659.25, 0.06, 0.5, 'triangle')
      tone(c, s + 0.2, 783.99, 0.06, 0.55, 'triangle')
      tone(c, s + 0.31, 1046.5, 0.05, 0.7, 'sine')
    },
    perfect(c, t) {
      zip(c, t + 0.04)
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
      out = SHAPED.has(event) ? shaped : plain
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
      plain = shaped = out = null
      noise = null
      zipper = null
      if (c) void Promise.resolve(c.close()).catch(noop)
    },
  }
}

/** The one sound system of the page. */
export const sound = createSound()
