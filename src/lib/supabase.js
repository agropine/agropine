import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uuflnhsbctfwappzenyy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZmxuaHNiY3Rmd2FwcHplbnl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUwMjUxNTMsImV4cCI6MjA4MDYwMTE1M30.Xml0YfX3Fy9-lHYqe8zPwEBESuxPqL1iH422T-nHXQM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export default supabase;
