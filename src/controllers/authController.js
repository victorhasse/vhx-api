import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export async function register(req, res) {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Preencha todos os campos' })

    const exists = await User.findOne({ where: { email } })
    if (exists)
      return res.status(409).json({ error: 'E-mail já cadastrado' })

    const hash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, password: hash })

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    return res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: 'Informe e-mail e senha' })

    const user = await User.findOne({ where: { email } })
    if (!user)
      return res.status(401).json({ error: 'Credenciais inválidas' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return res.status(401).json({ error: 'Credenciais inválidas' })

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    return res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

export async function me(req, res) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'role', 'createdAt'],
    })
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' })
    return res.json(user)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}