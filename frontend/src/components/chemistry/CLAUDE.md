# Chemistry Components Module

## Purpose
Chemical structure visualization and molecule rendering components using 3Dmol.js and RDKit.

## Files
- `ChemicalStructure.tsx` - 3D molecular structure viewer
- `MhchemInit.tsx` - LaTeX mhchem initialization
- `MoleculeFingerprint.tsx` - Molecular fingerprint visualization
- `RDKitStructure.tsx` - RDKit-based structure rendering
- `SimpleChemicalStructure.tsx` - Simplified structure viewer
- `SMILESConverter.tsx` - SMILES notation converter
- `index.ts` - Component exports

## Architecture

### ChemicalStructure Component
```
ChemicalStructure (Client Component)
├── 3Dmol.js viewer
│   ├── Structure loading
│   │   ├── File path (public/)
│   │   └── Inline data string
│   ├── Rendering styles
│   │   ├── stick
│   │   ├── cartoon
│   │   ├── sphere
│   │   ├── surface
│   │   └── line
│   └── Interactions
│       ├── Auto-rotate
│       └── User controls
└── Error handling
    ├── Loading state
    └── Error display
```

### Supported Formats
```typescript
type StructureFormat = 'pdb' | 'sdf' | 'xyz' | 'mol' | 'cif'
```

### Component Props
```typescript
interface ChemicalStructureProps {
  file?: string              // File path (relative to public/)
  data?: string              // Inline structure data
  format?: StructureFormat   // File format (default 'pdb')
  width?: number | string    // Viewer width (default '100%')
  height?: number | string   // Viewer height (default 400)
  style?: RenderingStyle     // Display style (default 'stick')
  backgroundColor?: string   // Canvas background
  className?: string         // Custom classes
  autoRotate?: boolean       // Enable rotation (default false)
}
```

### Component Features

#### ChemicalStructure.tsx
- **3D visualization**: 3Dmol.js WebGL rendering
- **Multiple formats**: PDB, SDF, XYZ, MOL, CIF
- **Rendering styles**: Stick, cartoon, sphere, surface, line
- **Interactive**: Mouse controls (zoom, rotate, pan)
- **Auto-rotate**: Optional continuous rotation
- **Error handling**: Graceful fallback on load failure

#### MoleculeFingerprint.tsx
- Bit vector visualization
- RDKit fingerprint display
- Interactive highlighting
- Feature mapping

#### RDKitStructure.tsx
- RDKit.js integration
- 2D structure rendering
- SMILES input
- Substructure search

#### SimpleChemicalStructure.tsx
- Lightweight viewer
- Simplified API
- Fast loading
- Mobile-optimized

#### SMILESConverter.tsx
- SMILES ↔ Structure conversion
- Validation
- Error messages
- Copy to clipboard

### Technologies
- 3Dmol.js (WebGL molecular viewer)
- RDKit.js (chemistry toolkit)
- React hooks (useState, useEffect, useRef)
- Next.js dynamic imports

## Integration Points

### 3Dmol.js
```typescript
// Library loaded via CDN/script
const viewer = $3Dmol.createViewer(containerRef.current)
viewer.addModel(data, format)
viewer.setStyle({ [style]: {} })
viewer.zoomTo()
viewer.render()
```

### Data Sources
```typescript
// File-based
<ChemicalStructure file="/structures/molecule.pdb" />

// Inline data
<ChemicalStructure
  data="ATOM      1  N   MET A   1      10.000   0.000   0.000"
  format="pdb"
/>
```

### Styling
```typescript
// Rendering style selection
style="stick"        // Ball-and-stick model
style="cartoon"      // Protein cartoon (secondary structure)
style="sphere"       // Space-filling model
style="surface"      // Molecular surface
style="line"         // Wireframe
```

## Data Flow
```
Props (file/data) → 3Dmol viewer load → Parse structure → Apply style → Render → User interaction
```

## Dependencies
- **External**:
  - `3Dmol.js` (via CDN or npm)
  - `@rdkit/rdkitjs` (optional)

## Performance Considerations

#### Optimization
- **Lazy loading**: Load 3Dmol.js only when needed
- **Debounce**: Resize events
- **Memoization**: Cache viewer instances
- **Cleanup**: Destroy viewer on unmount

#### Large Structures
```typescript
// Limit detail for large molecules
const maxAtoms = 1000
if (atomCount > maxAtoms) {
  style = 'line'  // Use simpler style
}
```

## Usage Examples

#### Basic Usage
```typescript
<ChemicalStructure
  file="/structures/caffeine.pdb"
  height={500}
  style="stick"
  autoRotate={true}
/>
```

#### Inline Data
```typescript
<ChemicalStructure
  data={pdbString}
  format="pdb"
  backgroundColor="#1a1a1a"
  style="sphere"
/>
```

#### Error Handling
```typescript
<ChemicalStructure
  file="/structures/unknown.mol"
  onError={(error) => console.error('Failed to load:', error)}
/>
```

## Future Enhancements
- [ ] Multi-model comparison
- [ ] Animation playback (trajectory)
- [ ] Measurement tools
- [ ] Annotation support
- [ ] Export to image (PNG/SVG)
- [ ] Custom color schemes
- [ ] Surface transparency control
- [ ] Quantum chemistry visualization
