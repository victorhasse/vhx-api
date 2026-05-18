import { DataTypes } from 'sequelize'
import sequelize from '../database/connection.js'
import Order from './Order.js'
import Product from './Product.js'

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
}, {
  tableName: 'order_items',
  timestamps: true,
})

Order.hasMany(OrderItem,    { foreignKey: 'order_id', as: 'items' })
OrderItem.belongsTo(Order,  { foreignKey: 'order_id' })
OrderItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' })

export default OrderItem