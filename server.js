import 'dotenv/config'
import express from 'express'
import cors from 'cors'

// Import routes
import authRoutes from './routes/auth.js'
import studentsRoutes from './routes/students.js'
import attendanceRoutes from './routes/attendance.js'
import notesRoutes from './routes/notes.js'
import testsRoutes from './routes/tests.js'

const app = express()

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(express.json())

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/students', studentsRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/notes', notesRoutes)
app.use('/api/tests', testsRoutes)

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'School Management System API is running',
    database: 'Supabase PostgreSQL',
    version: '2.0.0'
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Database: Supabase PostgreSQL`)
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`)
})