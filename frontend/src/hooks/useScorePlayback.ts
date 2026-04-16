'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as Tone from 'tone'

export interface ParsedNote {
  id: string
  pitch: string // e.g., "C4", "F#5"
  midi: number // 0-127
  startTime: number // in seconds
  duration: number // in seconds
  measure: number // measure index (0-based)
  divisions: number
  voice: number
  staff: number
}

export interface ParsedScore {
  notes: ParsedNote[]
  totalDuration: number // in seconds
  tempo: number // BPM
  timeSignature: [number, number] // [beats, beatType]
  divisions: number // divisions per quarter note
  measures: number
}

export interface PlaybackState {
  isPlaying: boolean
  currentTime: number // in seconds
  currentMeasure: number
  tempo: number
  isLooping: boolean
  loopStart: number // measure index
  loopEnd: number // measure index
}

interface UseScorePlaybackReturn {
  playbackState: PlaybackState
  parsedScore: ParsedScore | null
  play: () => Promise<void>
  pause: () => void
  stop: () => void
  seek: (time: number) => void
  seekToMeasure: (measure: number) => void
  setTempo: (bpm: number) => void
  toggleLoop: () => void
  setLoopPoints: (start: number, end: number) => void
  getMeasureStartTime: (measure: number) => number
}

// Parse a MusicXML pitch string to MIDI note number
function pitchToMidi(step: string, octave: number, alter: number = 0): number {
  const stepValues: Record<string, number> = {
    C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
  }
  const midi = 12 + octave * 12 + (stepValues[step] ?? 0) + (alter ?? 0)
  return midi
}

// Convert MIDI note number to note name
function midiToNoteName(midi: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const octave = Math.floor(midi / 12) - 1
  const noteName = noteNames[midi % 12]
  return `${noteName}${octave}`
}

// MusicXML parser
function parseMusicXML(xmlString: string): ParsedScore {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlString, 'text/xml')
  const notes: ParsedNote[] = []

  // Get divisions (divisions per quarter note)
  const divisionsEl = doc.querySelector('divisions')
  const divisions = divisionsEl ? parseInt(divisionsEl.textContent || '1', 10) : 1

  // Get tempo from direction
  let tempo = 120
  const tempoDir = doc.querySelector('direction[type="Tempo"]')
  if (tempoDir) {
    const sound = tempoDir.querySelector('sound')
    if (sound) {
      const tempoAttr = sound.getAttribute('tempo')
      if (tempoAttr) tempo = parseFloat(tempoAttr)
    }
  }
  // Also check for metronome mark
  const metronome = doc.querySelector('metronome')
  if (metronome) {
    const perMinute = metronome.querySelector('per-minute')
    if (perMinute) {
      tempo = parseInt(perMinute.textContent || '120', 10)
    }
  }

  // Get time signature
  let beats = 4
  let beatType = 4
  const timeEl = doc.querySelector('time')
  if (timeEl) {
    const beatsEl = timeEl.querySelector('beats')
    const beatTypeEl = timeEl.querySelector('beat-type')
    if (beatsEl) beats = parseInt(beatsEl.textContent || '4', 10)
    if (beatTypeEl) beatType = parseInt(beatTypeEl.textContent || '4', 10)
  }

  // Calculate seconds per quarter note
  const secondsPerQuarter = 60.0 / tempo

  // Parse all parts
  const parts = doc.querySelectorAll('part')
  let totalMeasures = 0

  parts.forEach((part) => {
    const partId = part.getAttribute('id') || 'part1'
    const measures = part.querySelectorAll('measure')
    totalMeasures = Math.max(totalMeasures, measures.length)

    let currentTime = 0 // in divisions
    let currentMeasure = 0

    measures.forEach((measure) => {
      // Check for measure-level time modification

      // Get attributes for this measure (may override global)
      const attributes = measure.querySelector('attributes')
      let measureDivs = divisions
      let measureTempo = tempo
      if (attributes) {
        const divsEl = attributes.querySelector('divisions')
        if (divsEl) measureDivs = parseInt(divsEl.textContent || String(divisions), 10)
      }

      // Check for forward direction (don't advance time)
      const directions = measure.querySelectorAll('direction')
      directions.forEach((dir) => {
        const sound = dir.querySelector('sound')
        if (sound) {
          const tempoAttr = sound.getAttribute('tempo')
          if (tempoAttr) measureTempo = parseFloat(tempoAttr)
        }
      })

      // Check for new time signature within this measure
      if (attributes) {
        const ts = attributes.querySelector('time')
        if (ts) {
          const bEl = ts.querySelector('beats')
          const btEl = ts.querySelector('beat-type')
          if (bEl) beats = parseInt(bEl.textContent || '4', 10)
          if (btEl) beatType = parseInt(btEl.textContent || '4', 10)
        }
      }

      // Duration of this measure in divisions (time signature * divisions)
      const measureDurationDivs = beats * measureDivs

      // Parse notes in this measure
      const noteElements = measure.querySelectorAll('note')

      noteElements.forEach((noteEl) => {
        // Check if it's a chord (start time doesn't advance)
        const isChord = noteEl.querySelector('chord') !== null

        // Get duration
        const durationEl = noteEl.querySelector('duration')
        const noteDurationDivs = durationEl ? parseInt(durationEl.textContent || '0', 10) : 0

        // Get voice and staff
        const voiceEl = noteEl.querySelector('voice')
        const staffEl = noteEl.querySelector('staff')
        const voice = voiceEl ? parseInt(voiceEl.textContent || '1', 10) : 1
        const staff = staffEl ? parseInt(staffEl.textContent || '1', 10) : 1

        // Check if it's a rest
        const isRest = noteEl.querySelector('rest') !== null

        // Get pitch
        let pitch = 'C4'
        let midi = 60

        if (!isRest) {
          const pitchEl = noteEl.querySelector('pitch')
          if (pitchEl) {
            const stepEl = pitchEl.querySelector('step')
            const octaveEl = pitchEl.querySelector('octave')
            const alterEl = pitchEl.querySelector('alter')

            const step = stepEl?.textContent || 'C'
            const octave = octaveEl ? parseInt(octaveEl.textContent || '4', 10) : 4
            const alter = alterEl ? parseInt(alterEl.textContent || '0', 10) : 0

            midi = pitchToMidi(step, octave, alter)
            pitch = midiToNoteName(midi)
          }
        } else {
          pitch = 'rest'
        }

        // Calculate start time in seconds
        // For chord notes, use the same start time as the previous note
        const noteStartDivs = isChord ? currentTime - (notes.length > 0 ? notes[notes.length - 1].duration * divisions / notes[notes.length - 1].divisions : 0) : currentTime
        const startTime = (noteStartDivs / measureDivs) * (60.0 / measureTempo)

        // Duration in seconds
        const durationSec = (noteDurationDivs / measureDivs) * secondsPerQuarter

        if (noteDurationDivs > 0) {
          notes.push({
            id: `${partId}-m${currentMeasure}-n${notes.length}`,
            pitch,
            midi,
            startTime,
            duration: durationSec,
            measure: currentMeasure,
            divisions: measureDivs,
            voice,
            staff,
          })
        }

        // Advance time by the actual note duration (not for chords)
        if (!isChord && noteDurationDivs > 0) {
          currentTime += noteDurationDivs
        }
      })

      // Also handle forward elements (backup/repeat)
      // Move time forward for next measure
      currentTime = currentTime % measureDurationDivs
      if (currentTime === 0 || noteElements.length === 0) {
        currentMeasure++
      } else {
        // Some notes were processed but didn't fill the measure
        currentMeasure++
      }
    })
  })

  // Calculate total duration
  const totalDuration = notes.length > 0 ? Math.max(...notes.map((n) => n.startTime + n.duration)) + 1 : 0

  return {
    notes,
    totalDuration,
    tempo,
    timeSignature: [beats, beatType],
    divisions,
    measures: totalMeasures,
  }
}

