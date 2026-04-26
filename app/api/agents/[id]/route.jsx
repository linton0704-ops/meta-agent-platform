import { NextResponse } from 'next/server'
import { MongoClient } from 'mongodb'

let client, db

async function getDb() {
  if (!client) {
    client = new MongoClient(process.env.MONGO_URL)
    await client.connect()
    db = client.db('metaagent_db')
  }
  return db
}

export async function DELETE(request, { params }) {
  try {
    const database = await getDb()
    await database.collection('agents').deleteOne({ id: params.id })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}