// Ultra-Simplified RDKit Initialization
// No TypeScript, no complexity - just load and expose

console.log('[RDKit] Starting ultra-simplified initialization...');

// Load RDKit immediately from correct path
var script = document.createElement('script');
script.src = '/chemistry/rdkit/RDKit_minimal.js';

script.onload = function() {
  console.log('[RDKit] Script loaded');

  // Direct initialization - no waiting
  try {
    if (typeof window.initRDKitModule === 'function') {
      console.log('[RDKit] Calling initRDKitModule...');

      window.initRDKitModule().then(function(RDKit) {
        console.log('[RDKit] ✓ Initialized successfully!');
        console.log('[RDKit] Setting window.RDKit...');

        // Set global immediately
        window.RDKit = RDKit;

        console.log('[RDKit] Ready for use');
        console.log('[RDKit] ==================================');

        // Dispatch success event
        var event = new CustomEvent('rdkit-loaded', { detail: RDKit });
        window.dispatchEvent(event);
      }).catch(function(err) {
        console.error('[RDKit] ✗ Initialization failed:', err);
        console.error('[RDKit] ==================================');

        var errorEvent = new CustomEvent('rdkit-error', {
          detail: err.message || 'Unknown error'
        });
        window.dispatchEvent(errorEvent);
      });
    } else {
      console.error('[RDKit] ✗ initRDKitModule not found');

      var errorEvent = new CustomEvent('rdkit-error', {
        detail: 'initRDKitModule function not available'
      });
      window.dispatchEvent(errorEvent);
    }
  } catch (e) {
    console.error('[RDKit] Unexpected error:', e);
    console.error('[RDKit] ==================================');

    var errorEvent = new CustomEvent(new Error(e).message);
    window.dispatchEvent(errorEvent);
  }
};

script.onerror = function() {
  console.error('[RDKit] ✗ Failed to load script');
  console.error('[RDKit] ==================================');

  var errorEvent = new CustomEvent('rdkit-error', {
    detail: 'Failed to load RDKit_minimal.js'
  });
  window.dispatchEvent(errorEvent);
};

// Inject and load
document.head.appendChild(script);
console.log('[RDKit] Script injected, initialization starting...');
