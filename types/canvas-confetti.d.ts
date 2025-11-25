declare module 'canvas-confetti' {
  export interface Options {
    useWorker?: boolean
    [key: string]: unknown
  }

  export default function confetti(options?: Options): void
}

