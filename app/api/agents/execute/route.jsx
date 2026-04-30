import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 60

// ─── Tool mock registry ──────────────────────────────────────────────────────

const TOOL_MOCKS = {
  gmail_reader:   { label: 'Gmail',           emoji: '📧', execute: (inp) => ({ emails: [{ from: 'client@exemple.fr', subject: 'Demande urgente', body: inp, date: new Date().toISOString(), unread: true }] }) },
  gmail_sender:   { label: 'Gmail',           emoji: '📤', execute: ()    => ({ sent: true, messageId: `MSG_${Date.now()}`, timestamp: new Date().toISOString() }) },
  email_reader:   { label: 'Email',           emoji: '📧', execute: (inp) => ({ emails: [{ from: 'client@exemple.fr', subject: 'Nouveau message', body: inp }] }) },
  email_sender:   { label: 'Email',           emoji: '📤', execute: ()    => ({ sent: true, messageId: `MSG_${Date.now()}` }) },
  calendar:       { label: 'Google Calendar', emoji: '📅', execute: ()    => ({ eventId: `EVT_${Date.now()}`, confirmed: true, slot: '2025-06-20T14:00:00', attendees: 1 }) },
  google_calendar:{ label: 'Google Calendar', emoji: '📅', execute: ()    => ({ eventId: `EVT_${Date.now()}`, confirmed: true, slot: '2025-06-20T14:00:00' }) },
  webhook:        { label: 'Webhook',         emoji: '🔗', execute: ()    => ({ status: 200, body: 'OK', latency_ms: Math.floor(Math.random() * 200 + 50) }) },
  http_request:   { label: 'HTTP',            emoji: '🌐', execute: ()    => ({ status: 200, data: { success: true } }) },
  slack:          { label: 'Slack',           emoji: '💬', execute: ()    => ({ ok: true, channel: '#général', ts: `${Date.now()}` }) },
  crm:            { label: 'CRM',             emoji: '🗃️', execute: ()    => ({ recordId: `CRM_${Date.now()}`, updated: true, stage: 'Qualifié' }) },
  database:       { label: 'Base de données', emoji: '🗄️', execute: ()    => ({ rows: 3, executionMs: 12 }) },
  search:         { label: 'Recherche web',   emoji: '🔍', execute: (q)   => ({ results: [{ title: `Résultat pour "${String(q).slice(0,40)}"`, url: 'https://example.com' }], total: 1 }) },
  sms:            { label: 'SMS',             emoji: '📱', execute: ()    => ({ sent: true, sid: `SM_${Date.now()}`, status: 'delivered' }) },
  pdf_reader:     { label: 'PDF',             emoji: '📄', execute: ()    => ({ pages: 3, text: 'Contenu extrait du document PDF…', metadata: {} }) },
  notion:         { label: 'Notion',          emoji: '📝', execute: ()    => ({ pageId: `notion_${Date.now()}`, created: true }) },
  airtable:       { label: 'Airtable',        emoji: '📊', execute: ()    => ({ recordId: `rec${Date.now()}`, fields: { status: 'Done' } }) },
}

function getToolMock(toolName) {
  if (!toolName) return null
  const name = toolName.toLowerCase().replace(/[_\s-]/g, '')
  for (const [key, mock] of Object.entries(TOOL_MOCKS)) {
    const k = key.replace(/_/g, '')
    if (name.includes(k) || k.includes(name)) return { key, ...mock }
  }
  return { key: 'generic', label: toolName, emoji: '🔧', execute: () => ({ success: true, result: `${toolName} exécuté`, timestamp: new Date().toISOString() }) }
}

// ─── LLM call (real Anthropic API) ──────────────────────────────────────────

async function callClaude(systemPrompt, userInput) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 600,
        system: systemPrompt || 'Tu es un assistant IA utile.',
        messages: [{ role: 'user', content: userInput }],
      }),
      signal: AbortSignal.timeout(20000),
    })
    const data = await res.json()
    return data?.content?.[0]?.text || null
  } catch {
    return null
  }
}

// ─── Fallback simulation when Claude is unavailable ──────────────────────────

function simulateLLMResponse(node, input) {
  const id = (node.id || '').toLowerCase()
  const tmpl = (node.prompt_template || '').toLowerCase()
  const excerpt = String(input).slice(0, 120)

  if (id.includes('analys') || tmpl.includes('analys')) {
    return `Analyse effectuée sur : "${excerpt}"\n\nRésultat : Demande identifiée comme priorité NORMALE. Entité concernée : client. Action requise : traitement automatique + confirmation.\n\nCatégories détectées : [service_client, demande_standard]`
  }
  if (id.includes('répon') || id.includes('repons') || tmpl.includes('répon')) {
    return `Bonjour,\n\nMerci pour votre message. Nous avons bien reçu votre demande et la traitons dans les plus brefs délais.\n\nEn résumé : ${excerpt}\n\nNous revenons vers vous sous 24h.\n\nCordialement,\nL'équipe`
  }
  if (id.includes('class') || tmpl.includes('class')) {
    return `Classification :\n- Type : Demande standard\n- Priorité : Normale\n- Canal : Email\n- Action : Réponse automatique activée\n- Escalade : Non`
  }
  if (id.includes('résumé') || id.includes('resum') || tmpl.includes('résumé')) {
    return `Résumé exécutif :\n• Demande reçue de : client@exemple.fr\n• Objet : ${excerpt.slice(0, 60)}\n• Statut : Traité\n• Prochaine action : Confirmation envoyée`
  }
  return `Traitement complété pour : "${excerpt}"\n\nToutes les étapes ont été exécutées avec succès. Les systèmes connectés ont été mis à jour et les notifications ont été envoyées.`
}

