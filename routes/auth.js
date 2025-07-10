import express from 'express'
import { supabase } from '../lib/supabase.js'
import bcrypt from 'bcryptjs'

const router = express.Router()

// Sign up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role = 'student' } = req.body

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' })
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role
        }
      }
    })

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    res.json({ 
      message: 'Signup successful',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        name
      }
    })
  } catch (error) {
    console.error('Signup error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Sign in
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return res.status(500).json({ error: 'Failed to fetch user profile' })
    }

    res.json({
      message: 'Login successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        name: profile.name,
        role: profile.role
      },
      session: data.session
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get current user profile
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    
    // Get user from token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    if (profileError) {
      return res.status(404).json({ error: 'Profile not found' })
    }

    res.json({
      id: user.id,
      email: user.email,
      name: profile.name,
      role: profile.role
    })
  } catch (error) {
    console.error('Profile error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Sign out
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      await supabase.auth.signOut(token)
    }
    
    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    res.json({ message: 'Logged out successfully' }) // Always succeed
  }
})

export default router