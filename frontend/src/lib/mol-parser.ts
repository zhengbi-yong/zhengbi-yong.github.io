/**
 * MOL File Parser for RDKit Minimal Build
 * Since RDKit minimal doesn't support MOL format directly,
 * we'll create a simple parser that converts MOL to SMILES
 */

interface MOLAtom {
  index: number
  x: number
  y: number
  z: number
  symbol: string
  charge: number
  isotope: number
}

interface MOLBond {
  from: number
  to: number
  order: number
  type: number
}

interface ParseResult {
  atoms: MOLAtom[]
  bonds: MOLBond[]
  isAromatic: boolean[]
  error?: string
}

/**
 * Parse MOL format data
 */
export function parseMOLFormat(molData: string): ParseResult {
  try {
    const lines = molData.split('\n').map((line) => line.trim())

    // Find the counts line (contains number of atoms and bonds)
    let countsLineIndex = -1
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('V2000') || lines[i].includes('V3000')) {
        countsLineIndex = i
        break
      }
    }

    if (countsLineIndex === -1) {
      return { atoms: [], bonds: [], isAromatic: [], error: 'MOL format not recognized' }
    }

    // Extract atom and bond counts
    const countsLine = lines[countsLineIndex]
    const numAtoms = parseInt(countsLine.substring(0, 3).trim())
    const numBonds = parseInt(countsLine.substring(3, 6).trim())

    if (isNaN(numAtoms) || isNaN(numBonds)) {
      return { atoms: [], bonds: [], isAromatic: [], error: 'Invalid atom/bond counts' }
    }

    // Parse atoms
    const atoms: MOLAtom[] = []
    const isAromatic: boolean[] = []

    for (let i = 0; i < numAtoms; i++) {
      const atomLine = lines[countsLineIndex + 1 + i]
      if (!atomLine || atomLine.length < 34) {
        return { atoms: [], bonds: [], isAromatic: [], error: `Invalid atom line ${i + 1}` }
      }

      const x = parseFloat(atomLine.substring(0, 10).trim())
      const y = parseFloat(atomLine.substring(10, 20).trim())
      const z = parseFloat(atomLine.substring(20, 30).trim())
      let symbol = atomLine.substring(31, 34).trim()

      // Convert aromatic atoms to lowercase for SMILES
      const aromaticAtoms = ['C', 'N', 'O', 'S', 'P']
      if (aromaticAtoms.includes(symbol)) {
        // Check if atom might be aromatic (simplified heuristic)
        if (atomLine.length > 36) {
          const bondType = atomLine.substring(36, 39).trim()
          if (bondType === '4' || bondType === '5') {
            // Aromatic or aromatic valence
            symbol = symbol.toLowerCase()
            isAromatic.push(true)
          } else {
            isAromatic.push(false)
          }
        } else {
          isAromatic.push(false)
        }
      } else {
        isAromatic.push(false)
      }

      atoms.push({
        index: i + 1,
        x,
        y,
        z,
        symbol,
        charge: 0,
        isotope: 0,
      })
    }

    // Parse bonds
    const bonds: MOLBond[] = []
    for (let i = 0; i < numBonds; i++) {
      const bondLine = lines[countsLineIndex + 1 + numAtoms + i]
      if (!bondLine || bondLine.length < 9) {
        return { atoms: [], bonds: [], isAromatic: [], error: `Invalid bond line ${i + 1}` }
      }

      const from = parseInt(bondLine.substring(0, 3).trim())
      const to = parseInt(bondLine.substring(3, 6).trim())
      const order = parseInt(bondLine.substring(6, 9).trim())

      if (isNaN(from) || isNaN(to) || isNaN(order)) {
        return {
          atoms: [],
          bonds: [],
          isAromatic: [],
          error: `Invalid bond values in line ${i + 1}`,
        }
      }

      bonds.push({
        from,
        to,
        order,
        type: order,
      })
    }

    return { atoms, bonds, isAromatic }
  } catch (error) {
    return {
      atoms: [],
      bonds: [],
      isAromatic: [],
      error: error instanceof Error ? error.message : 'Parse error',
    }
  }
}

