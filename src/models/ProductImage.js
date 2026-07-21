import {
  DataTypes,
} from 'sequelize'

import sequelize from '../database/connection.js'
import Product from './Product.js'
import ProductColor from './ProductColor.js'

const ProductImage = sequelize.define(
  'ProductImage',
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
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    alt_text: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: 'product_images',
    timestamps: true,
  }
)

Product.hasMany(ProductImage, {
  foreignKey: 'product_id',
  as: 'images',
})

ProductImage.belongsTo(Product, {
  foreignKey: 'product_id',
  as: 'product',
})

ProductColor.hasMany(ProductImage, {
  foreignKey: 'product_color_id',
  as: 'images',
})

ProductImage.belongsTo(
  ProductColor,
  {
    foreignKey: 'product_color_id',
    as: 'color',
  }
)

export default ProductImage