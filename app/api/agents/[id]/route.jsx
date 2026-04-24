import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

const DB_PATH = join(process.cwd(), 'agents_data.json')

function readAgents() {
  if (!existsSync(DB_PATH)) return []
  try {
    return JSON.parse(readFileSync(DB_PATH, 'utf-8'))
  } catch {
    return []
  }
}

function writeAgents(agents) {
  writeFileSync(DB_PATH, JSON.stringify(agents, null, 2), 'utf-8')
}

export async function DELETE(request, { params }) {
  try {
    const agents = readAgents()
    const filtered = agents.filter(a => a.id !== params.id)
    writeAgents(filtered)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}