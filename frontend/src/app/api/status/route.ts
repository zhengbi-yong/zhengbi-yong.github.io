import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const STATUS_FILE = path.join(process.cwd(), 'data', 'status.json')

async function readStatus() {
  const raw = fs.readFileSync(STATUS_FILE, 'utf-8')
  return JSON.parse(raw)
}

async function writeStatus(data: unknown) {
  const dir = path.dirname(STATUS_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// GET /api/status
export async function GET() {
  try {
    const data = await readStatus()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to read status' }, { status: 500 })
  }
}

// PUT /api/status — update overall status, services, or features
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const current = await readStatus()

    // Update overall status
    if (body.overall && ['operational', 'degraded', 'outage'].includes(body.overall)) {
      current.overall = body.overall
    }

    // Update service status
    if (body.service) {
      const { name, status: svcStatus } = body.service
      if (current.services[name] && ['operational', 'degraded', 'outage'].includes(svcStatus)) {
        current.services[name].status = svcStatus
      }
    }

    // Update feature status (batch toggle)
    if (body.features && Array.isArray(body.features)) {
      for (const update of body.features) {
        const feature = current.features.find((f: { id: string }) => f.id === update.id)
        if (feature && typeof update.status === 'boolean') {
          feature.status = update.status
        }
      }
    }

    current.lastUpdated = new Date().toISOString()
    await writeStatus(current)

    return NextResponse.json({ success: true, data: current })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update status', detail: String(e) }, { status: 500 })
  }
}
