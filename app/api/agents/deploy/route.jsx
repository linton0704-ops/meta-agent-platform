import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { agent } = await req.json()
    const N8N_URL = process.env.N8N_URL
    const N8N_API_KEY = process.env.N8N_API_KEY

    if (!N8N_URL || !N8N_API_KEY) {
      return NextResponse.json({ error: 'n8n non configuré' }, { status: 500 })
    }

    const workflow = convertAgentToN8n(agent)

    const response = await fetch(`${N8N_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY,
      },
      body: JSON.stringify(workflow),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `n8n error: ${err}` }, { status: 500 })
    }

    const created = await response.json()

    // Active le workflow
    await fetch(`${N8N_URL}/api/v1/workflows/${created.id}/activate`, {
      method: 'POST',
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
    })

    return NextResponse.json({
      success: true,
      workflow_id: created.id,
      workflow_url: `${N8N_URL}/workflow/${created.id}`,
    })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

function convertAgentToN8n(agent) {
  const nodes = []
  const connections = {}
  let posX = 250

  // Nœud déclencheur (toutes les 24h)
  nodes.push({
    id: 'trigger',
    name: 'Déclencheur quotidien',
    type: 'n8n-nodes-base.scheduleTrigger',
    typeVersion: 1.2,
    parameters: {
      rule: { interval: [{ field: 'hours', hoursInterval: 24 }] }
    },
    position: [posX, 300],
  })

  let prevNodeName = 'Déclencheur quotidien'
  posX += 200

  agent.nodes.forEach((node) => {
    let n8nNode = null

    if (node.type === 'llm') {
      n8nNode = {
        id: node.id,
        name: node.id,
        type: '@n8n/n8n-nodes-langchain.lmChatAnthropic',
        typeVersion: 1,
        parameters: {
          model: 'claude-haiku-4-5',
          messages: {
            values: [{ content: node.prompt_template }]
          }
        },
        position: [posX, 300],
      }
    } else if (node.type === 'tool') {
      const tool = node.tools?.[0]
      if (tool?.name === 'send_email') {
        n8nNode = {
          id: node.id,
          name: node.id,
          type: 'n8n-nodes-base.emailSend',
          typeVersion: 2,
          parameters: {
            fromEmail: 'noreply@metaagent.fr',
            toEmail: '={{ $json.email }}',
            subject: agent.name,
            text: node.prompt_template,
          },
          position: [posX, 300],
        }
      } else if (tool?.name === 'slack_notify') {
        n8nNode = {
          id: node.id,
          name: node.id,
          type: 'n8n-nodes-base.slack',
          typeVersion: 2,
          parameters: {
            operation: 'message',
            channel: '#general',
            text: node.prompt_template,
          },
          position: [posX, 300],
        }
      } else if (tool?.name === 'web_search') {
        n8nNode = {
          id: node.id,
          name: node.id,
          type: 'n8n-nodes-base.httpRequest',
          typeVersion: 4,
          parameters: {
            url: 'https://api.search.brave.com/res/v1/web/search',
            method: 'GET',
          },
          position: [posX, 300],
        }
      } else {
        n8nNode = {
          id: node.id,
          name: node.id,
          type: 'n8n-nodes-base.noOp',
          typeVersion: 1,
          parameters: {},
          position: [posX, 300],
        }
      }
    } else {
      n8nNode = {
        id: node.id,
        name: node.id,
        type: 'n8n-nodes-base.noOp',
        typeVersion: 1,
        parameters: {},
        position: [posX, 300],
      }
    }

    if (n8nNode) {
      nodes.push(n8nNode)
      if (!connections[prevNodeName]) {
        connections[prevNodeName] = { main: [[{ node: node.id, type: 'main', index: 0 }]] }
      }
      prevNodeName = node.id
      posX += 200
    }
  })

  return {
    name: agent.name,
    nodes,
    connections,
    active: false,
    settings: { executionOrder: 'v1' },
    tags: [],
  }
}