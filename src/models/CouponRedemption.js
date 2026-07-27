import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";
import Coupon from "./Coupon.js";
import User from "./User.js";
import Order from "./Order.js";

const CouponRedemption = sequelize.define(
  "CouponRedemption",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    coupon_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Coupon,
        key: "id",
      },
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },

    order_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: Order,
        key: "id",
      },
    },
  },
  {
    tableName: "coupon_redemptions",
    timestamps: true,
  },
);

Coupon.hasMany(CouponRedemption, {
  foreignKey: "coupon_id",
  as: "redemptions",
});

CouponRedemption.belongsTo(Coupon, {
  foreignKey: "coupon_id",
  as: "coupon",
});

User.hasMany(CouponRedemption, {
  foreignKey: "user_id",
  as: "couponRedemptions",
});

CouponRedemption.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

Order.hasOne(CouponRedemption, {
  foreignKey: "order_id",
  as: "couponRedemption",
});

CouponRedemption.belongsTo(Order, {
  foreignKey: "order_id",
  as: "order",
});

export default CouponRedemption;