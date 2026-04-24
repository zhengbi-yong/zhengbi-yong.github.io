'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useDarkModeSnapshot } from '@/lib/hooks/useDarkModeSnapshot'
import musicData from '@/data/musicData'
import JSZip from 'jszip'
import * as Tone from 'tone'

interface OpenSheetMusicDisplay {
  load: (score: string) => Promise<void>
  render: () => void
  zoom: number
  clear: () => void
}

// PlayerState enum values
const PLAYER_STOPPED = 0
const PLAYER_PLAYING = 1
const PLAYER_PAUSED = 2

export default function MusicExperience() {
  const isDark = useDarkModeSnapshot()
  const [activeTrack, setActiveTrack] = useState(0)
  const [playerState, setPlayerState] = useState<number>(PLAYER_STOPPED)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const osmdRef = useRef<OpenSheetMusicDisplay | null>(null)
  const initializedRef = useRef(false)
  const currentTrackSrcRef = useRef<string>('')
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const partRef = useRef<Tone.Part | null>(null)

  const track = musicData[activeTrack]

  const extractMXL = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const zip = await JSZip.loadAsync(arrayBuffer)
    let rootFilePath = ''

    const containerFile = zip.files['META-INF/container.xml']
    if (containerFile) {
      try {
        const containerXml = await containerFile.async('string')
        const parser = new DOMParser()
        const doc = parser.parseFromString(containerXml, 'text/xml')
        const rootfile = doc.querySelector('rootfile')
        if (rootfile) {
          rootFilePath = rootfile.getAttribute('full-path') || ''
        }
      } catch (err) {
        console.warn('Cannot parse container.xml:', err)
      }
    }

    if (!rootFilePath) {
      const xmlFiles = Object.keys(zip.files).filter(
        (name) => name.endsWith('.xml') && !zip.files[name].dir && !name.startsWith('META-INF/')
      )
      if (xmlFiles.length === 0) {
        throw new Error('No MusicXML file found in MXL archive')
      }
      rootFilePath =
        xmlFiles.find(
          (name) => name.toLowerCase().includes('score') || name.toLowerCase().includes('partwise')
        ) || xmlFiles[0]
    }

    const rootFile = zip.files[rootFilePath]
    if (!rootFile) {
      throw new Error(`Root file not found in MXL: ${rootFilePath}`)
    }

    return await rootFile.async('string')
  }

  // Initialize Tone.js synth
  const initSynth = useCallback(() => {
    if (synthRef.current) return synthRef.current
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.3,
        sustain: 0.4,
        release: 1.2,
      },
    }).toDestination()
    synthRef.current = synth
    return synth
  }, [])

  // Parse simple MusicXML to get note events for playback
  // Handles both multi-part and single-part-multiple-voice formats
  const parseMusicXMLForPlayback = useCallback((xmlContent: string): { time: number; note: string; duration: number }[] => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(xmlContent, 'text/xml')
    const notes: { time: number; note: string; duration: number }[] = []

    const divisions = parseInt(doc.querySelector('divisions')?.textContent || '1', 10)

    // Check if this is a multi-staff single-part file (like MuseScore exports)
    // These have <staves>2</staves> and use <voice> elements
    const parts = doc.querySelectorAll('part')
    const isMultiStaffSinglePart = parts.length === 1 && doc.querySelector('staves') !== null

    if (isMultiStaffSinglePart) {
      // Handle single-part multi-voice format (MuseScore style)
      // Voices are interleaved within measures, separated by <backup> elements
      const part = parts[0]
      const measures = part.querySelectorAll('measure')

      // Calculate measure durations (max of all voices)
      const measureDurations: number[] = []

      measures.forEach((measure) => {
        // Parse measure by processing all notes, respecting backup elements
        let measureDuration = 0
        let currentTime = 0
        let maxTime = 0

        const processElements = (elements: NodeListOf<ChildNode>) => {
          elements.forEach((el) => {
            if (el.nodeName === 'note') {
              const noteEl = el as Element
              const chord = noteEl.querySelector('chord')
              const rest = noteEl.querySelector('rest')
              const duration = parseInt(noteEl.querySelector('duration')?.textContent || '1', 10) / divisions

              if (chord) {
                // Chord note doesn't advance time
                return
              }

              if (rest) {
                currentTime += duration
                return
              }

              // It's a real note
              maxTime = Math.max(maxTime, currentTime + duration)
              if (!rest) {
                currentTime += duration
              }
            } else if (el.nodeName === 'backup') {
              const durationEl = (el as Element).querySelector('duration')
              if (durationEl) {
                const duration = parseInt(durationEl.textContent || '1', 10) / divisions
                currentTime -= duration
              }
            } else if (el.nodeName === 'forward') {
              const durationEl = (el as Element).querySelector('duration')
              if (durationEl) {
                const duration = parseInt(durationEl.textContent || '1', 10) / divisions
                currentTime += duration
                maxTime = Math.max(maxTime, currentTime)
              }
            }
          })
        }

        // Get all child elements of measure (including note, backup, forward)
        const childElements = measure.childNodes
        processElements(childElements as NodeListOf<ChildNode>)

        measureDuration = maxTime
        measureDurations.push(measureDuration)
      })

      // Calculate cumulative offsets
      const measureOffsets: number[] = [0]
      for (let i = 1; i < measureDurations.length; i++) {
        measureOffsets[i] = measureOffsets[i - 1] + measureDurations[i - 1]
      }

      // Second pass: extract notes with proper voice handling
      let currentVoiceTime = 0

      measures.forEach((measure, measureIdx) => {
        const measureTime = measureOffsets[measureIdx]
        currentVoiceTime = 0

        const childElements = measure.childNodes
        childElements.forEach((el) => {
          if (el.nodeName === 'note') {
            const noteEl = el as Element
            const chord = noteEl.querySelector('chord')
            const rest = noteEl.querySelector('rest')
            const duration = parseInt(noteEl.querySelector('duration')?.textContent || '1', 10) / divisions

            // Skip chord notes (they share time with previous note)
            if (chord) {
              // Get the pitch info and add at current time
              const pitchElement = noteEl.querySelector('pitch')
              if (pitchElement && !rest) {
                const step = pitchElement.querySelector('step')?.textContent || 'C'
                const octave = parseInt(pitchElement.querySelector('octave')?.textContent || '4', 10)
                const alter = parseInt(pitchElement.querySelector('alter')?.textContent || '0', 10)

                const stepMap: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
                const midiNote = (octave + 1) * 12 + stepMap[step] + alter
                const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
                const noteName = noteNames[midiNote % 12]

                notes.push({
                  time: measureTime + currentVoiceTime,
                  note: `${noteName}${Math.floor(midiNote / 12) - 1}`,
                  duration: duration,
                })
              }
              return
            }

            // Skip rests
            if (rest) {
              currentVoiceTime += duration
              return
            }

            const pitchElement = noteEl.querySelector('pitch')
            if (!pitchElement) {
              currentVoiceTime += duration
              return
            }

            const step = pitchElement.querySelector('step')?.textContent || 'C'
            const octave = parseInt(pitchElement.querySelector('octave')?.textContent || '4', 10)
            const alter = parseInt(pitchElement.querySelector('alter')?.textContent || '0', 10)

            // Convert to MIDI note number
            const stepMap: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
            const midiNote = (octave + 1) * 12 + stepMap[step] + alter
            const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            const noteName = noteNames[midiNote % 12]

            notes.push({
              time: measureTime + currentVoiceTime,
              note: `${noteName}${Math.floor(midiNote / 12) - 1}`,
              duration: duration,
            })

            currentVoiceTime += duration
          } else if (el.nodeName === 'backup') {
            const durationEl = (el as Element).querySelector('duration')
            if (durationEl) {
              const duration = parseInt(durationEl.textContent || '1', 10) / divisions
              currentVoiceTime -= duration
              // Clamp to 0 to handle any parsing edge cases
              if (currentVoiceTime < 0) currentVoiceTime = 0
            }
          } else if (el.nodeName === 'forward') {
            const durationEl = (el as Element).querySelector('duration')
            if (durationEl) {
              const duration = parseInt(durationEl.textContent || '1', 10) / divisions
              currentVoiceTime += duration
            }
          }
        })
      })
    } else {
      // Handle multi-part format (separate <part> elements)
      // Track max duration per measure across all parts to sync them
      const measureMaxDurations: number[] = []

      // First pass: find the max duration for each measure across all parts
      parts.forEach((part) => {
        const measures = part.querySelectorAll('measure')
        measures.forEach((measure, idx) => {
          let measureDuration = 0
          const noteElements = measure.querySelectorAll('note')
          noteElements.forEach((note) => {
            const chord = note.querySelector('chord')
            if (!chord) {
              const duration = parseInt(note.querySelector('duration')?.textContent || '1', 10) / divisions
              measureDuration += duration
            }
          })
          if (!measureMaxDurations[idx]) measureMaxDurations[idx] = 0
          measureMaxDurations[idx] = Math.max(measureMaxDurations[idx], measureDuration)
        })
      })

      // Calculate cumulative offsets for each measure
      const measureOffsets: number[] = [0]
      for (let i = 1; i < measureMaxDurations.length; i++) {
        measureOffsets[i] = measureOffsets[i - 1] + measureMaxDurations[i - 1]
      }

      // Second pass: extract notes from each part
      parts.forEach((part) => {
        const measures = part.querySelectorAll('measure')

        measures.forEach((measure, measureIdx) => {
          const noteElements = measure.querySelectorAll('note')
          const measureTime = measureOffsets[measureIdx]
          let rawTime = 0

          noteElements.forEach((note) => {
            const rest = note.querySelector('rest')
            const chord = note.querySelector('chord')
            const duration = parseInt(note.querySelector('duration')?.textContent || '1', 10) / divisions

            // Skip rests (they don't produce sound)
            if (rest) {
              if (!chord) {
                rawTime += duration
              }
              return
            }

            const pitchElement = note.querySelector('pitch')
            if (!pitchElement) {
              if (!chord) {
                rawTime += duration
              }
              return
            }

            const step = pitchElement.querySelector('step')?.textContent || 'C'
            const octave = parseInt(pitchElement.querySelector('octave')?.textContent || '4', 10)
            const alter = parseInt(pitchElement.querySelector('alter')?.textContent || '0', 10)

            // Convert to MIDI note number
            const stepMap: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
            const midiNote = (octave + 1) * 12 + stepMap[step] + alter

            // Convert MIDI note to note name
            const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
            const noteName = noteNames[midiNote % 12]

            const globalTime = measureTime + rawTime

            notes.push({
              time: globalTime,
              note: `${noteName}${Math.floor(midiNote / 12) - 1}`,
              duration: duration,
            })

            // Only advance rawTime for non-chord notes
            if (!chord) {
              rawTime += duration
            }
          })
        })
      })
    }

    // Sort notes by time for proper playback order
    notes.sort((a, b) => a.time - b.time)

    return notes
  }, [])

  // Load score and prepare for playback
  const loadScore = useCallback(async (filePath: string) => {
    if (!osmdRef.current || !containerRef.current) return
    if (currentTrackSrcRef.current === filePath && !isLoading) return

    setIsLoading(true)
    setLoadError(null)

    try {
      const isMXL = filePath.toLowerCase().endsWith('.mxl')
      const cleanFilePath = filePath.replace(/^\/musicxml\//, '')

      const possiblePaths = [
        `/musicxml/${cleanFilePath}`,
        `${window.location.origin}/musicxml/${cleanFilePath}`,
      ]

      let xmlContent = ''
      for (const path of possiblePaths) {
        try {
          const response = await fetch(path)
          if (response.ok) {
            if (isMXL) {
              const arrayBuffer = await response.arrayBuffer()
              xmlContent = await extractMXL(arrayBuffer)
              break
            } else {
              const contentType = response.headers.get('content-type') || ''
              if (contentType.includes('xml') || contentType.includes('text')) {
                const text = await response.text()
                if (text.trim().startsWith('<?xml')) {
                  xmlContent = text
                  break
                }
              }
            }
          }
        } catch {
          // Try next path
        }
      }

      if (!xmlContent) {
        throw new Error(`Cannot find or load MusicXML file: ${filePath}`)
      }

      currentTrackSrcRef.current = filePath
      await osmdRef.current.load(xmlContent)
      osmdRef.current.zoom = 0.8
      osmdRef.current.render()

      setIsLoading(false)
    } catch (err) {
      console.error('Load score error:', err)
      setLoadError(err instanceof Error ? err.message : 'Failed to load score')
      setIsLoading(false)
    }
  }, [isLoading, extractMXL])

  // Initialize OSMD only once
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    const initializeOSMD = async () => {
      try {
        const OSMDModule = await import('opensheetmusicdisplay')

        let OpenSheetMusicDisplayClass: any = null

        if (OSMDModule.OpenSheetMusicDisplay) {
          OpenSheetMusicDisplayClass = OSMDModule.OpenSheetMusicDisplay
        } else if ((OSMDModule as any).default) {
          const defaultExport = (OSMDModule as any).default
          if (defaultExport.OpenSheetMusicDisplay) {
            OpenSheetMusicDisplayClass = defaultExport.OpenSheetMusicDisplay
          } else if (typeof defaultExport === 'function') {
            OpenSheetMusicDisplayClass = defaultExport
          }
        } else if (typeof window !== 'undefined' && (window as any).OpenSheetMusicDisplay) {
          OpenSheetMusicDisplayClass = (window as any).OpenSheetMusicDisplay
        }

        if (!OpenSheetMusicDisplayClass) {
          throw new Error('Cannot find OpenSheetMusicDisplay class')
        }

        if (!containerRef.current) return

        const osmd = new OpenSheetMusicDisplayClass(containerRef.current, {
          autoResize: true,
          backend: 'svg',
          drawTitle: false,
          drawSubtitle: false,
          drawComposer: false,
          drawLyricist: false,
          drawPartNames: true,
          drawMeasureNumbers: false,
          drawTimeSignatures: true,
        })

        osmdRef.current = osmd
        await loadScore(track.src)
      } catch (err) {
        console.error('OSMD init error:', err)
        setLoadError(err instanceof Error ? err.message : 'Failed to initialize')
        setIsLoading(false)
      }
    }

    initializeOSMD()
  }, [loadScore, track.src])

  // Handle track change
  useEffect(() => {
    if (!initializedRef.current) return
    if (currentTrackSrcRef.current === track.src) return

    // Stop any playing audio
    if (partRef.current) {
      partRef.current.stop()
      partRef.current = null
    }
    setPlayerState(PLAYER_STOPPED)

    loadScore(track.src)
  }, [activeTrack, track.src, loadScore])

  // Toggle play/pause
  const togglePlay = useCallback(async () => {
    if (playerState === PLAYER_PLAYING) {
      // Pause - stop the part and transport
      if (partRef.current) {
        partRef.current.stop()
        partRef.current = null
      }
      Tone.getTransport().pause()
      setPlayerState(PLAYER_PAUSED)
      return
    }

    if (playerState === PLAYER_PAUSED && partRef.current) {
      // Resume from pause
      Tone.getTransport().start()
      setPlayerState(PLAYER_PLAYING)
      return
    }

    // Start fresh playback
    try {
      // Ensure AudioContext is running
      const audioCtx = Tone.getContext().rawContext as AudioContext
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume()
      }

      // Set BPM to 120 for consistent timing (MusicXML divisions are in beats)
      Tone.getTransport().bpm.value = 120

      // Stop any existing part
      if (partRef.current) {
        partRef.current.stop()
        partRef.current.dispose()
        partRef.current = null
      }

      // If not initialized, create synth
      const synth = initSynth()

      // Parse the current track's MusicXML
      const isMXL = track.src.toLowerCase().endsWith('.mxl')
      const cleanFilePath = track.src.replace(/^\/musicxml\//, '')
      const xmlContent = await (async () => {
        const response = await fetch(`/musicxml/${cleanFilePath}`)
        if (!response.ok) throw new Error('Failed to fetch')
        if (isMXL) {
          const buffer = await response.arrayBuffer()
          return await extractMXL(buffer)
        }
        return await response.text()
      })()

      const notes = parseMusicXMLForPlayback(xmlContent)

      if (notes.length === 0) {
        setLoadError('No playable notes found in this score')
        return
      }

      type NoteEvent = { time: number; note: string; duration: number }

      // Create Tone.Part with the synth
      // Time is in beats (quarters), so 1 = one beat
      const part = new Tone.Part(
        (time, value: NoteEvent) => {
          // Duration in Tone.js is also in beats
          synth.triggerAttackRelease(value.note, value.duration, time)
        },
        notes.map((e) => [e.time, e] as [number, NoteEvent])
      )

      partRef.current = part
      setPlayerState(PLAYER_PLAYING)

      // Start transport and part
      Tone.getTransport().start()
      part.start(0)

      // Calculate total duration for fallback timeout
      const lastNote = notes[notes.length - 1]
      const totalDuration = (lastNote.time + lastNote.duration) * (60 / 120) + 0.5 // Convert beats to seconds

      // Set timeout to detect end of playback
      setTimeout(() => {
        if (partRef.current && playerState === PLAYER_PLAYING) {
          setPlayerState(PLAYER_STOPPED)
        }
      }, totalDuration * 1000)
    } catch (err) {
      console.error('Playback error:', err)
      setLoadError(err instanceof Error ? err.message : 'Playback failed')
      setPlayerState(PLAYER_STOPPED)
    }
  }, [playerState, track.src, initSynth, parseMusicXMLForPlayback, extractMXL])

  const handleTrackChange = useCallback((index: number) => {
    if (index === activeTrack) return

    // Stop current playback
    if (partRef.current) {
      partRef.current.stop()
      partRef.current = null
    }
    setPlayerState(PLAYER_STOPPED)
    setActiveTrack(index)
  }, [activeTrack])

  const accentColor = isDark ? 'text-purple-300' : 'text-purple-600'
  const mutedColor = isDark ? 'text-gray-400' : 'text-gray-500'
  const textColor = isDark ? 'text-gray-100' : 'text-gray-800'

  return (
    <section className="relative py-24 sm:py-32 overflow-hidden" aria-label="Music">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <span className={`text-xs tracking-[0.3em] uppercase ${mutedColor} block mb-2`}>
            Music
          </span>
          <h2 className={`font-visitor-serif text-3xl sm:text-4xl ${textColor}`}>
            Listen & Explore
          </h2>
        </motion.div>

        {/* Split Screen Layout */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-5 gap-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          {/* Sheet Music - Left 60% */}
          <div className="lg:col-span-3 relative">
            <div
              className={`
                rounded-3xl overflow-hidden
                border ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}
                ${isDark ? 'bg-[#0D0D15]' : 'bg-gray-50'}
                min-h-[300px] sm:min-h-[400px]
              `}
            >
              {/* Loading state */}
              {isLoading && (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-gray-400 text-sm">Loading score...</span>
                  </div>
                </div>
              )}

              {/* Error state */}
              {loadError && !isLoading && (
                <div className="flex items-center justify-center h-[400px]">
                  <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-500'}`}>
                    {loadError}
                  </p>
                </div>
              )}

              {/* Score container */}
              <div
                ref={containerRef}
                className="relative z-10 p-4 sm:p-6 overflow-y-auto"
                style={{
                  display: isLoading || loadError ? 'none' : 'block',
                  maxHeight: '400px'
                }}
              />
            </div>
          </div>

          {/* Track Info + Controls - Right 40% */}
          <div className="lg:col-span-2 flex flex-col justify-between gap-6">
            {/* Track Info */}
            <div
              className={`
                rounded-3xl p-6 sm:p-8
                border ${isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'}
                ${isDark ? 'bg-[#0D0D15]' : 'bg-gray-50'}
              `}
            >
              <span className={`text-xs tracking-[0.2em] uppercase ${accentColor} block mb-4`}>
                {track.category || 'Score'}
              </span>
              <h3 className={`font-visitor-serif text-2xl sm:text-3xl ${textColor} mb-2`}>
                {track.title}
              </h3>
              {track.composer && (
                <p className={`text-sm ${mutedColor} mb-4`}>{track.composer}</p>
              )}
              {track.description && (
                <p className={`text-sm ${mutedColor} line-clamp-3`}>{track.description}</p>
              )}

              <div className="flex items-center gap-4 mt-6">
                {track.instrument && (
                  <span className={`text-xs px-3 py-1 rounded-full border ${isDark ? 'border-white/10 text-gray-400' : 'border-black/10 text-gray-500'}`}>
                    {track.instrument}
                  </span>
                )}
                {track.difficulty && (
                  <span className={`text-xs px-3 py-1 rounded-full border ${isDark ? 'border-amber-400/30 text-amber-300' : 'border-amber-500/30 text-amber-600'}`}>
                    {track.difficulty}
                  </span>
                )}
              </div>
            </div>

            {/* Play Button */}
            <button
              onClick={togglePlay}
              disabled={isLoading || !!loadError}
              className={`
                group relative flex items-center justify-center gap-3
                rounded-3xl p-6
                border transition-all duration-500
                ${isLoading || loadError
                  ? 'opacity-50 cursor-not-allowed'
                  : playerState === PLAYER_PLAYING
                    ? isDark
                      ? 'border-purple-400/30 bg-purple-400/10'
                      : 'border-purple-500/30 bg-purple-50'
                    : isDark
                      ? 'border-white/[0.06] hover:border-purple-400/20 bg-[#0D0D15]'
                      : 'border-black/[0.06] hover:border-purple-500/20 bg-gray-50'
                }
              `}
            >
              <span className={`text-3xl transition-transform duration-300 group-hover:scale-110 ${accentColor}`}>
                {playerState === PLAYER_PLAYING ? '⏸' : '▶'}
              </span>
              <span className={`text-sm tracking-[0.15em] uppercase ${mutedColor}`}>
                {playerState === PLAYER_PLAYING ? 'Pause' : (isLoading ? 'Loading...' : 'Play')}
              </span>
            </button>

            {/* Track Selector */}
            <div className="flex gap-2">
              {musicData.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => handleTrackChange(i)}
                  className={`
                    flex-1 py-2 rounded-xl text-xs tracking-wide transition-all duration-300
                    ${i === activeTrack
                      ? isDark
                        ? 'bg-purple-400/20 text-purple-300 border border-purple-400/30'
                        : 'bg-purple-100 text-purple-700 border border-purple-300'
                      : isDark
                        ? 'bg-white/[0.03] text-gray-500 border border-white/[0.04] hover:border-white/[0.1]'
                        : 'bg-gray-50 text-gray-500 border border-black/[0.04] hover:border-black/[0.1]'
                    }
                  `}
                >
                  {t.title.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
