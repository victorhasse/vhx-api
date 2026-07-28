import { DataTypes } from "sequelize";

import sequelize from "../database/connection.js";
import Product from "./Product.js";
import User from "./User.js";

const Wishlist = sequelize.define(
  "Wishlist",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Product,
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "wishlists",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["user_id", "product_id"],
        name: "wishlists_user_product_unique",
      },
    ],
  },
);

User.hasMany(Wishlist, {
  foreignKey: "user_id",
  as: "wishlistItems",
});

Wishlist.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

Product.hasMany(Wishlist, {
  foreignKey: "product_id",
  as: "wishlistItems",
});

Wishlist.belongsTo(Product, {
  foreignKey: "product_id",
  as: "product",
});

export default Wishlist;