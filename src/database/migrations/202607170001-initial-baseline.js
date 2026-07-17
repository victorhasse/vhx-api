import {
  DataTypes,
} from 'sequelize'

function normalizeTableName(table) {
  if (typeof table === 'string') {
    return table.toLowerCase()
  }

  return String(
    table.tableName ||
    table.table_name ||
    ''
  ).toLowerCase()
}

export async function up({
  context: queryInterface,
}) {
  const tables =
    await queryInterface.showAllTables()

  const existingTables = new Set(
    tables.map(normalizeTableName)
  )

  if (!existingTables.has('users')) {
    await queryInterface.createTable(
      'users',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        email: {
          type: DataTypes.STRING(150),
          allowNull: false,
          unique: true,
        },
        password: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        role: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'customer',
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      }
    )
  }

  if (!existingTables.has('products')) {
    await queryInterface.createTable(
      'products',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(150),
          allowNull: false,
        },
        description: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        category: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        image_url: {
          type: DataTypes.STRING(500),
          allowNull: true,
        },
        stock: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        badge: {
          type: DataTypes.STRING(50),
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
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      }
    )
  }

  if (!existingTables.has('orders')) {
    await queryInterface.createTable(
      'orders',
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
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        total: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        payment_intent_id: {
          type: DataTypes.STRING(255),
          allowNull: true,
          unique: true,
        },
        status: {
          type: DataTypes.ENUM(
            'pending',
            'confirmed',
            'shipped',
            'delivered',
            'cancelled'
          ),
          allowNull: false,
          defaultValue: 'pending',
        },
        address: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      }
    )
  } else {
    /*
     * A tabela já existia antes das migrations.
     * Garantimos a coluna adicionada recentemente.
     */
    const orderColumns =
      await queryInterface.describeTable(
        'orders'
      )

    if (!orderColumns.payment_intent_id) {
      await queryInterface.addColumn(
        'orders',
        'payment_intent_id',
        {
          type: DataTypes.STRING(255),
          allowNull: true,
          unique: true,
        }
      )
    }
  }

  if (!existingTables.has('order_items')) {
    await queryInterface.createTable(
      'order_items',
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false,
        },
        order_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'orders',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        product_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'products',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1,
        },
        price: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: false,
        },
        size: {
          type: DataTypes.STRING(10),
          allowNull: true,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: false,
        },
      }
    )
  }
}

export async function down() {
  /*
   * Esta é uma baseline adotada sobre um banco
   * existente. Ela não remove tabelas para evitar
   * perda acidental de dados.
   */
  console.warn(
    'A migration baseline não pode ser revertida automaticamente'
  )
}