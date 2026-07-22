import { DataTypes } from 'sequelize'
import sequelize from '../database/connection.js'
import Order from './Order.js'
import Product from './Product.js'
import ProductVariant from './ProductVariant.js'

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  order_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Order, key: 'id' },
  },
  product_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Product, key: 'id' },
  },
  product_variant_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: ProductVariant, key: 'id' },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  size: {
    type: DataTypes.STRING(10),
  },
  sku: {
    type: DataTypes.STRING(100),
  },
  color: {
    type: DataTypes.STRING(80),
  },
  product_name: {
    type: DataTypes.STRING(150),
  },
  image_url: {
    type: DataTypes.STRING(500),
  },
}, {
  tableName: 'order_items',
  timestamps: true,
})

Order.hasMany(OrderItem,    { foreignKey: 'order_id', as: 'items' })
OrderItem.belongsTo(Order,  { foreignKey: 'order_id' })
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' })
OrderItem.belongsTo(ProductVariant, { foreignKey: 'product_variant_id', as: 'variant' })

export default OrderItem