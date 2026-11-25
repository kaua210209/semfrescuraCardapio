import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.warn('Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env')
}

// Este site só LÊ dados públicos (produtos e configurações). Não usa login.
export const supabase = createClient(url || 'http://localhost', key || 'missing-key', {
  auth: { persistSession: false, autoRefreshToken: false },
})
