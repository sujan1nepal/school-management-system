import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Environment variables:', {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set'
  })
  throw new Error(`Missing Supabase environment variables. URL: ${supabaseUrl}, Key: ${supabaseKey ? 'Set' : 'Not set'}`)
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