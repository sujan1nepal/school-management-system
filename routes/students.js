import express from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth, requireTeacherOrAdmin } from '../middleware/auth.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(requireAuth)

// Get all students (admin/teacher only)
router.get('/', requireTeacherOrAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        user:users(name, email)
      `)
      .order('name')

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Get students error:', error)
    res.status(500).json({ error: 'Failed to fetch students' })
  }
})

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const userRole = req.user.profile.role

    let query = supabase
      .from('students')
      .select(`
        *,
        user:users(name, email)
      `)
      .eq('id', id)

    // Apply RLS - parents can only see their children
    if (userRole === 'parent') {
      query = query.eq('parent_email', req.user.email)
    }

    const { data, error } = await query.single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Student not found' })
      }
      throw error
    }

    res.json(data)
  } catch (error) {
    console.error('Get student error:', error)
    res.status(500).json({ error: 'Failed to fetch student' })
  }
})

// Create new student (admin only)
router.post('/', requireTeacherOrAdmin, async (req, res) => {
  try {
    const { name, grade, parent_email, user_id } = req.body

    if (!name || !grade) {
      return res.status(400).json({ error: 'Name and grade are required' })
    }

    const { data, error } = await supabase
      .from('students')
      .insert({
        name,
        grade,
        parent_email,
        user_id
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (error) {
    console.error('Create student error:', error)
    res.status(500).json({ error: 'Failed to create student' })
  }
})

// Update student (admin only)
router.put('/:id', requireTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, grade, parent_email, user_id } = req.body

    const { data, error } = await supabase
      .from('students')
      .update({
        name,
        grade,
        parent_email,
        user_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Student not found' })
      }
      throw error
    }

    res.json(data)
  } catch (error) {
    console.error('Update student error:', error)
    res.status(500).json({ error: 'Failed to update student' })
  }
})

// Delete student (admin only)
router.delete('/:id', requireTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ message: 'Student deleted successfully' })
  } catch (error) {
    console.error('Delete student error:', error)
    res.status(500).json({ error: 'Failed to delete student' })
  }
})

// Get students by grade (for teachers)
router.get('/grade/:grade', requireTeacherOrAdmin, async (req, res) => {
  try {
    const { grade } = req.params

    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        user:users(name, email)
      `)
      .eq('grade', grade)
      .order('name')

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Get students by grade error:', error)
    res.status(500).json({ error: 'Failed to fetch students' })
  }
})

export default router