import { DataTypes } from "sequelize";

export async function up({
  context: queryInterface,
}) {
  await queryInterface.createTable(
    "wishlists",
    {
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
        onDelete: "CASCADE",
      },

      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,

        references: {
          model: "products",
          key: "id",
        },

        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
  );

  await queryInterface.addConstraint(
    "wishlists",
    {
      fields: [
        "user_id",
        "product_id",
      ],

      type: "unique",
      name: "wishlists_user_product_unique",
    },
  );
}

export async function down({
  context: queryInterface,
}) {
  await queryInterface.dropTable(
    "wishlists",
  );
}