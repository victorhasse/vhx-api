import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";
import User from "./User.js";
import Order from "./Order.js";

const CashbackTransaction = sequelize.define(
  "CashbackTransaction",
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
    },

    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Order,
        key: "id",
      },
    },

    type: {
      type: DataTypes.ENUM(
        "earned",
        "redeemed",
        "reversed",
        "adjustment",
        "expiration",
      ),
      allowNull: false,
    },

    status: {
      type: DataTypes.ENUM(
        "pending",
        "available",
        "completed",
        "cancelled",
        "expired",
      ),
      allowNull: false,
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    remaining_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    available_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    tableName: "cashback_transactions",
    timestamps: true,
  },
);

User.hasMany(CashbackTransaction, {
  foreignKey: "user_id",
  as: "cashbackTransactions",
});

CashbackTransaction.belongsTo(User, {
  foreignKey: "user_id",
  as: "user",
});

Order.hasMany(CashbackTransaction, {
  foreignKey: "order_id",
  as: "cashbackTransactions",
});

CashbackTransaction.belongsTo(Order, {
  foreignKey: "order_id",
  as: "order",
});

export default CashbackTransaction;