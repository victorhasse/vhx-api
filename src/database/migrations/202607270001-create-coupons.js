import { DataTypes } from "sequelize";

export async function up({ context: queryInterface }) {
  await queryInterface.createTable("coupons", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },

    discount_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },

    discount_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },

    minimum_order_amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },

    starts_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    usage_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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

  await queryInterface.createTable("coupon_redemptions", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },

    coupon_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "coupons",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
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
      allowNull: false,
      unique: true,
      references: {
        model: "orders",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
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

  await queryInterface.addColumn("orders", "subtotal", {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  });

  await queryInterface.addColumn("orders", "coupon_id", {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "coupons",
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });

  await queryInterface.addColumn("orders", "coupon_code", {
    type: DataTypes.STRING(50),
    allowNull: true,
  });

  await queryInterface.addColumn("orders", "discount_amount", {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeColumn("orders", "discount_amount");
  await queryInterface.removeColumn("orders", "coupon_code");
  await queryInterface.removeColumn("orders", "coupon_id");
  await queryInterface.removeColumn("orders", "subtotal");

  await queryInterface.dropTable("coupon_redemptions");
  await queryInterface.dropTable("coupons");
}