'use client'

const RDKIT_LOADER_SRC = '/rdkit-init.js'
const RDKIT_SCRIPT_SELECTOR = 'script[data-rdkit-loader="true"]'

declare global {
  interface Window {
    RDKit?: any
    __rdkitLoadPromise?: Promise<any>
  }
}

function getExistingRDKit() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.RDKit || null
}

function toError(detail: unknown) {
  if (detail instanceof Error) {
    return detail
  }

  if (typeof detail === 'string' && detail.trim()) {
    return new Error(detail)
  }

  return new Error('RDKit failed to load')
}

export function loadRDKit(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('RDKit can only be loaded in the browser'))
  }

  const existingRDKit = getExistingRDKit()
  if (existingRDKit) {
    return Promise.resolve(existingRDKit)
  }

  if (window.__rdkitLoadPromise) {
    return window.__rdkitLoadPromise
  }

  window.__rdkitLoadPromise = new Promise((resolve, reject) => {
    let settled = false

    const cleanup = () => {
      window.removeEventListener('rdkit-loaded', handleLoaded as EventListener)
      window.removeEventListener('rdkit-error', handleError as EventListener)
    }

    const finalizeResolve = (RDKit: any) => {
      if (settled) {
        return
      }

      settled = true
      window.__rdkitLoadPromise = Promise.resolve(RDKit)
      cleanup()
      resolve(RDKit)
    }

    const finalizeReject = (detail: unknown) => {
      if (settled) {
        return
      }

      settled = true
      delete window.__rdkitLoadPromise
      cleanup()
      reject(toError(detail))
    }

    const handleLoaded = (event: CustomEvent) => {
      finalizeResolve(event.detail || getExistingRDKit())
    }

    const handleError = (event: CustomEvent) => {
      finalizeReject(event.detail)
    }

    window.addEventListener('rdkit-loaded', handleLoaded as EventListener)
    window.addEventListener('rdkit-error', handleError as EventListener)

    const alreadyLoaded = getExistingRDKit()
    if (alreadyLoaded) {
      finalizeResolve(alreadyLoaded)
      return
    }

    let script = document.querySelector(RDKIT_SCRIPT_SELECTOR) as HTMLScriptElement | null

    if (!script) {
      script = document.createElement('script')
      script.src = RDKIT_LOADER_SRC
      script.async = true
      script.defer = true
      script.dataset.rdkitLoader = 'true'
      script.onerror = () => {
        finalizeReject(new Error(`Failed to load ${RDKIT_LOADER_SRC}`))
      }
      document.head.appendChild(script)
      return
    }

    script.addEventListener(
      'error',
      () => {
        finalizeReject(new Error(`Failed to load ${RDKIT_LOADER_SRC}`))
      },
      { once: true }
    )
  })

  return window.__rdkitLoadPromise
}
