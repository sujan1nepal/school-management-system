/*
  # School Management System Database Schema

  1. New Tables
    - `users` - System users (admin, teacher, parent, student)
    - `students` - Student information
    - `attendance` - Student attendance records
    - `notes` - Study materials and notes
    - `tests` - Test/exam records
    - `test_marks` - Individual student test scores

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access control
    - Secure authentication using Supabase Auth

  3. Features
    - Automatic timestamps
    - Foreign key relationships
    - Proper indexing for performance
*/

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'teacher', 'parent', 'student')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  grade text NOT NULL,
  parent_email text,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, date)
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  file_url text,
  grade text NOT NULL,
  subject text NOT NULL,
  chapter text,
  uploaded_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tests table
CREATE TABLE IF NOT EXISTS tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  chapter text,
  test_date date NOT NULL,
  grade text NOT NULL,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create test_marks table
CREATE TABLE IF NOT EXISTS test_marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  score numeric(5,2) NOT NULL CHECK (score >= 0),
  max_score numeric(5,2) NOT NULL CHECK (max_score > 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(test_id, student_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_notes_grade_subject ON notes(grade, subject);
CREATE INDEX IF NOT EXISTS idx_tests_date ON tests(test_date);
CREATE INDEX IF NOT EXISTS idx_test_marks_test_student ON test_marks(test_id, student_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_marks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for students table
CREATE POLICY "Admins and teachers can read all students"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Parents can read their children"
  ON students
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'parent' 
      AND email = students.parent_email
    )
  );

CREATE POLICY "Students can read own data"
  ON students
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage students"
  ON students
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_user_id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for attendance table
CREATE POLICY "Teachers and admins can manage attendance"
  ON attendance
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Parents can view their children's attendance"
  ON attendance
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN students s ON s.parent_email = u.email
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'parent'
      AND s.id = attendance.student_id
    )
  );

CREATE POLICY "Students can view own attendance"
  ON attendance
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.user_id = auth.uid() AND s.id = attendance.student_id
    )
  );

-- RLS Policies for notes table
CREATE POLICY "Everyone can read notes"
  ON notes
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers and admins can manage notes"
  ON notes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- RLS Policies for tests table
CREATE POLICY "Everyone can read tests"
  ON tests
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers and admins can manage tests"
  ON tests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- RLS Policies for test_marks table
CREATE POLICY "Teachers and admins can manage test marks"
  ON test_marks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_user_id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "Parents can view their children's marks"
  ON test_marks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN students s ON s.parent_email = u.email
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'parent'
      AND s.id = test_marks.student_id
    )
  );

CREATE POLICY "Students can view own marks"
  ON test_marks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.user_id = auth.uid() AND s.id = test_marks.student_id
    )
  );

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tests_updated_at
  BEFORE UPDATE ON tests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();