import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { v4 as uuidv4 } from 'uuid'

export const runtime = 'nodejs'
export const maxDuration = 120

function runPython(intent) {
  return new Promise((resolve, reject) => {
    const python = process.env.PYTHON_PATH || 'python'
    const script = process.env.META_AGENT_PATH || './lib/meta_agent.py'
    const child = spawn(python, [script], { env: { ...process.env, PYTHONUNBUFFERED: '1' } })
    let out = '', err = ''
    child.stdout.on('data', d => out += d.toString())
    child.stderr.on('data', d => err += d.toString())
    child.on('error', e => reject(new Error(`Python introuvable : ${e.message}`)))
    child.on('close', code => {
      if (!out && code !== 0) return reject(new Error(`Erreur Python (code ${code}) : ${err.slice(0,300)}`))
      try { resolve(JSON.parse(out)) }
      catch { reject(new Error(`JSON invalide reçu : ${out.slice(0,200)}`)) }
    })
    setTimeout(() => { child.kill('SIGKILL'); reject(new Error('Timeout 90s')) }, 90000)
    child.stdin.write(JSON.stringify({ user_intent: intent, session_id: uuidv4() }))
    child.stdin.end()
  })
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}))
    const intent = (body.user_intent || '').trim()
    if (intent.length < 10) {
      return NextResponse.json({ error: 'TROP_COURT', reason: 'Minimum 10 caractères.' }, { status: 400 })
    }
    const config = await runPython(intent)
    if (config.error) {
      return NextResponse.json(config, { status: config.error === 'SAFETY_VIOLATION' ? 422 : 500 })
    }
    config.id = uuidv4()
    config.created_at = new Date().toISOString()
    config.status = 'draft'
    config.user_intent = intent
    return NextResponse.json(config)
  } catch (e) {
    return NextResponse.json({ error: 'SERVEUR', reason: e.message }, { status: 500 })
  }
}