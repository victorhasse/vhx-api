import { DataTypes } from 'sequelize'
import sequelize from '../database/connection.js'
import User from './User.js'

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'id' },
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  payment_intent_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending',
  },
  address: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'orders',
  timestamps: true,
})

Order.belongsTo(User, { foreignKey: 'user_id' })
User.hasMany(Order,   { foreignKey: 'user_id' })

export default Order