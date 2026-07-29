import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";

const Product = sequelize.define(
  "Product",
  {
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
    weight: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: true,
    },
    width: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    height: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    length: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    badge: {
      type: DataTypes.STRING(50),
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    is_promotional: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    tableName: "products",
    timestamps: true,
  },
);

export default Product;
