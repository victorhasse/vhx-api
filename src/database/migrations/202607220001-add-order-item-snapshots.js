import {
  DataTypes,
} from 'sequelize'

export async function up({
  context: queryInterface,
}) {
  const transaction =
    await queryInterface.sequelize.transaction()

  try {
    await queryInterface.addColumn(
      'order_items',
      'product_name',
      {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      {
        transaction,
      }
    )

    await queryInterface.addColumn(
      'order_items',
      'image_url',
      {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      {
        transaction,
      }
    )

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export async function down({
  context: queryInterface,
}) {
  const transaction =
    await queryInterface.sequelize.transaction()

  try {
    await queryInterface.removeColumn(
      'order_items',
      'image_url',
      {
        transaction,
      }
    )

    await queryInterface.removeColumn(
      'order_items',
      'product_name',
      {
        transaction,
      }
    )

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}