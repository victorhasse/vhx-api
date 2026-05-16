import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectDB } from './src/database/connection.js'

import productRoutes from './src/routes/products.js'
import authRoutes    from './src/routes/auth.js'
import orderRoutes   from './src/routes/orders.js'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 3333

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://victorhasse.github.io',
  ],
  credentials: true,
}))
app.use(express.json())

app.use('/api/products', productRoutes)
app.use('/api/auth',     authRoutes)
app.use('/api/orders',   orderRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'VHX API rodando ✅', version: '1.0.0' })
})

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 VHX API rodando em http://localhost:${PORT}`)
  })
})

export default app