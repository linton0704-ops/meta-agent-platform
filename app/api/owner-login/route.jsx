import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { password } = await req.json()
    const correctPassword = process.env.OWNER_PASSWORD
    if (!correctPassword) {
      return NextResponse.json({ error: 'Non configuré' }, { status: 500 })
    }
    if (password === correctPassword) {
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ success: false }, { status: 401 })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}