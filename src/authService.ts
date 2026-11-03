import { supabase } from './supabaseClient';

export interface RegistrarAdminParams {
  nombre: string;
  email: string;
  telefono: string;
  cedula: string;
  empresa: string;
  nitEmpresa: string;
  tenantId?: string | null;
}

export async function registrarAdministradorPermanente(datos: RegistrarAdminParams) {
  const emailNormalizado = datos.email.trim().toLowerCase();

  // 1. Invocar función de creación o registro
  // Si usas Supabase Auth Admin (recomendado para no desloguear tu sesión actual):
  try {
    const { data: authData, error: authError } = await supabase.functions.invoke('crear-admin-saas', {
      body: {
        email: emailNormalizado,
        nombre: datos.nombre,
        empresa: datos.empresa,
        role: 'admin'
      }
    });

    if (authError) {
      console.warn('Aviso invocando crear-admin-saas:', authError.message);
    }
  } catch (err: any) {
    console.warn('Función crear-admin-saas no disponible aún, procediendo con upsert directo:', err?.message);
  }

  // O si insertas directamente en la tabla profiles mientras configuras Edge Functions:
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        email: emailNormalizado,
        full_name: datos.nombre,
        phone: datos.telefono,
        identification: datos.cedula,
        company_name: datos.empresa,
        company_nit: datos.nitEmpresa,
        role: 'admin',
        is_active: true,
        deleted_at: null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' })
      .select()
      .single();

    if (!profileError && profileData) {
      return profileData;
    }

    if (profileError) {
      console.warn('Detalle en upsert de profile directo con onConflict email, intentando formato estándar:', profileError.message);
    }
  } catch (err: any) {
    console.warn('Error en primer intento de upsert:', err?.message);
  }

  // Fallback estándar si las columnas company_nit o updated_at varían en el esquema actual
  const { data: fallbackData, error: fallbackError } = await supabase
    .from('profiles')
    .upsert({
      email: emailNormalizado,
      full_name: datos.nombre,
      phone: datos.telefono,
      identification: datos.cedula,
      company_name: datos.empresa,
      nit: datos.nitEmpresa,
      role: 'admin_ph',
      tenant_id: datos.tenantId || null
    })
    .select()
    .single();

  if (fallbackError) {
    console.error('Error final en upsert de profile:', fallbackError.message);
    throw fallbackError;
  }

  return fallbackData;
}

export async function desactivarUsuarioSeguro(usuarioId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({
      is_active: false,
      deleted_at: new Date().toISOString()
    })
    .eq('id', usuarioId);

  if (error) throw error;
}
