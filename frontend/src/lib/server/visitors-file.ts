import { promises as fs } from 'fs'
import path from 'path'
import type { VisitorData } from '@/lib/types/visitor'

const DEFAULT_VISITORS_DIR = path.join(process.cwd(), '.data')
const configuredVisitorsDir = process.env.VISITOR_DATA_DIR?.trim()
const configuredVisitorsFile = process.env.VISITORS_FILE?.trim()

const visitorsDirectory = configuredVisitorsDir || DEFAULT_VISITORS_DIR
const visitorsFilePath = configuredVisitorsFile || path.join(visitorsDirectory, 'visitors.json')

async function ensureVisitorsFile(): Promise<void> {
  await fs.mkdir(path.dirname(visitorsFilePath), { recursive: true })

  try {
    await fs.access(visitorsFilePath)
  } catch {
    await fs.writeFile(visitorsFilePath, '[]\n', 'utf-8')
  }
}

export function getVisitorsFilePath(): string {
  return visitorsFilePath
}

export async function readVisitorsFile(): Promise<VisitorData[]> {
  await ensureVisitorsFile()

  try {
    const data = await fs.readFile(visitorsFilePath, 'utf-8')
    const parsed = JSON.parse(data)

    if (!Array.isArray(parsed)) {
      console.error(`[Visitors] Expected an array in ${visitorsFilePath}, received:`, parsed)
      return []
    }

    return parsed as VisitorData[]
  } catch (error) {
    console.error(`[Visitors] Failed to read ${visitorsFilePath}:`, error)
    return []
  }
}

export async function writeVisitorsFile(visitors: VisitorData[]): Promise<void> {
  await ensureVisitorsFile()
  await fs.writeFile(visitorsFilePath, JSON.stringify(visitors, null, 2), 'utf-8')
}
