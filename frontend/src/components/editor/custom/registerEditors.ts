'use client'

/**
 * Registry: registers all custom component editors.
 * Import this in BlockNoteEditor to activate custom block support.
 */

import { registerCustomEditor } from '../CustomComponentBlock'
import { HtmlBlockEditor } from './HtmlBlockEditor'
import { AnimationWrapperEditor } from './AnimationWrapperEditor'
import { JsonDataEditor } from './JsonDataEditor'
import { SmilesEditor } from './SmilesEditor'
import { ChemicalStructureEditor } from './ChemicalStructureEditor'
import { BilibiliVideoEditor } from './BilibiliVideoEditor'

export function registerAllCustomEditors() {
  // HTML blocks
  registerCustomEditor('HtmlBlock', HtmlBlockEditor)

  // Animation wrappers
  registerCustomEditor('FadeIn', AnimationWrapperEditor)
  registerCustomEditor('SlideIn', AnimationWrapperEditor)
  registerCustomEditor('ScaleIn', AnimationWrapperEditor)
  registerCustomEditor('BounceIn', AnimationWrapperEditor)

  // Chart components (JSON data editors)
  registerCustomEditor('EChartsComponent', JsonDataEditor)
  registerCustomEditor('NivoBarChart', JsonDataEditor)
  registerCustomEditor('NivoPieChart', JsonDataEditor)
  registerCustomEditor('AntVChart', JsonDataEditor)

  // Chemistry components
  registerCustomEditor('RDKitStructure', SmilesEditor)
  registerCustomEditor('MoleculeFingerprint', SmilesEditor)
  registerCustomEditor('SimpleChemicalStructure', ChemicalStructureEditor)

  // Video
  registerCustomEditor('BilibiliVideo', BilibiliVideoEditor)
}
