import { DataTypes } from "sequelize";

export async function up({ context: queryInterface }) {
  await queryInterface.addColumn("products", "is_promotional", {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  });

  await queryInterface.addColumn("orders", "cashback_eligible_amount", {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  });

  await queryInterface.addColumn("orders", "cashback_rate", {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
  });

  await queryInterface.addColumn("orders", "cashback_earned_amount", {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  });

  await queryInterface.addColumn("orders", "cashback_redeemed_amount", {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  });

  await queryInterface.createTable("cashback_transactions", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    order_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "orders",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
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

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex(
    "cashback_transactions",
    ["user_id", "status", "expires_at"],
    {
      name: "cashback_transactions_user_status_expiry_idx",
    },
  );

  await queryInterface.addIndex(
    "cashback_transactions",
    ["order_id", "type"],
    {
      name: "cashback_transactions_order_type_unique",
      unique: true,
    },
  );

  await queryInterface.createTable("cashback_allocations", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    redemption_transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "cashback_transactions",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    credit_transaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "cashback_transactions",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },

    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },

    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex(
    "cashback_allocations",
    ["redemption_transaction_id", "credit_transaction_id"],
    {
      name: "cashback_allocations_redemption_credit_unique",
      unique: true,
    },
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.dropTable("cashback_allocations");
  await queryInterface.dropTable("cashback_transactions");

  await queryInterface.removeColumn(
    "orders",
    "cashback_redeemed_amount",
  );

  await queryInterface.removeColumn(
    "orders",
    "cashback_earned_amount",
  );

  await queryInterface.removeColumn("orders", "cashback_rate");

  await queryInterface.removeColumn(
    "orders",
    "cashback_eligible_amount",
  );

  await queryInterface.removeColumn(
    "products",
    "is_promotional",
  );
}