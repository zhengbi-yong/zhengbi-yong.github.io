# RDKit Chemistry Test Suite

## Module Overview

Comprehensive testing interface for RDKit chemistry library integration.

## Architecture Layer

### Layer 3: Route Testing

```
tests/routes/test-chemistry/
└── page.tsx    # RDKit test interface
```

**Purpose**: Validate RDKit molecular processing
**Access**: `/test-chemistry`

## Test Cases

### Simple SMILES

1. **Methane**
   - SMILES: `C`
   - Format: SMILES

2. **Ethanol**
   - SMILES: `CCO`
   - Format: SMILES

3. **Benzene**
   - SMILES: `c1ccccc1`
   - Format: SMILES

### MOL V2000 Format

4. **Minimal MOL V2000**
   - Atoms: 3 (C, C, O)
   - Bonds: 2
   - Format: MOL V2000

5. **Caffeine (from blog)**
   - Atoms: 5 (partial structure)
   - Bonds: 4
   - Format: MOL V2000

6. **Aspirin**
   - Atoms: 9
   - Bonds: 8
   - Format: MOL V2000

## Test Operations

### For Each Molecule

1. **molToSVG()** - Enhanced SVG generation
   - Tests our wrapper function
   - Validates SVG output
   - Checks length > 0

2. **RDKit.get_mol()** - Direct parsing
   - Fallback test
   - Returns molecule object or null

3. **get_smiles()** - SMILES extraction
   - Validates molecule object
   - Returns SMILES string

4. **get_svg()** - SVG generation
   - Direct RDKit method
   - Returns SVG string

## Implementation

### Hook Usage

```typescript
const {
  isLoaded,
  error,
  RDKit,
  molToSVG,
  smilesToSVG
} = useChemistryLocal()
```

### Test Execution

```typescript
const runTests = async () => {
  for (const molecule of testMolecules) {
    // Test molToSVG first
    const svg = await molToSVG(molecule.data)

    // Fallback to direct RDKit calls
    const mol = RDKit.get_mol(molecule.data)
    const smiles = mol.get_smiles()
    const svg = mol.get_svg()

    mol.delete()  // Cleanup
  }
}
```

## Results Display

### Status Indicators
- ✓ (green) - Success
- ✗ (red) - Failed

### Test Metrics
- RDKit.get_mol()
- get_smiles()
- get_svg()

### Console Logs
- Timestamped entries
- Step-by-step progress
- Error messages

## Script Loading

```typescript
<Script
  src="/chemistry/rdkit/RDKit_minimal.js"
  strategy="beforeInteractive"
/>
```

## Debug Information

### RDKit Status
- Loaded: Yes/No
- Error: Message or None
- RDKit Object: Available/Null

### RDKit Debug
- Version
- Available methods (first 10)

## Dependencies

- `RDKit_minimal.js` - Chemistry library
- `@/components/hooks/useChemistryLocal` - RDKit hook
- `@/lib/chemistry/**` - Chemistry utilities

## Related Modules

- `/src/components/hooks/useChemistryLocal.ts` - Hook implementation
- `/src/lib/chemistry/rdkit.ts` - RDKit utilities
- `/tests/routes/test-3dmol` - 3D viewer tests
