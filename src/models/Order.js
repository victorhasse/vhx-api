import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";
import User from "./User.js";
import Coupon from "./Coupon.js";

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: User, key: "id" },
    },
    total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    coupon_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Coupon,
        key: "id",
      },
    },

    coupon_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },

    discount_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    cashback_eligible_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    cashback_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    cashback_earned_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    cashback_redeemed_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payment_intent_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "confirmed",
        "shipped",
        "delivered",
        "cancelled",
      ),
      defaultValue: "pending",
    },
    address: {
      type: DataTypes.TEXT,
    },
    shipping_service_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    shipping_service_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    shipping_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },

    shipping_delivery_time: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    shipping_postal_code: {
      type: DataTypes.STRING(8),
      allowNull: true,
    },
    tracking_code: {
      type: DataTypes.STRING(120),
      allowNull: true,
    },

    tracking_carrier: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },

    tracking_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },

    shipped_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "orders",
    timestamps: true,
  },
);

Order.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(Order, { foreignKey: "user_id" });
Order.belongsTo(Coupon, {
  foreignKey: "coupon_id",
  as: "coupon",
});

Coupon.hasMany(Order, {
  foreignKey: "coupon_id",
  as: "orders",
});

export default Order;
