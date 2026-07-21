import {
  DataTypes,
} from 'sequelize'

export async function up({
  context: queryInterface,
}) {
  await queryInterface.sequelize.transaction(
    async transaction => {
      await queryInterface.createTable(
        'product_colors',
        {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
              model: 'products',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          name: {
            type: DataTypes.STRING(80),
            allowNull: false,
          },
          slug: {
            type: DataTypes.STRING(80),
            allowNull: false,
          },
          hex_code: {
            type: DataTypes.STRING(7),
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
        },
        {
          transaction,
        }
      )

      await queryInterface.addIndex(
        'product_colors',
        [
          'product_id',
          'slug',
        ],
        {
          name:
            'product_colors_product_slug_unique',
          unique: true,
          transaction,
        }
      )

      await queryInterface.createTable(
        'product_variants',
        {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
              model: 'products',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          product_color_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: 'product_colors',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          sku: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
          },
          size: {
            type: DataTypes.STRING(20),
            allowNull: true,
          },
          stock: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          price_override: {
            type: DataTypes.DECIMAL(
              10,
              2
            ),
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
        },
        {
          transaction,
        }
      )

      await queryInterface.addIndex(
        'product_variants',
        [
          'product_id',
          'product_color_id',
          'size',
        ],
        {
          name:
            'product_variants_selection_index',
          transaction,
        }
      )

      await queryInterface.createTable(
        'product_images',
        {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          product_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
              model: 'products',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          product_color_id: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: 'product_colors',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          image_url: {
            type: DataTypes.STRING(500),
            allowNull: false,
          },
          alt_text: {
            type: DataTypes.STRING(150),
            allowNull: true,
          },
          sort_order: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
          },
          is_primary: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
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
        {
          transaction,
        }
      )

      await queryInterface.addIndex(
        'product_images',
        [
          'product_id',
          'product_color_id',
          'sort_order',
        ],
        {
          name:
            'product_images_catalog_index',
          transaction,
        }
      )
    }
  )
}

export async function down({
  context: queryInterface,
}) {
  await queryInterface.sequelize.transaction(
    async transaction => {
      await queryInterface.dropTable(
        'product_images',
        {
          transaction,
        }
      )

      await queryInterface.dropTable(
        'product_variants',
        {
          transaction,
        }
      )

      await queryInterface.dropTable(
        'product_colors',
        {
          transaction,
        }
      )
    }
  )
}