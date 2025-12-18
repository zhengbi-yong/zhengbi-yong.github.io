// RDKit MOL Format Debug Script
// Copy and paste this into the browser console on the RDKit test page

async function debugRDKITMOL() {
  console.log('=== RDKit MOL Format Debug ===\n')

  // Wait for RDKit to load
  let RDKit = window.RDKit
  if (!RDKit) {
    console.log('Waiting for RDKit to load...')
    while (!RDKit) {
      await new Promise((resolve) => setTimeout(resolve, 100))
      RDKit = window.RDKit
    }
  }
  console.log('✅ RDKit loaded\n')

  // Test cases
  const testCases = [
    {
      name: '1. Simple SMILES (Control)',
      data: 'CCO',
      expected: 'Should work',
    },
    {
      name: '2. Minimal valid MOL V2000',
      data: `  3  2  0  0  0  0            999 V2000
    0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    1.5400    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0
    0.7700    1.3330    0.0000 O   0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
M  END`,
      expected: 'Should work - minimal valid MOL',
    },
    {
      name: '3. Blog Caffeine MOL (Original)',
      data: `ChemDraw07252312422D

  5  4  0  0  0  0            999 V2000
    1.1472   -0.1171    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.1472    0.8829    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    2.3144    1.7081    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.4616    0.9961    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    4.6088    1.5881    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
  3  4  1  0  0  0  0
M  END`,
      expected: 'Currently failing - need to identify why',
    },
    {
      name: '4. Blog Caffeine MOL (Cleaned)',
      data: `  5  4  0  0  0  0            999 V2000
    1.1472   -0.1171    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    1.1472    0.8829    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    2.3144    1.7081    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
    3.4616    0.9961    0.0000 N   0  0  0  0  0  0  0  0  0  0  0  0
    4.6088    1.5881    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
  1  2  1  0  0  0  0
  2  3  1  0  0  0  0
  3  4  1  0  0  0  0
M  END`,
      expected: 'Test if removing ChemDraw header fixes it',
    },
  ]

  console.log('Testing', testCases.length, 'molecule formats...\n')

  for (const test of testCases) {
    console.log(`🧪 ${test.name}`)
    console.log(`Expected: ${test.expected}`)
    console.log(`Data length: ${test.data.length} chars`)

    // Show first line for inspection
    const firstLine = test.data.split('\n')[0]
    console.log(`First line: "${firstLine}"`)

    try {
      const mol = RDKit.get_mol(test.data)
      console.log(`RDKit.get_mol(): ${mol ? '✅ SUCCESS' : '❌ NULL'}`)

      if (mol) {
        try {
          const smiles = mol.get_smiles()
          console.log(`  get_smiles(): ${smiles ? '✅ ' + smiles : '❌ NULL'}`)
        } catch (e) {
          console.log(`  get_smiles(): ❌ ERROR - ${e.message}`)
        }

        try {
          const svg = mol.get_svg()
          console.log(`  get_svg(): ${svg ? '✅ (length=' + svg.length + ')' : '❌ NULL'}`)
        } catch (e) {
          console.log(`  get_svg(): ❌ ERROR - ${e.message}`)
        }

        mol.delete()
      }
    } catch (e) {
      console.log(`❌ EXCEPTION: ${e.message}`)
    }

    console.log('') // Empty line for readability
  }

  // Check RDKit version and capabilities
  console.log('=== RDKit Info ===')
  console.log('Version:', RDKit.version || 'Unknown')
  console.log(
    'Available methods:',
    Object.getOwnPropertyNames(RDKit)
      .filter((n) => typeof RDKit[n] === 'function')
      .slice(0, 20)
      .join(', ')
  )

  console.log('\n=== Debug Complete ===')
}

// Auto-run
debugRDKITMOL()
