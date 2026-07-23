import {
  DataTypes,
} from 'sequelize'

export async function up({
  context: queryInterface,
}) {
  const columns =
    await queryInterface.describeTable(
      'products'
    )

  if (!columns.weight) {
    await queryInterface.addColumn(
      'products',
      'weight',
      {
        type: DataTypes.DECIMAL(10, 3),
        allowNull: true,
      }
    )
  }

  if (!columns.width) {
    await queryInterface.addColumn(
      'products',
      'width',
      {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      }
    )
  }

  if (!columns.height) {
    await queryInterface.addColumn(
      'products',
      'height',
      {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      }
    )
  }

  if (!columns.length) {
    await queryInterface.addColumn(
      'products',
      'length',
      {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      }
    )
  }
}

export async function down({
  context: queryInterface,
}) {
  const columns =
    await queryInterface.describeTable(
      'products'
    )

  if (columns.length) {
    await queryInterface.removeColumn(
      'products',
      'length'
    )
  }

  if (columns.height) {
    await queryInterface.removeColumn(
      'products',
      'height'
    )
  }

  if (columns.width) {
    await queryInterface.removeColumn(
      'products',
      'width'
    )
  }

  if (columns.weight) {
    await queryInterface.removeColumn(
      'products',
      'weight'
    )
  }
}