import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, tempPassword, role, companyName, fullName } = await req.json();

    if (!email || !tempPassword) {
      throw new Error("El correo y la contraseña temporal son obligatorios.");
    }

    // Cliente administrativo con SERVICE_ROLE_KEY para crear usuarios en auth.users
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Crear el usuario en auth.users con contraseña ya confirmada
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: tempPassword,
      email_confirm: true, // Queda verificado de inmediato
      user_metadata: {
        role: role || 'administrador',
        full_name: fullName,
        company_name: companyName,
      },
    });

    if (authError) throw authError;

    // 2. Asociar el rol en la tabla staff_assignments
    await supabaseAdmin.from('staff_assignments').insert({
      user_id: authUser.user.id,
      role: role || 'administrador',
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: authUser.user.id,
        email: authUser.user.email,
        tempPassword 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
