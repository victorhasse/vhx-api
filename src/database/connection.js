import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'
dotenv.config()

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false },
      },
      logging: false,
    })
  : new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false,
      }
    )

export async function connectDB() {
  try {
    await sequelize.authenticate()
    console.log('✅ Banco conectado com sucesso')
    await sequelize.sync({ alter: true })
    console.log('✅ Tabelas sincronizadas')
  } catch (err) {
    console.error('❌ Erro ao conectar no banco:', err.message)
    process.exit(1)
  }
}

export default sequelize