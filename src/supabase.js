import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://uwahsicprzdvosudqcvf.supabase.co'
const supabaseKey = 'sb_publishable_CMeez3pblobWpsjATSvX2Q_mHcjrwB4'

export const supabase = createClient(supabaseUrl, supabaseKey)