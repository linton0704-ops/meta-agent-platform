import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'
import { v4 as uuidv4 } from 'uuid'

let client, db

async function getDb() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db('metaagent_db')
  }
  return db
}

export async function GET() {
  try {
    const database = await getDb()
    const agents = await database
      .collection('agents')
      .find({})
      .sort({ created_at: -1 })
      .limit(100)
      .toArray()
    return NextResponse.json(agents.map(({ _id, ...r }) => r))
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
    const agent = {
      ...body,
      id: body.id || uuidv4(),
      created_at: body.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    delete agent._id
    const database = await getDb()
    await database
      .collection('agents')
      .updateOne({ id: agent.id }, { $set: agent }, { upsert: true })
    return NextResponse.json(agent, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}