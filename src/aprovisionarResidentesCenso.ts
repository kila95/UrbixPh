import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL)) ||
  'https://bhowrovxddvaykffwbbz.supabase.co';

const SUPABASE_SERVICE_ROLE_KEY = 
  (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_SERVICE_ROLE_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  ((typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY)) ||
  'sb_publishable_z3h_VaPJ1Gl7dPD9PkIPfw_MhVUQBpZ';

export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY // Llave con privilegios para crear usuarios sin enviar emails manuales
);

export async function aprovisionarResidentesCenso(unidadesCenso: any[], tenantId: string) {
  // Si se ejecuta en el navegador, primero intenta comunicarse con el backend Express
  if (typeof window !== 'undefined') {
    try {
      const res = await fetch('/api/aprovisionar-residentes-censo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unidadesCenso, tenantId })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.resultados) return data.resultados;
      }
    } catch {
      // Si el endpoint no responde, se procede directamente con supabaseAdmin
    }
  }

  const resultados = [];

  for (const unidad of unidadesCenso) {
    const rawEmail = unidad.email || '';
    const email = rawEmail.trim().toLowerCase();
    if (!email) continue;

    const cedula = String(unidad.cedula || unidad.documento || '').trim();
    const tempPassword = `Ph${cedula || '1234'}!`; // Contraseña temporal predecible para el usuario
    const unitCode = unidad.codigo || unidad.unidad || `${unidad.torre || 'T1'}-${unidad.apto || ''}`;
    const titular = unidad.titular || unidad.propietario || 'Copropietario';

    let userAuthUser: any = null;

    // 1. Crear usuario en Auth de Supabase usando admin API
    if ((supabaseAdmin.auth as any).admin?.createUser) {
      const { data: userAuth, error: authErr } = await (supabaseAdmin.auth as any).admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Queda verificado de inmediato
        user_metadata: {
          full_name: titular,
          unit_code: unitCode, // ej: T1-101
          torre: unidad.torre || unidad.torreBloque || 'Torre 1',
          apto: unidad.apto || unidad.unidad || '',
          tenant_id: tenantId,
          role: 'resident'
        }
      });

      if (authErr) {
        console.warn(`Usuario ya existía o error en ${email}:`, authErr.message);
      } else {
        userAuthUser = userAuth?.user;
      }
    } else {
      // Fallback si no está disponible auth.admin
      const { data: userAuth, error: authErr } = await supabaseAdmin.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: {
            full_name: titular,
            unit_code: unitCode,
            torre: unidad.torre || unidad.torreBloque || 'Torre 1',
            apto: unidad.apto || unidad.unidad || '',
            tenant_id: tenantId,
            role: 'resident'
          }
        }
      });

      if (authErr) {
        console.warn(`Usuario ya existía o error en ${email}:`, authErr.message);
      } else {
        userAuthUser = userAuth?.user;
      }
    }

    // 2. Asociar a la tabla profiles pública
    if (userAuthUser) {
      await supabaseAdmin.from('profiles').upsert({
        id: userAuthUser.id,
        email,
        full_name: titular,
        identification: cedula,
        phone: unidad.telefono || '',
        tenant_id: tenantId,
        unit_code: unitCode,
        role: 'resident',
        must_change_password: true
      });
    }

    resultados.push({ apto: unitCode, email, estado: 'Listo' });
  }

  return resultados;
}
