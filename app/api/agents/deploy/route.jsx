import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { agent } = await req.json()
    const N8N_URL = process.env.N8N_URL
    const N8N_API_KEY = process.env.N8N_API_KEY

    if (!N8N_URL || !N8N_API_KEY) {
      return NextResponse.json({ error: 'n8n non configuré' }, { status: 500 })
    }

    // 1. On prépare la structure du workflow (SANS le champ "active")
    const workflowData = convertAgentToN8n(agent)

    // 2. Création du workflow sur n8n
    const response = await fetch(`${N8N_URL}/api/v1/workflows`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': N8N_API_KEY,
      },
      body: JSON.stringify(workflowData),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `n8n creation error: ${err}` }, { status: 500 })
    }

    const created = await response.json()

    // 3. Activation du workflow (Appel séparé pour éviter l'erreur read-only)
    const activationResponse = await fetch(`${N8N_URL}/api/v1/workflows/${created.id}/activate`, {
      method: 'POST',
      headers: { 
        'X-N8N-API-KEY': N8N_API_KEY 
      },
    })

    return NextResponse.json({
      success: true,
      workflow_id: created.id,
      active: activationResponse.ok,
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

  // Nœud de départ (Trigger)
  const triggerNode = {
    id: 'trigger-id', // ID fixe pour la connexion
    name: 'Déclencheur quotidien',
    type: 'n8n-nodes-base.scheduleTrigger',
    typeVersion: 1.1,
    parameters: {
      rule: { interval: [{ field: 'hours', hoursInterval: 24 }] }
    },
    position: [posX, 300],
  }
  
  nodes.push(triggerNode)
  let prevNodeId = 'trigger-id'
  posX += 250

  // Conversion des nœuds de l'agent
  agent.nodes.forEach((node, index) => {
    let n8nNode = {
      id: node.id,
      name: `Node_${index}`, // n8n préfère des noms sans caractères spéciaux
      position: [posX, 300],
      parameters: {}
    }

    if (node.type === 'llm') {
      n8nNode.type = 'n8n-nodes-base.httpRequest' // Utilisation simple pour test
      n8nNode.typeVersion = 4
      n8nNode.parameters = {
        url: 'https://api.anthropic.com/v1/messages',
        method: 'POST',
        bodyParameters: {
          parameters: [{ name: 'prompt', value: node.prompt_template }]
        }
      }
    } else if (node.type === 'tool') {
      n8nNode.type = 'n8n-nodes-base.noOp'
      n8nNode.typeVersion = 1
    } else {
      n8nNode.type = 'n8n-nodes-base.noOp'
      n8nNode.typeVersion = 1
    }

    nodes.push(n8nNode)

    // Création de la connexion entre le précédent et l'actuel
    if (!connections[prevNodeId]) {
      connections[prevNodeId] = { main: [[]] }
    }
    connections[prevNodeId].main[0].push({
      node: n8nNode.name,
      type: 'main',
      index: 0
    })

    prevNodeId = n8nNode.name
    posX += 250
  })

  return {
    name: `Agent: ${agent.name}`,
    nodes,
    connections,
    // On ne met pas "active: true" ici, c'est ce qui bloquait !
    settings: { executionOrder: 'v1' }
  }
}