/**
 * Convert MOL data to SMILES using RDKit's molecule builder
 */
export function convertMOLToSMILES(molData: string): string | null {
  const parseResult = parseMOLFormat(molData)

  if (parseResult.error || parseResult.atoms.length === 0) {
    return null
  }

  // For now, try to create a simple SMILES from the structure
  // This is a simplified approach - a full implementation would need
  // to handle ring closures, branches, stereochemistry, etc.

  const { atoms, bonds, isAromatic } = parseResult
  // Mark as used to satisfy TS6133 when not all code paths rely on isAromatic
  void isAromatic

  // For simple molecules without rings, we can try a linear approach
  if (bonds.length === 0 && atoms.length === 1) {
    return atoms[0].symbol
  }

  // Try to find a reasonable starting point (least connected atom)
  const connectivity = atoms.map(() => 0)
  bonds.forEach((bond) => {
    connectivity[bond.from - 1]++
    connectivity[bond.to - 1]++
  })

  const startAtomIndex = connectivity.indexOf(Math.min(...connectivity))
  const visited = new Set<number>()
  let smiles = ''

  // Recursive depth-first traversal
  function buildSMILES(atomIndex: number, parentIndex?: number): string {
    if (visited.has(atomIndex)) {
      // Handle ring closure
      return ''
    }

    visited.add(atomIndex)
    const atom = atoms[atomIndex]
    let atomSmiles = atom.symbol

    // Find connected atoms
    const connected = bonds
      .filter((b) => b.from === atomIndex + 1 || b.to === atomIndex + 1)
      .map((b) => (b.from === atomIndex + 1 ? b.to - 1 : b.from - 1))
      .filter((i) => i !== parentIndex)

    if (connected.length > 2) {
      // Branching
      const branches = connected.map((i) => {
        const bond = bonds.find(
          (b) =>
            (b.from === atomIndex + 1 && b.to === i + 1) ||
            (b.to === atomIndex + 1 && b.from === i + 1)
        )
        const bondSymbol = bond?.order === 2 ? '=' : bond?.order === 3 ? '#' : ''
        return `(${bondSymbol}${buildSMILES(i, atomIndex)})`
      })
      atomSmiles += branches.join('')
    } else if (connected.length === 1) {
      // Linear continuation
      const nextIndex = connected[0]
      const bond = bonds.find(
        (b) =>
          (b.from === atomIndex + 1 && b.to === nextIndex + 1) ||
          (b.to === atomIndex + 1 && b.from === nextIndex + 1)
      )
      const bondSymbol = bond?.order === 2 ? '=' : bond?.order === 3 ? '#' : ''
      atomSmiles += bondSymbol + buildSMILES(nextIndex, atomIndex)
    } else if (connected.length === 2) {
      // In the middle of a chain
      const nextIndices = connected.filter((i) => !visited.has(i))
      if (nextIndices.length === 1) {
        const nextIndex = nextIndices[0]
        const bond = bonds.find(
          (b) =>
            (b.from === atomIndex + 1 && b.to === nextIndex + 1) ||
            (b.to === atomIndex + 1 && b.from === nextIndex + 1)
        )
        const bondSymbol = bond?.order === 2 ? '=' : bond?.order === 3 ? '#' : ''
        atomSmiles += bondSymbol + buildSMILES(nextIndex, atomIndex)
      }
    }

    return atomSmiles
  }

  try {
    smiles = buildSMILES(startAtomIndex)

    // If we didn't visit all atoms, the molecule has rings
    if (visited.size !== atoms.length) {
      // For ring systems, we need a more sophisticated approach
      // For now, return null to indicate conversion failed
      return null
    }

    return smiles || null
  } catch (error) {
    return null
  }
}
