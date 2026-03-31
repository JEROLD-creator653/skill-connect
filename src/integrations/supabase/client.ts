import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ylrhqgcfuqgokemgpocs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlscmhxZ2NmdXFnb2tlbWdwb2NzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5NzkzMDgsImV4cCI6MjA5MDU1NTMwOH0.Nwjioj74LHk4Fu9lpFsJNB7MLmo5asxoARj1R279OnE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
