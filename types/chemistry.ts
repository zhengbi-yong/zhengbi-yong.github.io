/**
 * 化学组件相关的TypeScript类型定义
 */

export type ChemicalFileFormat = 'pdb' | 'sdf' | 'xyz' | 'mol' | 'cif'

export type ChemicalStyle = 'stick' | 'cartoon' | 'sphere' | 'surface' | 'line'

export interface ChemicalStructureProps {
  /** 结构文件路径（相对于public目录） */
  file?: string
  /** 内联结构数据（字符串格式） */
  data?: string
  /** 文件格式 */
  format?: ChemicalFileFormat
  /** 宽度 */
  width?: number | string
  /** 高度 */
  height?: number | string
  /** 显示样式 */
  style?: ChemicalStyle
  /** 背景色 */
  backgroundColor?: string
  /** 自定义类名 */
  className?: string
  /** 是否自动旋转 */
  autoRotate?: boolean
}
