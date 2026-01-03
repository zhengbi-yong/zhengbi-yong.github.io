# 3Dmol.js Test Page

## Module Overview

Test page for 3Dmol.js molecular visualization component integration.

## Architecture Layer

### Layer 3: Route Testing

```
tests/routes/test-3dmol/
└── page.tsx    # 3Dmol test interface
```

**Purpose**: Validate 3D molecular viewer rendering
**Access**: `/test-3dmol`

## Page Features

### Test Scenarios

1. **Water Molecule** (PDB file)
   - File: `/structures/water.pdb`
   - Style: Stick
   - Height: 400px

2. **Methane** (Inline XYZ)
   - Format: XYZ
   - Style: Sphere
   - Data: 5 atoms (C + 4H)

3. **Ethanol** (Inline XYZ)
   - Format: XYZ
   - Style: Stick
   - Data: 9 atoms (C2H6O)

## Implementation

### Component Loading

```typescript
const ChemicalStructure = dynamic(
  () => import('@/components/chemistry/ChemicalStructure'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false,  // Client-side only
  }
)
```

### Script Dependencies

```typescript
<Script
  src="/chemistry/rdkit/RDKit_minimal.js"
  strategy="beforeInteractive"
/>
```

### Test Structure

```typescript
<ChemicalStructure
  file="/structures/water.pdb"
  style="stick"
  height={400}
/>

<ChemicalStructure
  data={`5\nMethane\n...`}
  format="xyz"
  style="sphere"
  height={400}
/>
```

## Dependencies

- `3dmol.js` - Molecular visualization library
- `@/components/chemistry/ChemicalStructure` - Structure viewer component
- `/chemistry/rdkit/RDKit_minimal.js` - RDKit chemistry library

## Related Modules

- `/src/components/chemistry/ChemicalStructure.tsx` - Main component
- `/tests/routes/test-chemistry` - RDKit tests
- `/public/structures/**` - Structure files
