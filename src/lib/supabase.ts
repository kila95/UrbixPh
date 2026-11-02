import { createClient } from '@supabase/supabase-js';

// URL y Clave pública de tu proyecto Urbix PH en Supabase
export const SUPABASE_URL = 'https://bhowrovxddvaykffwbbz.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_z3h_VaPJ1Gl7dPD9PkIPfw_MhVUQBpZ';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
