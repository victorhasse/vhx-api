import { Sequelize } from 'sequelize'
import dotenv from 'dotenv'
dotenv.config()

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host:    process.env.DB_HOST,
    port:    process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
  }
)

export async function connectDB() {
  try {
    await sequelize.authenticate()
    console.log('✅ MySQL conectado com sucesso')
    await sequelize.sync({ alter: true })
    console.log('✅ Tabelas sincronizadas')
  } catch (err) {
    console.error('❌ Erro ao conectar no banco:', err.message)
    process.exit(1)
  }
}

export default sequelize