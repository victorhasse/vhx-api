import Stripe from 'stripe'
import Order from '../models/Order.js'
import OrderItem from '../models/OrderItem.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export async function createPaymentIntent(req, res) {
  try {
    const { items, address } = req.body
    const user_id = req.user.id

    if (!items || items.length === 0)
      return res.status(400).json({ error: 'Carrinho vazio' })

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const totalCents = Math.round(total * 100)

    // Cria o PaymentIntent no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   totalCents,
      currency: 'brl',
      metadata: { user_id: String(user_id) },
    })

    // Cria o pedido no banco com status pending
    const order = await Order.create({
      user_id,
      total,
      status: 'pending',
      address: JSON.stringify(address),
    })

    await Promise.all(items.map(item =>
      OrderItem.create({
        order_id:   order.id,
        product_id: item.id,
        quantity:   item.quantity,
        price:      item.price,
        size:       item.selectedSize || null,
      })
    ))

    return res.json({
      clientSecret: paymentIntent.client_secret,
      orderId:      order.id,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

export async function confirmPayment(req, res) {
  try {
    const { orderId } = req.body
    const order = await Order.findByPk(orderId)
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' })

    await order.update({ status: 'confirmed' })
    return res.json({ success: true, order })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}