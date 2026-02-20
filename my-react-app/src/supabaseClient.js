import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://gprmtqximfxtrtowwkbe.supabase.co"
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdwcm10cXhpbWZ4dHJ0b3d3a2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMjkxNjIsImV4cCI6MjA4NTgwNTE2Mn0.w57uoczQssetsINBnEXoL43sdPC_4uvF5Cc9I-Ht1do"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
