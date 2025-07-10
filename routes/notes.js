import express from 'express'
import { supabase } from '../lib/supabase.js'
import { requireAuth, requireTeacherOrAdmin } from '../middleware/auth.js'

const router = express.Router()

// Apply auth middleware to all routes
router.use(requireAuth)

// Get all notes
router.get('/', async (req, res) => {
  try {
    const { grade, subject, chapter } = req.query

    let query = supabase
      .from('notes')
      .select(`
        *,
        uploader:users!uploaded_by(
          name,
          email
        )
      `)

    // Apply filters
    if (grade) {
      query = query.eq('grade', grade)
    }
    if (subject) {
      query = query.eq('subject', subject)
    }
    if (chapter) {
      query = query.eq('chapter', chapter)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Get notes error:', error)
    res.status(500).json({ error: 'Failed to fetch notes' })
  }
})

// Get note by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        uploader:users!uploaded_by(
          name,
          email
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Note not found' })
      }
      throw error
    }

    res.json(data)
  } catch (error) {
    console.error('Get note error:', error)
    res.status(500).json({ error: 'Failed to fetch note' })
  }
})

// Create new note (teachers/admin only)
router.post('/', requireTeacherOrAdmin, async (req, res) => {
  try {
    const { title, file_url, grade, subject, chapter } = req.body

    if (!title || !grade || !subject) {
      return res.status(400).json({ error: 'Title, grade, and subject are required' })
    }

    const { data, error } = await supabase
      .from('notes')
      .insert({
        title,
        file_url,
        grade,
        subject,
        chapter,
        uploaded_by: req.user.profile.id
      })
      .select(`
        *,
        uploader:users!uploaded_by(
          name,
          email
        )
      `)
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (error) {
    console.error('Create note error:', error)
    res.status(500).json({ error: 'Failed to create note' })
  }
})

// Update note (teachers/admin only)
router.put('/:id', requireTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { title, file_url, grade, subject, chapter } = req.body

    // Check if user owns the note or is admin
    const { data: existingNote, error: fetchError } = await supabase
      .from('notes')
      .select('uploaded_by')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Note not found' })
      }
      throw fetchError
    }

    // Only allow update if user is admin or owns the note
    if (req.user.profile.role !== 'admin' && existingNote.uploaded_by !== req.user.profile.id) {
      return res.status(403).json({ error: 'You can only update your own notes' })
    }

    const { data, error } = await supabase
      .from('notes')
      .update({
        title,
        file_url,
        grade,
        subject,
        chapter,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        uploader:users!uploaded_by(
          name,
          email
        )
      `)
      .single()

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Update note error:', error)
    res.status(500).json({ error: 'Failed to update note' })
  }
})

// Delete note (teachers/admin only)
router.delete('/:id', requireTeacherOrAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if user owns the note or is admin
    const { data: existingNote, error: fetchError } = await supabase
      .from('notes')
      .select('uploaded_by')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Note not found' })
      }
      throw fetchError
    }

    // Only allow deletion if user is admin or owns the note
    if (req.user.profile.role !== 'admin' && existingNote.uploaded_by !== req.user.profile.id) {
      return res.status(403).json({ error: 'You can only delete your own notes' })
    }

    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)

    if (error) throw error

    res.json({ message: 'Note deleted successfully' })
  } catch (error) {
    console.error('Delete note error:', error)
    res.status(500).json({ error: 'Failed to delete note' })
  }
})

// Get unique grades
router.get('/meta/grades', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('grade')
      .order('grade')

    if (error) throw error

    const uniqueGrades = [...new Set(data.map(item => item.grade))].filter(Boolean)
    res.json(uniqueGrades)
  } catch (error) {
    console.error('Get grades error:', error)
    res.status(500).json({ error: 'Failed to fetch grades' })
  }
})

// Get unique subjects for a grade
router.get('/meta/subjects', async (req, res) => {
  try {
    const { grade } = req.query

    let query = supabase
      .from('notes')
      .select('subject')

    if (grade) {
      query = query.eq('grade', grade)
    }

    query = query.order('subject')

    const { data, error } = await query

    if (error) throw error

    const uniqueSubjects = [...new Set(data.map(item => item.subject))].filter(Boolean)
    res.json(uniqueSubjects)
  } catch (error) {
    console.error('Get subjects error:', error)
    res.status(500).json({ error: 'Failed to fetch subjects' })
  }
})

// Get unique chapters for a grade and subject
router.get('/meta/chapters', async (req, res) => {
  try {
    const { grade, subject } = req.query

    let query = supabase
      .from('notes')
      .select('chapter')

    if (grade) {
      query = query.eq('grade', grade)
    }
    if (subject) {
      query = query.eq('subject', subject)
    }

    query = query.order('chapter')

    const { data, error } = await query

    if (error) throw error

    const uniqueChapters = [...new Set(data.map(item => item.chapter))].filter(Boolean)
    res.json(uniqueChapters)
  } catch (error) {
    console.error('Get chapters error:', error)
    res.status(500).json({ error: 'Failed to fetch chapters' })
  }
})

export default router