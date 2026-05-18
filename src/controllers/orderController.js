import Order from '../models/Order.js'
import OrderItem from '../models/OrderItem.js'
import Product from '../models/Product.js'

export async function createOrder(req, res) {
  try {
    const { items, address } = req.body
    const user_id = req.user.id

    if (!items || items.length === 0)
      return res.status(400).json({ error: 'Carrinho vazio' })

    // Calcula o total
    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0)

    // Cria o pedido
    const order = await Order.create({
      user_id,
      total,
      status: 'pending',
      address: JSON.stringify(address),
    })

    // Cria os itens do pedido
    await Promise.all(items.map(item =>
      OrderItem.create({
        order_id:   order.id,
        product_id: item.id,
        quantity:   item.quantity,
        price:      item.price,
        size:       item.selectedSize || null,
      })
    ))

    // Busca o pedido completo com itens
    const fullOrder = await Order.findByPk(order.id, {
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'image_url'] }],
      }],
    })

    return res.status(201).json(fullOrder)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

export async function getMyOrders(req, res) {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'image_url'] }],
      }],
      order: [['createdAt', 'DESC']],
    })
    return res.json(orders)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

export async function getOrderById(req, res) {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [{
        model: OrderItem,
        as: 'items',
        include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'image_url'] }],
      }],
    })
    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' })
    return res.json(order)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}