import { describe, expect, it, vi } from 'vitest'
import { createSound, LEAD_HZ, type SoundEvent } from './sound'

/** A recording stand-in for the Web Audio API: it never makes a sound, it notes which tones start. */
function fakeContext(state: 'running' | 'suspended' = 'running') {
  const leads: number[] = []
  const noises: number[] = [] // the starting centre (Hz) of each noise source's filter
  const param = () => ({ value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() })
  const node = () => ({ connect: (n: unknown) => n, disconnect: vi.fn() })
  const ctx = {
    state: state as string,
    currentTime: 1,
    sampleRate: 8000,
    destination: {},
    resume: vi.fn(() => {
      ctx.state = 'running'
      return Promise.resolve()
    }),
    close: vi.fn(() => Promise.resolve()),
    createGain: () => ({ ...node(), gain: param() }),
    createWaveShaper: () => ({ ...node(), curve: null, oversample: 'none' }),
    createBuffer: (_c: number, length: number) => ({ getChannelData: () => new Float32Array(length) }),
    createBiquadFilter: () => {
      const frequency = param()
      let first = 0
      frequency.setValueAtTime = vi.fn((hz: number) => void (first ||= hz))
      return { ...node(), frequency, Q: param(), type: '', first: () => first }
    },
    createBufferSource: () => {
      let filter: { first: () => number } | undefined
      return {
        buffer: null,
        connect: (n: { first: () => number }) => ((filter = n), n),
        disconnect: vi.fn(),
        start: () => noises.push(filter?.first() ?? 0),
        stop: vi.fn(),
        onended: null,
      }
    },
    createOscillator: () => {
      const frequency = param()
      let first: number | undefined
      frequency.setValueAtTime = vi.fn((hz: number) => (first ??= hz))
      return { ...node(), frequency, type: '', start: () => leads.push(first!), stop: vi.fn(), onended: null }
    },
  }
  return { ctx, leads, noises }
}

function setup(state: 'running' | 'suspended' = 'running', muted = false) {
  const fake = fakeContext(state)
  let clock = 1000
  const make = vi.fn(() => fake.ctx as unknown as AudioContext)
  const sound = createSound({ createContext: make, now: () => clock, muted })
  return { ...fake, sound, make, advance: (ms: number) => (clock += ms) }
}

const EVENTS = Object.keys(LEAD_HZ) as SoundEvent[]

describe('sound voices', () => {
  it('every event starts its own lead tone, and the leads are all different', () => {
    expect(new Set(Object.values(LEAD_HZ)).size).toBe(EVENTS.length)
    for (const e of EVENTS.filter((x) => x !== 'paper')) {
      const t = setup()
      t.sound.play(e)
      expect(t.leads[0], e).toBe(LEAD_HZ[e]) // (the paper sound has no tone; its lead is its filter's centre)
    }
  })
  it('ordinary actions are a single small tick or breath, never a melody', () => {
    for (const e of ['pickup', 'remove', 'place', 'rotate'] as const) {
      const t = setup()
      t.sound.play(e)
      expect(t.leads, e).toEqual([LEAD_HZ[e]])
    }
  })
  it('the rewards are the original short melodies, and perfect is the richer one', () => {
    const phrase = (e: 'complete' | 'perfect') => {
      const t = setup()
      t.sound.play(e)
      return t.leads
    }
    expect(phrase('complete')).toEqual([523.25, 659.25, 783.99, 1046.5])
    expect(phrase('perfect')).toEqual([587.33, 783.99, 987.77, 1174.66, 1567.98])
  })
  it('keeps every sound above the drum range', () => {
    expect(Math.min(...Object.values(LEAD_HZ))).toBeGreaterThanOrEqual(250)
  })
})

describe('putting an item back', () => {
  it('is one low tone and one muffled breath: nothing bright, nothing percussive', () => {
    const t = setup()
    t.sound.play('remove')
    expect(t.leads).toEqual([294])
    expect(t.noises).toHaveLength(1)
    expect(t.noises[0]).toBeLessThanOrEqual(1000) // the breath is low-passed, not a bright burst
    expect(LEAD_HZ.remove).toBeLessThan(LEAD_HZ.pickup) // settles lower than the pickup it answers
  })
})

describe('buttons and paper', () => {
  it('a button click is one soft tap; a page turn is paper only, with no tone', () => {
    const click = setup()
    click.sound.play('click')
    expect(click.leads).toEqual([LEAD_HZ.click])
    expect(click.noises).toEqual([1800])
    const paper = setup()
    paper.sound.play('paper')
    expect(paper.leads).toEqual([])
    expect(paper.noises).toEqual([LEAD_HZ.paper, 4500])
  })
  it('a win is the two approved melodies alone: no noise layer (a synthesised zipper was tried and dropped)', () => {
    const complete = setup()
    complete.sound.play('complete')
    expect(complete.noises).toEqual([])
    expect(complete.leads).toEqual([523.25, 659.25, 783.99, 1046.5])
    const perfect = setup()
    perfect.sound.play('perfect')
    expect(perfect.noises).toEqual([])
    expect(perfect.leads).toEqual([587.33, 783.99, 987.77, 1174.66, 1567.98])
  })
  it('click and paper respect their rate limits and mute', () => {
    const t = setup()
    t.sound.play('click')
    t.sound.play('click')
    t.advance(20)
    t.sound.play('click')
    expect(t.leads.filter((hz) => hz === LEAD_HZ.click)).toHaveLength(1)
    t.sound.setMuted(true)
    t.advance(500)
    t.sound.play('paper')
    expect(t.noises.filter((hz) => hz === LEAD_HZ.paper)).toHaveLength(0)
  })
})

