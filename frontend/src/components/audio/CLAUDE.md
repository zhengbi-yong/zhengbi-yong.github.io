# Audio Components Module

## Purpose
Audio playback components for music and podcast functionality.

## Files
- `MusicPlayer.tsx` - Full-featured music player component

## Architecture

### MusicPlayer Component
```
MusicPlayer (Client Component)
├── Audio element (ref, hidden)
├── Player controls
│   ├── Play/Pause button
│   ├── Previous track
│   ├── Next track
│   └── Volume control
├── Progress bar
│   ├── Current time
│   ├── Seekable slider
│   └── Duration
└── Track info
    ├── Title
    ├── Artist
    └── Cover art (optional)
```

### State Management
```typescript
interface MusicPlayerState {
  isPlaying: boolean
  currentTrackIndex: number
  volume: number
  currentTime: number
  duration: number
}

const [state, setState] = useState<MusicPlayerState>({
  isPlaying: false,
  currentTrackIndex: 0,
  volume: 1,
  currentTime: 0,
  duration: 0,
})
```

### Track Schema
```typescript
interface Track {
  id: string
  title: string
  artist: string
  url: string
  coverUrl?: string
}
```

### Key Features

#### Audio Control
```typescript
// Play/Pause toggle
const togglePlay = () => {
  if (isPlaying) {
    audioRef.current?.pause()
  } else {
    audioRef.current?.play()
  }
  setIsPlaying(!isPlaying)
}

// Track navigation
const playNext = () => {
  setCurrentTrackIndex((prev) => (prev + 1) % tracks.length)
}

const playPrevious = () => {
  setCurrentTrackIndex((prev) => (prev - 1 + tracks.length) % tracks.length)
}
```

#### Progress Tracking
```typescript
// Time update listener
audio.addEventListener('timeupdate', () => {
  setCurrentTime(audio.currentTime)
})

// Seek functionality
const handleSeek = (value: number) => {
  audioRef.current!.currentTime = value
  setCurrentTime(value)
}
```

#### Volume Control
```typescript
const handleVolumeChange = (value: number) => {
  audioRef.current!.volume = value
  setVolume(value)
}
```

### Technologies
- HTML5 Audio API
- React hooks (useState, useRef, useEffect)
- lucide-react (icons)
- Tailwind CSS

## Integration Points

### Audio Source
```typescript
// Tracks passed as props
interface MusicPlayerProps {
  tracks: Track[]
  autoPlay?: boolean
  className?: string
}
```

### Event Listeners
```typescript
useEffect(() => {
  const audio = audioRef.current
  audio.addEventListener('loadeddata', setAudioData)
  audio.addEventListener('timeupdate', setAudioTime)
  audio.addEventListener('ended', playNext)

  return () => {
    audio.removeEventListener('loadeddata', setAudioData)
    audio.removeEventListener('timeupdate', setAudioTime)
    audio.removeEventListener('ended', playNext)
  }
}, [currentTrack])
```

## Data Flow
```
Props (tracks) → Audio element load → User control → Audio play/pause/seek → Update state → Re-render UI
```

## Dependencies
- **External**: `lucide-react`

## Styling
- **Responsive**: Full width on mobile, compact on desktop
- **Dark mode**: Supported
- **Custom controls**: Styled play/pause, volume slider, progress bar

## Future Enhancements
- [ ] Playlist queue management
- [ ] Shuffle/repeat modes
- [ ] Playback speed control
- [ ] Lyrics display
- [ ] Mini player mode
- [ ] Background playback (PWA)
- [ ] Audio visualization
- [ ] Equalizer
- [ ] Save playback position
- [ ] Continue from where left off
