import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wbrjptxnkobrywlrbplg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicmpwdHhua29icnl3bHJicGxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczODU4NjQsImV4cCI6MjA1Mjk2MTg2NH0.oA_UoN9Q6JJHpSZC9Zg8M-YWsR4GRwcefIAvHE_3iWU'

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials in environment variables');
}


export const supabase = createClient(supabaseUrl, supabaseAnonKey)