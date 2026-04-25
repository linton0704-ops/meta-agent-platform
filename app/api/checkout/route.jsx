import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function POST(req) {
  try {
    const { plan } = await req.json()

    const prices = {
      starter:  { amount: 2900,  name: 'MetaAgent Starter'  },
      pro:      { amount: 8900,  name: 'MetaAgent Pro'       },
      business: { amount: 29900, name: 'MetaAgent Business'  },
    }

    const selected = prices[plan] || prices.starter

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: selected.name },
          unit_amount: selected.amount,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }],
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`,
      cancel_url:  `${process.env.NEXT_PUBLIC_BASE_URL}/`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}