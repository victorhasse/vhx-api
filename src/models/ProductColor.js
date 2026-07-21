import {
  DataTypes,
} from 'sequelize'

import sequelize from '../database/connection.js'
import Product from './Product.js'

const ProductColor = sequelize.define(
  'ProductColor',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Product,
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    hex_code: {
      type: DataTypes.STRING(7),
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'product_colors',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: [
          'product_id',
          'slug',
        ],
      },
    ],
  }
)

Product.hasMany(ProductColor, {
  foreignKey: 'product_id',
  as: 'colors',
})

ProductColor.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
})

export default ProductColor