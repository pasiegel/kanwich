import { useKanwichStore } from '../store/useKanwichStore'

// All sound effects are synthesized on the fly with the Web Audio API —
// no audio files to bundle, no licensing to worry about, and it works
// offline like everything else in this app. Deliberately goofy, not slick.

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(
  audio: AudioContext,
  {
    freqStart,
    freqEnd = freqStart,
    duration,
    type = 'sine',
    peak = 0.12,
    delay = 0,
  }: {
    freqStart: number
    freqEnd?: number
    duration: number
    type?: OscillatorType
    peak?: number
    delay?: number
  },
) {
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  const t0 = audio.currentTime + delay
  osc.type = type
  osc.frequency.setValueAtTime(freqStart, t0)
  osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), t0 + duration)
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(peak, t0 + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration)
  osc.connect(gain).connect(audio.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.02)
}

const EFFECTS: Record<string, (audio: AudioContext) => void> = {
  click: (a) => tone(a, { freqStart: 520, freqEnd: 300, duration: 0.05, type: 'square', peak: 0.06 }),

  // Cheerful little "ta-da" arpeggio for a brand new board.
  createBoard: (a) => {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
      tone(a, { freqStart: f, duration: 0.14, type: 'triangle', peak: 0.1, delay: i * 0.08 }),
    )
  },

  // A friendly little "boop" for a new card.
  createCard: (a) => {
    tone(a, { freqStart: 440, freqEnd: 660, duration: 0.09, type: 'sine', peak: 0.1 })
  },

  // A single bright xylophone-ish "plink" for a new column.
  createColumn: (a) => {
    tone(a, { freqStart: 1046.5, freqEnd: 1318.5, duration: 0.1, type: 'triangle', peak: 0.09 })
  },

  // Classic comedic "womp womp" for deleting something.
  delete: (a) => {
    tone(a, { freqStart: 330, freqEnd: 220, duration: 0.22, type: 'sawtooth', peak: 0.1 })
    tone(a, { freqStart: 220, freqEnd: 110, duration: 0.32, type: 'sawtooth', peak: 0.1, delay: 0.2 })
  },
}

export type SoundName = keyof typeof EFFECTS

export function playSound(name: SoundName) {
  if (!useKanwichStore.getState().soundEnabled) return
  try {
    EFFECTS[name](getCtx())
  } catch {
    // Web Audio can be unavailable/blocked in some embedded contexts —
    // sound is a nice-to-have, never worth breaking the app over.
  }
}
