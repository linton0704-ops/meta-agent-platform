import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

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

export async function GET() {
  try {
    const agents = readAgents()
    return NextResponse.json(agents)
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    if (!body.name || !body.nodes) {
      return NextResponse.json({ error: 'Données incomplètes.' }, { status: 400 })
    }
    const agents = readAgents()
    const agent = {
      ...body,
      id: body.id || uuidv4(),
      created_at: body.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    const index = agents.findIndex(a => a.id === agent.id)
    if (index >= 0) {
      agents[index] = agent
    } else {
      agents.unshift(agent)
    }
    writeAgents(agents)
    return NextResponse.json(agent, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}