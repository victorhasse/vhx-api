import { Op } from 'sequelize'
import Product from '../models/Product.js'
import ProductColor from '../models/ProductColor.js'
import ProductVariant from '../models/ProductVariant.js'
import ProductImage from '../models/ProductImage.js'

function getProductIncludes() {
  return [
    {
      model: ProductColor,
      as: 'colors',
      required: false,
      where: {
        active: true,
      },
      separate: true,
      order: [['id', 'ASC']],
      include: [
        {
          model: ProductImage,
          as: 'images',
          required: false,
          separate: true,
          order: [
            ['sort_order', 'ASC'],
            ['id', 'ASC'],
          ],
        },
      ],
    },
    {
      model: ProductVariant,
      as: 'variants',
      required: false,
      where: {
        active: true,
      },
      separate: true,
      order: [
        ['size', 'ASC'],
        ['id', 'ASC'],
      ],
      include: [
        {
          model: ProductColor,
          as: 'color',
          required: false,
          attributes: [
            'id',
            'name',
            'slug',
            'hex_code',
          ],
        },
      ],
    },
    {
      model: ProductImage,
      as: 'images',
      required: false,
      separate: true,
      order: [
        ['sort_order', 'ASC'],
        ['id', 'ASC'],
      ],
    },
  ]
}

export async function getAll(req, res) {
  try {
    const { category, search } = req.query
    const where = { active: true }
    if (category) where.category = category
    if (search)   where.name = { [Op.like]: `%${search}%` }

    const products = await Product.findAll({ where, order: [['createdAt', 'DESC']] })
    return res.json(products)
  } catch (error) {
    console.error(
      'Erro ao listar produtos:',
      error
    )

    return res.status(500).json({
      error: 'Não foi possível listar os produtos',
    })
  }
}

export async function getById(req, res) {
  try {
    const product = await Product.findOne({
      where: {
        id: req.params.id,
        active: true,
      },
      include: getProductIncludes(),
    })

    if (!product) {
      return res.status(404).json({
        error: 'Produto não encontrado',
      })
    }

    return res.json(product)
  } catch (error) {
    console.error(
      'Erro ao buscar produto:',
      error
    )

    return res.status(500).json({
      error: 'Não foi possível buscar o produto',
    })
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