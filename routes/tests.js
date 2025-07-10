import express from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth, requireTeacherOrAdmin } from '../middleware/auth.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(requireAuth)

// Get all tests
router.get('/', async (req, res) => {
  try {
    const { grade, subject } = req.query

    let query = supabase
      .from('tests')
      .select(`
        *,
        creator:users!created_by(
          name,
          email
        ),
        test_marks(
          id,
          student_id,
          score,
          max_score,
          student:students(
            id,
            name,
            grade
          )
        )
      `)

    // Apply filters
    if (grade) {
      query = query.eq('grade', grade)
    }
    if (subject) {
      query = query.eq('subject', subject)
    }

    query = query.order('test_date', { ascending: false })

    const { data, error } = await query

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Get tests error:', error)
    res.status(500).json({ error: 'Failed to fetch tests' })
  }
})

// Get test by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('tests')
      .select(`
        *,
        creator:users!created_by(
          name,
          email
        ),
        test_marks(
          id,
          student_id,
          score,
          max_score,
          student:students(
            id,
            name,
            grade,
            parent_email
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Test not found' })
      }
      throw error
    }

    res.json(data)
  } catch (error) {
    console.error('Get test error:', error)
    res.status(500).json({ error: 'Failed to fetch test' })
  }
})

// Create new test (teachers/admin only)
router.post('/', requireTeacherOrAdmin, async (req, res) => {
  try {
    const { subject, chapter, test_date, grade } = req.body

    if (!subject || !test_date || !grade) {
      return res.status(400).json({ error: 'Subject, test date, and grade are required' })
    }

    const { data, error } = await supabase
      .from('tests')
      .insert({
        subject,
        chapter,
        test_date,
        grade,
        created_by: req.user.profile.id
      })
      .select(`
        *,
        creator:users!created_by(
          name,
          email
        )
      `)
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (error) {
    console.error('Create test error:', error)
    res.status(500).json({ error: 'Failed to create test' })
  }
})

// Update test (teachers/admin only)
router.put('/:id', requireTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { subject, chapter, test_date, grade } = req.body

    // Check if user owns the test or is admin
    const { data: existingTest, error: fetchError } = await supabase
      .from('tests')
      .select('created_by')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Test not found' })
      }
      throw fetchError
    }

    // Only allow update if user is admin or owns the test
    if (req.user.profile.role !== 'admin' && existingTest.created_by !== req.user.profile.id) {
      return res.status(403).json({ error: 'You can only update your own tests' })
    }

    const { data, error } = await supabase
      .from('tests')
      .update({
        subject,
        chapter,
        test_date,
        grade,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        creator:users!created_by(
          name,
          email
        )
      `)
      .single()

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Update test error:', error)
    res.status(500).json({ error: 'Failed to update test' })
  }
})

// Delete test (teachers/admin only)
router.delete('/:id', requireTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if user owns the test or is admin
    const { data: existingTest, error: fetchError } = await supabase
      .from('tests')
      .select('created_by')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Test not found' })
      }
      throw fetchError
    }

    // Only allow deletion if user is admin or owns the test
    if (req.user.profile.role !== 'admin' && existingTest.created_by !== req.user.profile.id) {
      return res.status(403).json({ error: 'You can only delete your own tests' })
    }

    const { error } = await supabase
      .from('tests')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ message: 'Test deleted successfully' })
  } catch (error) {
    console.error('Delete test error:', error)
    res.status(500).json({ error: 'Failed to delete test' })
  }
})

// Add/update test marks (teachers/admin only)
router.post('/:id/marks', requireTeacherOrAdmin, async (req, res) => {
  try {
    const { id: test_id } = req.params
    const { marks } = req.body // Array of { student_id, score, max_score }

    if (!Array.isArray(marks) || marks.length === 0) {
      return res.status(400).json({ error: 'Marks array is required' })
    }

    // Validate marks data
    for (const mark of marks) {
      if (!mark.student_id || mark.score === undefined || mark.max_score === undefined) {
        return res.status(400).json({ error: 'Each mark must have student_id, score, and max_score' })
      }
      if (mark.score < 0 || mark.max_score <= 0) {
        return res.status(400).json({ error: 'Invalid score or max_score values' })
      }
    }

    // Prepare data for upsert
    const marksData = marks.map(mark => ({
      test_id,
      student_id: mark.student_id,
      score: mark.score,
      max_score: mark.max_score
    }))

    const { data, error } = await supabase
      .from('test_marks')
      .upsert(marksData, {
        onConflict: 'test_id,student_id'
      })
      .select(`
        *,
        student:students(
          id,
          name,
          grade
        )
      `)

    if (error) throw error

    res.status(201).json(data)
  } catch (error) {
    console.error('Add test marks error:', error)
    res.status(500).json({ error: 'Failed to add test marks' })
  }
})

// Get test marks for a specific test
router.get('/:id/marks', async (req, res) => {
  try {
    const { id: test_id } = req.params
    const userRole = req.user.profile.role

    let query = supabase
      .from('test_marks')
      .select(`
        *,
        student:students(
          id,
          name,
          grade,
          parent_email
        ),
        test:tests(
          id,
          subject,
          chapter,
          test_date,
          grade
        )
      `)
      .eq('test_id', test_id)

    // Apply RLS based on user role
    if (userRole === 'parent') {
      query = query.eq('student.parent_email', req.user.email)
    } else if (userRole === 'student') {
      // Students can only see their own marks
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', req.user.id)
        .single()
      
      if (studentData) {
        query = query.eq('student_id', studentData.id)
      }
    }

    const { data, error } = await query

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Get test marks error:', error)
    res.status(500).json({ error: 'Failed to fetch test marks' })
  }
})

// Get student's test history
router.get('/student/:student_id/history', async (req, res) => {
  try {
    const { student_id } = req.params
    const userRole = req.user.profile.role

    // Check permissions
    if (userRole === 'student') {
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', req.user.id)
        .single()
      
      if (!studentData || studentData.id !== student_id) {
        return res.status(403).json({ error: 'Access denied' })
      }
    } else if (userRole === 'parent') {
      const { data: studentData } = await supabase
        .from('students')
        .select('parent_email')
        .eq('id', student_id)
        .single()
      
      if (!studentData || studentData.parent_email !== req.user.email) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    const { data, error } = await supabase
      .from('test_marks')
      .select(`
        *,
        test:tests(
          id,
          subject,
          chapter,
          test_date,
          grade
        )
      `)
      .eq('student_id', student_id)
      .order('test.test_date', { ascending: false })

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Get student test history error:', error)
    res.status(500).json({ error: 'Failed to fetch student test history' })
  }
})

export default router