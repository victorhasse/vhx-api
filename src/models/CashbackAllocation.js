import { DataTypes } from "sequelize";
import sequelize from "../database/connection.js";
import CashbackTransaction from "./CashbackTransaction.js";

const CashbackAllocation = sequelize.define(
  "CashbackAllocation",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    redemption_transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: CashbackTransaction,
        key: "id",
      },
    },

    credit_transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: CashbackTransaction,
        key: "id",
      },
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    tableName: "cashback_allocations",
    timestamps: true,
  },
);

CashbackTransaction.hasMany(CashbackAllocation, {
  foreignKey: "redemption_transaction_id",
  as: "redemptionAllocations",
});

CashbackAllocation.belongsTo(CashbackTransaction, {
  foreignKey: "redemption_transaction_id",
  as: "redemptionTransaction",
});

CashbackTransaction.hasMany(CashbackAllocation, {
  foreignKey: "credit_transaction_id",
  as: "creditAllocations",
});

CashbackAllocation.belongsTo(CashbackTransaction, {
  foreignKey: "credit_transaction_id",
  as: "creditTransaction",
});

export default CashbackAllocation;