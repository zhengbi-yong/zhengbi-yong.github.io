(function() {
  'use strict';

  if (typeof window !== 'undefined' && window.initRDKitModule) {
    console.log('[RDKit] Already loaded, skipping re-initialization');
    return;
  }

  const script = document.createElement('script');
  script.src = '/chemistry/rdkit/RDKit_minimal.js';
  script.async = true;
  script.defer = true;

  script.onload = function() {
    console.log('[RDKit] Script loaded, checking for initRDKitModule...');

    const maxAttempts = 100;
    const checkInterval = 100;
    let attempts = 0;

    const checkRDKit = setInterval(() => {
      attempts++;

      if (typeof window.initRDKitModule === 'function') {
        console.log('[RDKit] initRDKitModule found! Attempting to initialize...');
        clearInterval(checkRDKit);

        try {
          window.initRDKitModule().then((RDKit) => {
            console.log('[RDKit] Successfully initialized!');
            console.log('[RDKit] Available functions:', Object.keys(RDKit).slice(0, 20));
            window.RDKit = RDKit;

            const event = new CustomEvent('rdkit-loaded', { detail: RDKit });
            window.dispatchEvent(event);
          }).catch((err) => {
            console.error('[RDKit] Initialization failed:', err);
            const errorEvent = new CustomEvent('rdkit-error', { detail: err });
            window.dispatchEvent(errorEvent);
          });
        } catch (err) {
          console.error('[RDKit] Failed to call initRDKitModule:', err);
          const errorEvent = new CustomEvent('rdkit-error', { detail: err });
          window.dispatchEvent(errorEvent);
        }
      } else if (attempts >= maxAttempts) {
        clearInterval(checkRDKit);
        console.error('[RDKit] Timeout: initRDKitModule not found after 10 seconds');

        const errorEvent = new CustomEvent('rdkit-error', {
          detail: new Error('RDKit script did not load within 10 seconds')
        });
        window.dispatchEvent(errorEvent);
      }
    }, checkInterval);
  };

  script.onerror = function() {
    console.error('[RDKit] Failed to load script:', script.src);

    const errorEvent = new CustomEvent('rdkit-error', {
      detail: new Error('Failed to load RDKit script')
    });
    window.dispatchEvent(errorEvent);
  };

  document.head.appendChild(script);

  console.log('[RDKit] Wrapper script injected, waiting for load...');
})();
