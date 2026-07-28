import { DataTypes } from "sequelize";

export async function up({ context: queryInterface }) {
  await queryInterface.addColumn(
    "orders",
    "tracking_code",
    {
      type: DataTypes.STRING(120),
      allowNull: true,
    },
  );

  await queryInterface.addColumn(
    "orders",
    "tracking_carrier",
    {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
  );

  await queryInterface.addColumn(
    "orders",
    "tracking_url",
    {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
  );

  await queryInterface.addColumn(
    "orders",
    "shipped_at",
    {
      type: DataTypes.DATE,
      allowNull: true,
    },
  );

  await queryInterface.addColumn(
    "orders",
    "delivered_at",
    {
      type: DataTypes.DATE,
      allowNull: true,
    },
  );
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeColumn(
    "orders",
    "delivered_at",
  );

  await queryInterface.removeColumn(
    "orders",
    "shipped_at",
  );

  await queryInterface.removeColumn(
    "orders",
    "tracking_url",
  );

  await queryInterface.removeColumn(
    "orders",
    "tracking_carrier",
  );

  await queryInterface.removeColumn(
    "orders",
    "tracking_code",
  );
}