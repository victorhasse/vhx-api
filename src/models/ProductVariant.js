import {
  DataTypes,
} from 'sequelize'

import sequelize from '../database/connection.js'
import Product from './Product.js'
import ProductColor from './ProductColor.js'

const ProductVariant = sequelize.define(
  'ProductVariant',
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
    product_color_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: ProductColor,
        key: 'id',
      },
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    size: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    price_override: {
      type: DataTypes.DECIMAL(
        10,
        2
      ),
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    tableName: 'product_variants',
    timestamps: true,
  }
)

Product.hasMany(ProductVariant, {
  foreignKey: 'product_id',
  as: 'variants',
})

ProductVariant.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
})

ProductColor.hasMany(ProductVariant, {
  foreignKey: 'product_color_id',
  as: 'variants',
})

ProductVariant.belongsTo(
  ProductColor,
  {
    foreignKey: 'product_color_id',
    as: 'color',
  }
)

export default ProductVariant