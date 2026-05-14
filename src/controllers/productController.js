import { Op } from 'sequelize'
import Product from '../models/Product.js'

export async function getAll(req, res) {
  try {
    const { category, search } = req.query
    const where = { active: true }
    if (category) where.category = category
    if (search)   where.name = { [Op.like]: `%${search}%` }

    const products = await Product.findAll({ where, order: [['createdAt', 'DESC']] })
    return res.json(products)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

export async function getById(req, res) {
  try {
    const product = await Product.findByPk(req.params.id)
    if (!product || !product.active)
      return res.status(404).json({ error: 'Produto não encontrado' })
    return res.json(product)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

export async function create(req, res) {
  try {
    const product = await Product.create(req.body)
    return res.status(201).json(product)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

export async function update(req, res) {
  try {
    const product = await Product.findByPk(req.params.id)
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' })
    await product.update(req.body)
    return res.json(product)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

export async function remove(req, res) {
  try {
    const product = await Product.findByPk(req.params.id)
    if (!product) return res.status(404).json({ error: 'Produto não encontrado' })
    await product.update({ active: false })
    return res.json({ message: 'Produto removido' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}