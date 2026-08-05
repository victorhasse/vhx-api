import { DataTypes } from "sequelize";

export async function up({ context: queryInterface }) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.addColumn(
      "products",
      "name_en",
      {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "products",
      "description_en",
      {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      { transaction },
    );

    await queryInterface.addColumn(
      "product_colors",
      "name_en",
      {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      { transaction },
    );
  });
}

export async function down({ context: queryInterface }) {
  await queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.removeColumn(
      "product_colors",
      "name_en",
      { transaction },
    );

    await queryInterface.removeColumn(
      "products",
      "description_en",
      { transaction },
    );

    await queryInterface.removeColumn(
      "products",
      "name_en",
      { transaction },
    );
  });
}