import { supabase, getCurrentUser, getUserProfile } from '../lib/supabase.js'

// Middleware to verify authentication
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const token = authHeader.split(' ')[1]
    
    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Get user profile
    const profile = await getUserProfile(user.id)
    
    req.user = {
      id: user.id,
      email: user.email,
      profile: profile
    }
    
    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(401).json({ error: 'Authentication failed' })
  }
}

// Middleware to require specific role
export const requireRole = (role) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' })
      }

      const userRole = req.user.profile.role
      
      // Admin can access everything
      if (userRole === 'admin') {
        return next()
      }
      
      // Check if user has required role
      if (userRole === role) {
        return next()
      }
      
      res.status(403).json({ error: 'Insufficient permissions' })
    } catch (error) {
      console.error('Role middleware error:', error)
      res.status(500).json({ error: 'Authorization failed' })
    }
  }
}

// Middleware to require admin or teacher role
export const requireTeacherOrAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const userRole = req.user.profile.role
    
    if (userRole === 'admin' || userRole === 'teacher') {
      return next()
    }
    
    res.status(403).json({ error: 'Teacher or admin access required' })
  } catch (error) {
    console.error('Teacher/Admin middleware error:', error)
    res.status(500).json({ error: 'Authorization failed' })
  }
}