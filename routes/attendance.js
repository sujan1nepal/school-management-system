import express from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth, requireTeacherOrAdmin } from '../middleware/auth.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(requireAuth)

// Get attendance records
router.get('/', async (req, res) => {
  try {
    const { student_id, date, grade } = req.query
    const userRole = req.user.profile.role

    let query = supabase
      .from('attendance')
      .select(`
        *,
        student:students(
          id,
          name,
          grade,
          parent_email
        )
      `)

    // Apply filters
    if (student_id) {
      query = query.eq('student_id', student_id)
    }
    if (date) {
      query = query.eq('date', date)
    }

    // Filter by grade if provided
    if (grade) {
      query = query.eq('student.grade', grade)
    }

    // Apply RLS based on user role
    if (userRole === 'parent') {
      query = query.eq('student.parent_email', req.user.email)
    } else if (userRole === 'student') {
      // Students can only see their own attendance
      const { data: studentData } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', req.user.id)
        .single()
      
      if (studentData) {
        query = query.eq('student_id', studentData.id)
      }
    }

    query = query.order('date', { ascending: false })

    const { data, error } = await query

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Get attendance error:', error)
    res.status(500).json({ error: 'Failed to fetch attendance records' })
  }
})

// Mark attendance (teachers/admin only)
router.post('/', requireTeacherOrAdmin, async (req, res) => {
  try {
    const { student_id, date, status } = req.body

    if (!student_id || !date || !status) {
      return res.status(400).json({ error: 'Student ID, date, and status are required' })
    }

    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({ error: 'Status must be either "present" or "absent"' })
    }

    // Use upsert to handle duplicate entries
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        student_id,
        date,
        status
      }, {
        onConflict: 'student_id,date'
      })
      .select(`
        *,
        student:students(
          id,
          name,
          grade
        )
      `)
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (error) {
    console.error('Mark attendance error:', error)
    res.status(500).json({ error: 'Failed to mark attendance' })
  }
})

// Bulk mark attendance (teachers/admin only)
router.post('/bulk', requireTeacherOrAdmin, async (req, res) => {
  try {
    const { attendance_records } = req.body

    if (!Array.isArray(attendance_records) || attendance_records.length === 0) {
      return res.status(400).json({ error: 'Attendance records array is required' })
    }

    // Validate each record
    for (const record of attendance_records) {
      if (!record.student_id || !record.date || !record.status) {
        return res.status(400).json({ error: 'Each record must have student_id, date, and status' })
      }
      if (!['present', 'absent'].includes(record.status)) {
        return res.status(400).json({ error: 'Status must be either "present" or "absent"' })
      }
    }

    const { data, error } = await supabase
      .from('attendance')
      .upsert(attendance_records, {
        onConflict: 'student_id,date'
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
    console.error('Bulk mark attendance error:', error)
    res.status(500).json({ error: 'Failed to mark bulk attendance' })
  }
})

// Get attendance summary for a date range
router.get('/summary', requireTeacherOrAdmin, async (req, res) => {
  try {
    const { start_date, end_date, grade } = req.query

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' })
    }

    let query = supabase
      .from('attendance')
      .select(`
        status,
        student:students(
          id,
          name,
          grade
        )
      `)
      .gte('date', start_date)
      .lte('date', end_date)

    if (grade) {
      query = query.eq('student.grade', grade)
    }

    const { data, error } = await query

    if (error) throw error

    // Process data to create summary
    const summary = data.reduce((acc, record) => {
      const studentId = record.student.id
      if (!acc[studentId]) {
        acc[studentId] = {
          student: record.student,
          present: 0,
          absent: 0,
          total: 0
        }
      }
      acc[studentId][record.status]++
      acc[studentId].total++
      return acc
    }, {})

    res.json(Object.values(summary))
  } catch (error) {
    console.error('Get attendance summary error:', error)
    res.status(500).json({ error: 'Failed to fetch attendance summary' })
  }
})

// Update attendance record (teachers/admin only)
router.put('/:id', requireTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !['present', 'absent'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' })
    }

    const { data, error } = await supabase
      .from('attendance')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        student:students(
          id,
          name,
          grade
        )
      `)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Attendance record not found' })
      }
      throw error
    }

    res.json(data)
  } catch (error) {
    console.error('Update attendance error:', error)
    res.status(500).json({ error: 'Failed to update attendance' })
  }
})

// Delete attendance record (teachers/admin only)
router.delete('/:id', requireTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ message: 'Attendance record deleted successfully' })
  } catch (error) {
    console.error('Delete attendance error:', error)
    res.status(500).json({ error: 'Failed to delete attendance record' })
  }
})

export default router