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
      'product_variant_id',
      {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'product_variants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      {
        transaction,
      }
    )

    await queryInterface.addColumn(
      'order_items',
      'sku',
      {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      {
        transaction,
      }
    )

    await queryInterface.addColumn(
      'order_items',
      'color',
      {
        type: DataTypes.STRING(80),
        allowNull: true,
      },
      {
        transaction,
      }
    )

    await queryInterface.addIndex(
      'order_items',
      ['product_variant_id'],
      {
        name: 'order_items_product_variant_id_idx',
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
    await queryInterface.removeIndex(
      'order_items',
      'order_items_product_variant_id_idx',
      {
        transaction,
      }
    )

    await queryInterface.removeColumn(
      'order_items',
      'color',
      {
        transaction,
      }
    )

    await queryInterface.removeColumn(
      'order_items',
      'sku',
      {
        transaction,
      }
    )

    await queryInterface.removeColumn(
      'order_items',
      'product_variant_id',
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