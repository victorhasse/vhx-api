import path from 'node:path'
import {
  fileURLToPath,
  pathToFileURL,
} from 'node:url'

import {
  SequelizeStorage,
  Umzug,
} from 'umzug'

import sequelize from './connection.js'

const currentFile =
  fileURLToPath(import.meta.url)

const currentDirectory =
  path.dirname(currentFile)

export const migrator = new Umzug({
  migrations: {
    glob: [
      'migrations/*.js',
      {
        cwd: currentDirectory,
      },
    ],

    /*
     * Carrega migrations como ES Modules.
     */
    resolve: ({
      name,
      path: migrationPath,
      context,
    }) => ({
      name,

      up: async () => {
        const migration = await import(
          pathToFileURL(
            migrationPath
          ).href
        )

        return migration.up({
          context,
        })
      },

      down: async () => {
        const migration = await import(
          pathToFileURL(
            migrationPath
          ).href
        )

        return migration.down({
          context,
        })
      },
    }),
  },

  context: sequelize.getQueryInterface(),

  storage: new SequelizeStorage({
    sequelize,
  }),

  logger: console,
})

async function runMigrations() {
  try {
    await sequelize.authenticate()

    const migrations =
      await migrator.up()

    if (migrations.length === 0) {
      console.log(
        '✅ Nenhuma migration pendente'
      )
    } else {
      console.log(
        `✅ ${migrations.length} migration(s) executada(s)`
      )
    }
  } catch (error) {
    console.error(
      '❌ Erro ao executar migrations:',
      error
    )

    process.exitCode = 1
  } finally {
    await sequelize.close()
  }
}

runMigrations()