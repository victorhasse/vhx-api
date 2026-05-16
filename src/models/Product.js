import { DataTypes } from 'sequelize'
import sequelize from '../database/connection.js'

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(150),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  image_url: {
    type: DataTypes.STRING(500),
  },
  stock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  badge: {
    type: DataTypes.STRING(50),
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'products',
  timestamps: true,
})

export default Product