describe('mute', () => {
  it('a muted sound system plays nothing and never creates an audio context', () => {
    const t = setup('running', true)
    for (const e of EVENTS) t.sound.play(e)
    t.sound.unlock()
    expect(t.make).not.toHaveBeenCalled()
    expect(t.leads).toEqual([])
  })
  it('muting stops sounds at once and unmuting brings them back', () => {
    const t = setup()
    t.sound.play('place')
    const before = t.leads.length
    t.sound.setMuted(true)
    t.advance(1000)
    t.sound.play('place')
    expect(t.leads).toHaveLength(before)
    expect(t.sound.isMuted()).toBe(true)
    t.sound.setMuted(false)
    t.sound.play('place')
    expect(t.leads.length).toBeGreaterThan(before)
  })
})

describe('mix', () => {
  it('ends in one master gain and a soft limiter before the speakers, and a browser without a WaveShaper still plays', () => {
    const t = setup()
    const limiter = vi.spyOn(t.ctx, 'createWaveShaper')
    t.sound.play('place')
    expect(limiter).toHaveBeenCalledTimes(1)
    const bare = setup()
    delete (bare.ctx as { createWaveShaper?: unknown }).createWaveShaper
    bare.sound.play('place')
    expect(bare.leads).toEqual([LEAD_HZ.place])
  })
})

describe('default', () => {
  it('a new sound system is silent and creates nothing until told to be on', () => {
    const fake = fakeContext()
    const make = vi.fn(() => fake.ctx as unknown as AudioContext)
    const sound = createSound({ createContext: make })
    expect(sound.isMuted()).toBe(true)
    sound.play('place')
    sound.unlock()
    expect(make).not.toHaveBeenCalled()
    sound.setMuted(false)
    sound.play('place')
    expect(make).toHaveBeenCalledTimes(1)
  })
})

describe('lazy start and unsupported audio', () => {
  it('creates the context on first use only, and keeps one', () => {
    const t = setup()
    expect(t.make).not.toHaveBeenCalled()
    t.sound.play('pickup')
    t.advance(500)
    t.sound.play('rotate')
    t.sound.unlock()
    expect(t.make).toHaveBeenCalledTimes(1)
  })
  it('does nothing, without throwing, when the browser has no Web Audio', () => {
    const sound = createSound({ createContext: () => null, muted: false })
    expect(() => {
      sound.unlock()
      for (const e of EVENTS) sound.play(e)
    }).not.toThrow()
  })
  it('does nothing, without throwing, when creating the context fails', () => {
    const make = vi.fn(() => {
      throw new Error('blocked')
    })
    const sound = createSound({ createContext: make, muted: false })
    expect(() => {
      sound.play('place')
      sound.play('rotate')
    }).not.toThrow()
    expect(make).toHaveBeenCalledTimes(1) // it does not keep retrying
  })
  it('survives a voice that throws', () => {
    const t = setup()
    t.ctx.createOscillator = () => {
      throw new Error('boom')
    }
    expect(() => t.sound.play('place')).not.toThrow()
  })
})

describe('suspended context', () => {
  it('resumes, then plays a sound that is still prompt', async () => {
    const t = setup('suspended')
    t.sound.play('place')
    expect(t.leads).toEqual([])
    await Promise.resolve()
    await Promise.resolve()
    expect(t.ctx.resume).toHaveBeenCalled()
    expect(t.leads[0]).toBe(LEAD_HZ.place)
  })
  it('drops a sound that would arrive late, or after muting', async () => {
    const late = setup('suspended')
    late.ctx.resume = vi.fn(() => {
      late.advance(400)
      late.ctx.state = 'running'
      return Promise.resolve()
    })
    late.sound.play('place')
    await Promise.resolve()
    await Promise.resolve()
    expect(late.leads).toEqual([])
    const muted = setup('suspended')
    muted.sound.play('place')
    muted.sound.setMuted(true)
    await Promise.resolve()
    await Promise.resolve()
    expect(muted.leads).toEqual([])
  })
  it('unlock resumes a suspended context from a player action', () => {
    const t = setup('suspended')
    t.sound.unlock()
    expect(t.ctx.resume).toHaveBeenCalledTimes(1)
  })
  it('survives a resume that rejects', async () => {
    const t = setup('suspended')
    t.ctx.resume = vi.fn(() => Promise.reject(new Error('no')))
    expect(() => t.sound.play('place')).not.toThrow()
    await Promise.resolve()
  })
})

describe('rate limiting', () => {
  it('drops a repeat of the same sound inside its minimum gap, but not a different sound', () => {
    const t = setup()
    t.sound.play('rotate')
    t.sound.play('rotate')
    t.advance(10)
    t.sound.play('rotate')
    expect(t.leads.filter((hz) => hz === LEAD_HZ.rotate)).toHaveLength(1)
    t.sound.play('invalid')
    expect(t.leads).toContain(LEAD_HZ.invalid)
    t.advance(100)
    t.sound.play('rotate')
    expect(t.leads.filter((hz) => hz === LEAD_HZ.rotate)).toHaveLength(2)
  })
})

describe('dispose', () => {
  it('closes the context once', () => {
    const t = setup()
    t.sound.play('pickup')
    t.sound.dispose()
    t.sound.dispose()
    expect(t.ctx.close).toHaveBeenCalledTimes(1)
  })
})
