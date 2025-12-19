declare global {
  interface Window {
    initRDKitModule?: () => Promise<{
      get_mol: (input: string) => {
        get_svg: () => string
        get_morgan_fingerprint: (
          radius: number,
          bits: number
        ) => {
          to_bitstring: () => string
          delete: () => void
        }
        delete: () => void
      }
    }>
  }
}

export {}
