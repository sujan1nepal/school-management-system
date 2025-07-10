# School Management System - Backend

A modern school management system backend built with Node.js, Express, and Supabase.

## Features

- **Authentication & Authorization**: Secure user authentication with role-based access control
- **Student Management**: Complete CRUD operations for student records
- **Attendance Tracking**: Mark and track student attendance with bulk operations
- **Notes Management**: Upload and manage study materials by grade, subject, and chapter
- **Test Management**: Create tests and manage student scores
- **Real-time Database**: PostgreSQL with Supabase for reliable data storage
- **Row Level Security**: Database-level security policies for data protection

## User Roles

- **Admin**: Full system access
- **Teacher**: Manage students, attendance, notes, and tests
- **Parent**: View their children's data (attendance, marks, notes)
- **Student**: View own attendance, marks, and notes

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Security**: Row Level Security (RLS) policies

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Supabase**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Update the `.env` file with your Supabase credentials

3. **Environment Variables**
   ```env
   VITE_SUPABASE_URL=your_supabase_url_here
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   FRONTEND_URL=http://localhost:3000
   PORT=4000
   ```

4. **Database Setup**
   - The migration file will automatically create all necessary tables
   - Run the migration in your Supabase SQL editor
   - Tables include: users, students, attendance, notes, tests, test_marks

5. **Start the Server**
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

### Students
- `GET /api/students` - Get all students (admin/teacher)
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create new student (admin/teacher)
- `PUT /api/students/:id` - Update student (admin/teacher)
- `DELETE /api/students/:id` - Delete student (admin/teacher)

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Mark attendance (admin/teacher)
- `POST /api/attendance/bulk` - Bulk mark attendance (admin/teacher)
- `GET /api/attendance/summary` - Get attendance summary (admin/teacher)

### Notes
- `GET /api/notes` - Get all notes
- `GET /api/notes/:id` - Get note by ID
- `POST /api/notes` - Create new note (admin/teacher)
- `PUT /api/notes/:id` - Update note (admin/teacher)
- `DELETE /api/notes/:id` - Delete note (admin/teacher)

### Tests
- `GET /api/tests` - Get all tests
- `GET /api/tests/:id` - Get test by ID
- `POST /api/tests` - Create new test (admin/teacher)
- `PUT /api/tests/:id` - Update test (admin/teacher)
- `DELETE /api/tests/:id` - Delete test (admin/teacher)
- `POST /api/tests/:id/marks` - Add/update test marks (admin/teacher)
- `GET /api/tests/:id/marks` - Get test marks

## Security Features

- **Row Level Security**: Database-level access control
- **Role-based Authorization**: Different permissions for each user role
- **JWT Authentication**: Secure token-based authentication via Supabase
- **Input Validation**: Server-side validation for all endpoints
- **CORS Protection**: Configured for specific frontend origins

## Database Schema

### Users Table
- Extends Supabase auth.users with additional profile information
- Stores user roles and metadata

### Students Table
- Student information with grade and parent contact details
- Links to user accounts for student login

### Attendance Table
- Daily attendance records with date and status
- Unique constraint on student_id and date

### Notes Table
- Study materials organized by grade, subject, and chapter
- File URLs for document storage

### Tests Table
- Test information with subject, date, and grade
- Links to creator (teacher/admin)

### Test Marks Table
- Individual student scores for each test
- Stores both score and maximum possible score

## Migration from MongoDB

This version migrates from the previous MongoDB-based system to Supabase PostgreSQL, providing:

- Better performance and reliability
- Built-in authentication and authorization
- Real-time capabilities
- Automatic backups and scaling
- SQL-based queries with better type safety

## Development

The system is designed with modularity and scalability in mind:

- **Middleware**: Authentication and role-based access control
- **Routes**: Organized by feature with proper error handling
- **Database**: Normalized schema with proper relationships
- **Security**: Multiple layers of protection including RLS policies

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.