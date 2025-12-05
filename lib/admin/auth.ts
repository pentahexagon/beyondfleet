import { supabase } from '@/lib/supabase/client'

const ADMIN_EMAIL = 'coinkim00@gmail.com'

export async function checkAdminAccess(): Promise<{ isAdmin: boolean; user: any | null }> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { isAdmin: false, user: null }
  }

  // Check if user email is the admin email
  if (user.email === ADMIN_EMAIL) {
    return { isAdmin: true, user }
  }

  // Also check role in profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') {
    return { isAdmin: true, user }
  }

  return { isAdmin: false, user }
}

export function isAdminEmail(email: string | undefined): boolean {
  return email === ADMIN_EMAIL
}