export function useScorePlayback(xmlContent: string | null): UseScorePlaybackReturn {
  const [parsedScore, setParsedScore] = useState<ParsedScore | null>(null)
  const [playbackState, setPlaybackState] = useState<PlaybackState>({
    isPlaying: false,
    currentTime: 0,
    currentMeasure: 0,
    tempo: 120,
    isLooping: false,
    loopStart: 0,
    loopEnd: 0,
  })

  const synthRef = useRef<Tone.PolySynth | null>(null)
  const partRef = useRef<Tone.Part | null>(null)
  const loopRef = useRef<Tone.Loop | null>(null)
  const isInitializedRef = useRef(false)
  const isPlayingRef = useRef(false)

  // Parse MusicXML when content changes
  useEffect(() => {
    if (!xmlContent) {
      setParsedScore(null)
      return
    }

    try {
      const score = parseMusicXML(xmlContent)
      setParsedScore(score)
      setPlaybackState((prev) => ({
        ...prev,
        tempo: score.tempo,
        loopEnd: score.measures - 1,
      }))
    } catch (err) {
      console.error('Failed to parse MusicXML:', err)
    }
  }, [xmlContent])

  // Initialize Tone.js synth
  useEffect(() => {
    const initSynth = async () => {
      if (isInitializedRef.current) return
      isInitializedRef.current = true

      await Tone.start()

      const synth = new Tone.PolySynth(Tone.Synth, {
        envelope: {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.3,
          release: 0.8,
        },
      }).toDestination()

      synthRef.current = synth
    }

    void initSynth()

    return () => {
      if (partRef.current) {
        partRef.current.dispose()
        partRef.current = null
      }
      if (loopRef.current) {
        loopRef.current.dispose()
        loopRef.current = null
      }
      if (synthRef.current) {
        synthRef.current.dispose()
        synthRef.current = null
      }
      isInitializedRef.current = false
      isPlayingRef.current = false
    }
  }, [])

  const play = useCallback(async () => {
    if (!parsedScore || parsedScore.notes.length === 0) return

    await Tone.start()

    if (Tone.context.state !== 'running') {
      await Tone.context.resume()
    }

    const synth = synthRef.current
    if (!synth) return

    // Stop any existing playback
    if (partRef.current) {
      partRef.current.stop()
      partRef.current.dispose()
      partRef.current = null
    }

    const { notes, tempo } = parsedScore
    const secondsPerQuarter = 60.0 / tempo

    // Calculate the time offset relative to score start (first note's startTime)
    const scoreStartTime = notes[0]?.startTime ?? 0

    // Create a Tone.js Part with all notes
    // Use absolute seconds for each event's time (Tone.Part interprets these as Transport seconds)
    const events: { time: Tone.Unit.Time; pitch: string; duration: number; midi: number }[] = notes.map((note) => ({
      time: note.startTime - scoreStartTime,
      pitch: note.pitch,
      duration: note.duration,
      midi: note.midi,
    }))

    const part = new Tone.Part((time, event) => {
      if (event.pitch === 'rest') return
      synth.triggerAttackRelease(
        Tone.Frequency(event.midi, 'midi').toNote(),
        event.duration * 0.95,
        time
      )

      // Update current time (throttled via Tone.Draw)
      Tone.Draw.schedule(() => {
        setPlaybackState((prev) => ({
          ...prev,
          currentTime: Tone.Transport.seconds,
          currentMeasure: Math.floor(Tone.Transport.seconds / (secondsPerQuarter * 4)),
        }))
      }, time)
    }, events)

    part.start(0)
    partRef.current = part

    // Set up loop if enabled
    if (playbackState.isLooping) {
      const loopStartSec = (playbackState.loopStart * secondsPerQuarter * 4)
      const loopEndSec = ((playbackState.loopEnd + 1) * secondsPerQuarter * 4)
      Tone.Transport.loopStart = loopStartSec
      Tone.Transport.loopEnd = loopEndSec
      Tone.Transport.loop = true
    }

    Tone.Transport.start()
    isPlayingRef.current = true

    setPlaybackState((prev) => ({ ...prev, isPlaying: true }))
  }, [parsedScore, playbackState.isLooping, playbackState.loopStart, playbackState.loopEnd])

  const pause = useCallback(() => {
    Tone.Transport.pause()
    isPlayingRef.current = false
    setPlaybackState((prev) => ({ ...prev, isPlaying: false }))
  }, [])

  const stop = useCallback(() => {
    Tone.Transport.stop()
    Tone.Transport.seconds = 0
    if (partRef.current) {
      partRef.current.stop()
      partRef.current.dispose()
      partRef.current = null
    }
    isPlayingRef.current = false
    setPlaybackState((prev) => ({
      ...prev,
      isPlaying: false,
      currentTime: 0,
      currentMeasure: 0,
    }))
  }, [])

  const seek = useCallback((time: number) => {
    Tone.Transport.seconds = time
    setPlaybackState((prev) => ({ ...prev, currentTime: time }))
  }, [])

  const seekToMeasure = useCallback((measure: number) => {
    if (!parsedScore) return
    const secondsPerQuarter = 60.0 / parsedScore.tempo
    const measureDuration = secondsPerQuarter * 4 // assuming 4/4
    const targetTime = measure * measureDuration
    seek(targetTime)
    setPlaybackState((prev) => ({ ...prev, currentMeasure: measure }))
  }, [parsedScore, seek])

  const setTempo = useCallback((bpm: number) => {
    const clampedTempo = Math.max(20, Math.min(300, bpm))
    Tone.Transport.bpm.value = clampedTempo
    setPlaybackState((prev) => ({ ...prev, tempo: clampedTempo }))
    if (parsedScore) {
      setParsedScore((prev) => (prev ? { ...prev, tempo: clampedTempo } : null))
    }
  }, [parsedScore])

  const toggleLoop = useCallback(() => {
    setPlaybackState((prev) => {
      const newLooping = !prev.isLooping
      Tone.Transport.loop = newLooping
      return { ...prev, isLooping: newLooping }
    })
  }, [])

  const setLoopPoints = useCallback((start: number, end: number) => {
    if (!parsedScore) return
    const clampedStart = Math.max(0, Math.min(start, parsedScore.measures - 1))
    const clampedEnd = Math.max(clampedStart, Math.min(end, parsedScore.measures - 1))
    setPlaybackState((prev) => ({ ...prev, loopStart: clampedStart, loopEnd: clampedEnd }))

    const secondsPerQuarter = 60.0 / playbackState.tempo
    const loopStartSec = clampedStart * secondsPerQuarter * 4
    const loopEndSec = (clampedEnd + 1) * secondsPerQuarter * 4
    Tone.Transport.loopStart = loopStartSec
    Tone.Transport.loopEnd = loopEndSec
  }, [parsedScore, playbackState.tempo])

  const getMeasureStartTime = useCallback((measure: number): number => {
    if (!parsedScore) return 0
    const secondsPerQuarter = 60.0 / parsedScore.tempo
    return measure * secondsPerQuarter * 4
  }, [parsedScore])

  return {
    playbackState,
    parsedScore,
    play,
    pause,
    stop,
    seek,
    seekToMeasure,
    setTempo,
    toggleLoop,
    setLoopPoints,
    getMeasureStartTime,
  }
}
