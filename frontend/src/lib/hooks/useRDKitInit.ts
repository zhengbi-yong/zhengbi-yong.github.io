// RDKit Initialization Hook
// Listens for rdkit-loaded and rdkit-error events

import { useEffect, useState } from 'react';
import { logger } from '@/lib/utils/logger';

interface UseRDKitInitReturn {
  isLoaded: boolean
  error: string | null
  RDKit: any
}

export function useRDKitInit(): UseRDKitInitReturn {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [RDKit, setRDKit] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    // Check if already loaded (only on client)
    if (typeof window !== 'undefined' && typeof (window as any).RDKit !== 'undefined' && (window as any).RDKit) {
      logger.log('[RDKit] Already loaded');
      setRDKit((window as any).RDKit);
      setIsLoaded(true);
      setError(null);
      return undefined;
    }

    const handleRDKitLoaded = (event: CustomEvent) => {
      if (!mounted) return;

      logger.log('[RDKit] Load event received:', event.detail);
      setRDKit(event.detail);
      setIsLoaded(true);
      setError(null);
    };

    const handleRDKitError = (event: CustomEvent) => {
      if (!mounted) return;

      logger.error('[RDKit] Error event received:', event.detail);
      setError(event.detail instanceof Error ? event.detail.message : String(event.detail));
      setIsLoaded(false);
    };

    window.addEventListener('rdkit-loaded', handleRDKitLoaded as EventListener);
    window.addEventListener('rdkit-error', handleRDKitError as EventListener);

    return () => {
      mounted = false;
      window.removeEventListener('rdkit-loaded', handleRDKitLoaded as EventListener);
      window.removeEventListener('rdkit-error', handleRDKitError as EventListener);
    };
  }, []);

  return {
    isLoaded,
    error,
    RDKit,
  };
}
