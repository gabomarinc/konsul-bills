import express from 'express'
import bcrypt from 'bcryptjs'

const app = express()
const port = 3001

// Middleware
app.use(express.json())

// Simulación de base de datos
const users = []

// API de registro
app.post('/api/auth/register-simple', async (req, res) => {
  try {
    const { email, password, name } = req.body
    
    console.log('Registration request:', { email, name, password: '[HIDDEN]' })
    
    // Validaciones
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password and name are required' })
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' })
    }
    
    // Verificar usuario existente
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' })
    }
    
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Crear usuario
    const user = {
      id: `user_${Date.now()}`,
      email,
      name,
      password: hashedPassword,
      company: {
        id: `company_${Date.now()}`,
        name: `${name}'s Company`
      }
    }
    
    users.push(user)
    
    console.log('User created:', user.email)
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      company: {
        id: user.company.id,
        name: user.company.name
      }
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Failed to register user' })
  }
})

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Simple dev server running on http://localhost:${port}`)
  console.log(`📝 Test with: curl -X POST http://localhost:${port}/api/auth/register-simple -H "Content-Type: application/json" -d '{"name":"Test","email":"test@example.com","password":"123456"}'`)
})



