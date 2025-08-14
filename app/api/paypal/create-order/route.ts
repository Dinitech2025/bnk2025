import { NextRequest, NextResponse } from 'next/server'

// Configuration PayPal
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET
const PAYPAL_BASE_URL = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com'

// Fonction pour obtenir un token d'accès PayPal
async function getPayPalAccessToken() {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64')
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials'
  })

  const data = await response.json()
  return data.access_token
}

export async function POST(request: NextRequest) {
  try {
    // Vérifier que PayPal est configuré
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'PayPal non configuré. Veuillez définir PAYPAL_CLIENT_ID et PAYPAL_CLIENT_SECRET.' },
        { status: 500 }
      )
    }

    const { amount, currency, orderData } = await request.json()

    // Validation des données
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Montant invalide' },
        { status: 400 }
      )
    }

    // Obtenir le token d'accès
    const accessToken = await getPayPalAccessToken()

    // Créer la commande PayPal
    const paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount
        },
        description: `Commande BNK - ${orderData?.items?.length || 1} article(s)`,
        custom_id: orderData?.orderId || '',
        invoice_id: `BNK-${Date.now()}`,
      }],
      application_context: {
        brand_name: 'BNK E-commerce',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/order-success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout`
      }
    }

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paypalOrder)
    })

    const order = await response.json()

    if (response.ok) {
      return NextResponse.json({
        id: order.id,
        status: order.status
      })
    } else {
      console.error('Erreur PayPal:', order)
      return NextResponse.json(
        { error: order.message || 'Erreur lors de la création de la commande PayPal' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Erreur création commande PayPal:', error)
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
} 