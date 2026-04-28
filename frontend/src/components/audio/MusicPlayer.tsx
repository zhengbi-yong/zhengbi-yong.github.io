'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react'

interface Track {
  id: string
  title: string
  artist: string
  url: string
  coverUrl?: string
}

interface MusicPlayerProps {
  tracks: Track[]
  autoPlay?: boolean
  className?: string
}

export function MusicPlayer({ tracks, autoPlay = false, className = '' }: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [volume, setVolume] = useState(1)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const currentTrack = tracks[currentTrackIndex]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined

    const setAudioData = () => {
      setDuration(audio.duration)
      setCurrentTime(audio.currentTime)
    }

    const setAudioTime = () => setCurrentTime(audio.currentTime)

    audio.addEventListener('loadeddata', setAudioData)
    audio.addEventListener('timeupdate', setAudioTime)

    return () => {
      audio.removeEventListener('loadeddata', setAudioData)
      audio.removeEventListener('timeupdate', setAudioTime)
    }
  }, [currentTrack])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const playPreviousTrack = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1)
    } else {
      setCurrentTrackIndex(tracks.length - 1)
    }
  }

  const playNextTrack = () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1)
    } else {
      setCurrentTrackIndex(0)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  if (!tracks.length) {
    return (
      <div className={`rounded-lg bg-[var(--surface-subtle)] p-4 ${className}`}>
        <p className="text-center text-[var(--text-tertiary)]">没有可播放的音频</p>
      </div>
    )
  }

  return (
    <div className={`rounded-lg bg-[var(--card-bg)] p-6 shadow-lg ${className}`}>
      <audio ref={audioRef} src={currentTrack.url} onEnded={playNextTrack} autoPlay={autoPlay} />

      {/* Track Info */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {currentTrack.title}
        </h3>
        <p className="text-sm text-[var(--text-secondary)]">{currentTrack.artist}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="mb-1 flex items-center justify-between text-xs text-[var(--text-tertiary)]">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[var(--surface-subtle)]"
        />
      </div>

      {/* Controls */}
      <div className="mb-4 flex items-center justify-center gap-4">
        <button
          onClick={playPreviousTrack}
          className="rounded-full p-2 transition-colors hover:bg-[var(--surface-subtle)]"
          aria-label="上一曲"
        >
          <SkipBack className="h-5 w-5" />
        </button>

        <button
          onClick={togglePlayPause}
          className="rounded-full bg-blue-600 p-3 text-white transition-colors hover:bg-blue-700"
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="ml-1 h-6 w-6" />}
        </button>

        <button
          onClick={playNextTrack}
          className="rounded-full p-2 transition-colors hover:bg-[var(--surface-subtle)]"
          aria-label="下一曲"
        >
          <SkipForward className="h-5 w-5" />
        </button>
      </div>

      {/* Volume Control */}
      <div className="flex items-center gap-2">
        <Volume2 className="h-4 w-4 text-[var(--text-secondary)]" />
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-[var(--surface-subtle)]"
        />
      </div>

      {/* Playlist */}
      {tracks.length > 1 && (
        <div className="mt-6 border-t border-[var(--border-subtle)] pt-6">
          <h4 className="mb-2 text-sm font-medium text-[var(--text-primary)]">播放列表</h4>
          <div className="space-y-1">
            {tracks.map((track, index) => (
              <button
                key={track.id}
                onClick={() => setCurrentTrackIndex(index)}
                className={`w-full rounded-md px-3 py-2 text-left transition-colors ${
                  index === currentTrackIndex
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--surface-subtle)]'
                }`}
              >
                <div className="text-sm font-medium">{track.title}</div>
                <div className="text-xs text-[var(--text-tertiary)]">{track.artist}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
