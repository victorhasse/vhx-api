import { DataTypes } from 'sequelize'

export async function up({ context: queryInterface}) {
  await queryInterface.addColumn(
    'orders',
    'shipping_service_id',
    {
      type: DataTypes.STRING,
      allowNull: true,
    }
  )

  await queryInterface.addColumn(
    'orders',
    'shipping_service_name',
    {
      type: DataTypes.STRING,
      allowNull: true,
    }
  )

  await queryInterface.addColumn(
    'orders',
    'shipping_price',
    {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    }
  )

  await queryInterface.addColumn(
    'orders',
    'shipping_delivery_time',
    {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  )

  await queryInterface.addColumn(
    'orders',
    'shipping_postal_code',
    {
      type: DataTypes.STRING(8),
      allowNull: true,
    }
  )
}

export async function down({ context: queryInterface }) {
  await queryInterface.removeColumn(
    'orders',
    'shipping_postal_code'
  )

  await queryInterface.removeColumn(
    'orders',
    'shipping_delivery_time'
  )

  await queryInterface.removeColumn(
    'orders',
    'shipping_price'
  )

  await queryInterface.removeColumn(
    'orders',
    'shipping_service_name'
  )

  await queryInterface.removeColumn(
    'orders',
    'shipping_service_id'
  )
}