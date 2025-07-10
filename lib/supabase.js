import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Environment variables:', {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set'
  })
  throw new Error(`Missing Supabase environment variables. URL: ${supabaseUrl}, Key: ${supabaseKey ? 'Set' : 'Not set'}`)
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  console.error('Invalid Supabase URL format:', supabaseUrl)
  throw new Error(`Invalid SUPABASE_URL format. Expected a valid URL like 'https://your-project-ref.supabase.co', got: ${supabaseUrl}`)
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Helper function to get user profile
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_user_id', userId)
    .single()
  
  if (error) throw error
  return data
}

// Helper function to check user role
export const checkUserRole = async (requiredRole) => {
  const user = await getCurrentUser()
  if (!user) throw new Error('Not authenticated')
  
  const profile = await getUserProfile(user.id)
  return profile.role === requiredRole || profile.role === 'admin'
}