// ─── Utilities ───────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ─── Main handler ────────────────────────────────────────────────────────────

export async function POST(req) {
  let agent, userPrompt
  try {
    const body = await req.json()
    agent = body.agent
    userPrompt = (body.prompt || '').trim()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  if (!agent?.nodes?.length) return NextResponse.json({ error: 'Agent invalide ou sans nœuds' }, { status: 400 })
  if (!userPrompt)           return NextResponse.json({ error: 'Prompt de test requis' }, { status: 400 })

  const encoder   = new TextEncoder()
  const startTime = Date.now()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)) } catch {}
      }

      try {
        // Build edge adjacency map  { fromId: [toId, ...] }
        const edgeMap = {}
        for (const edge of agent.edges || []) {
          const [from, to] = Array.isArray(edge) ? edge : [edge.from, edge.to]
          if (from) { edgeMap[from] = edgeMap[from] || []; edgeMap[from].push(to) }
        }

        const totalNodes = agent.nodes.length
        send({ type: 'start', agentName: agent.name, nodeCount: totalNodes })
        await sleep(200)

        let current  = agent.entry_point || agent.nodes[0]?.id
        const visited = new Set()
        let stepIndex = 0
        let lastOutput = userPrompt

        while (current && !visited.has(current)) {
          visited.add(current)
          const node = agent.nodes.find((n) => n.id === current)
          if (!node) break

          stepIndex++
          send({ type: 'step', step: stepIndex, total: totalNodes, nodeId: node.id, nodeType: node.type })
          await sleep(120)

          // ── LLM node ──
          if (node.type === 'llm') {
            send({ type: 'log', level: 'llm', message: `🧠 ${node.id} : Envoi de la requête au modèle…` })
            await sleep(400)

            const response = await callClaude(node.prompt_template, lastOutput)
            if (response) {
              send({ type: 'log', level: 'llm', message: `🧠 ${node.id} : Réponse reçue (IA réelle)` })
              send({ type: 'llm_response', nodeId: node.id, response })
              lastOutput = response
            } else {
              await sleep(600)
              const sim = simulateLLMResponse(node, lastOutput)
              send({ type: 'log', level: 'llm', message: `🧠 ${node.id} : Traitement simulé (démo)` })
              send({ type: 'llm_response', nodeId: node.id, response: sim })
              lastOutput = sim
            }
            await sleep(150)

          // ── Tool node ──
          } else if (node.type === 'tool') {
            const toolList = node.tools?.length ? node.tools : [{ name: 'generic_tool' }]
            for (const tool of toolList) {
              const mock = getToolMock(tool.name)
              send({ type: 'log', level: 'tool', message: `${mock.emoji} Connexion à ${mock.label}…` })
              await sleep(350)
              send({ type: 'log', level: 'tool', message: `${mock.emoji} Appel ${mock.label} en cours…` })
              await sleep(480)
              const result = mock.execute(lastOutput)
              send({ type: 'tool_result', tool: mock.label, emoji: mock.emoji, result })
              send({ type: 'log', level: 'success', message: `✓ ${mock.label} a répondu avec succès` })
              lastOutput = JSON.stringify(result)
              await sleep(150)
            }

          // ── Router node ──
          } else if (node.type === 'router') {
            send({ type: 'log', level: 'info', message: '🔀 Évaluation des conditions de routage…' })
            await sleep(300)
            send({ type: 'log', level: 'info', message: '🔀 Chemin sélectionné : flux principal' })
            await sleep(150)

          // ── Human-in-the-loop ──
          } else if (node.type === 'human_in_loop') {
            send({ type: 'log', level: 'warning', message: '👤 [Simulation] En attente d\'approbation humaine…' })
            await sleep(700)
            send({ type: 'log', level: 'success', message: '👤 [Simulation] Approbation accordée automatiquement' })
            await sleep(150)
          }

          // Follow first outgoing edge
          current = (edgeMap[current] || [])[0] || null
        }

        const duration = ((Date.now() - startTime) / 1000).toFixed(1)
        send({ type: 'done', finalAnswer: lastOutput, duration })

      } catch (e) {
        send({ type: 'error', message: e.message || 'Erreur inconnue' })
      } finally {
        try { controller.close() } catch {}
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
