import { createClient } from '@supabase/supabase-js';

// URL y Clave pública de tu proyecto Urbix PH en Supabase
const RAW_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://bhowrovxddvaykffwbbz.supabase.co';
const RAW_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_z3h_VaPJ1Gl7dPD9PkIPfw_MhVUQBpZ';

function normalizeSupabaseBaseUrl(rawUrl?: string): string {
  const fallback = 'https://bhowrovxddvaykffwbbz.supabase.co';
  if (!rawUrl || typeof rawUrl !== 'string') return fallback;
  const trimmed = rawUrl.trim();
  if (!trimmed) return fallback;

  const dashboardMatch = trimmed.match(/supabase\.com\/dashboard\/project\/([a-z0-9-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    return parsed.origin;
  } catch {
    return fallback;
  }
}

export const SUPABASE_URL = normalizeSupabaseBaseUrl(RAW_SUPABASE_URL);
export const SUPABASE_ANON_KEY = RAW_SUPABASE_ANON_KEY.trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  !SUPABASE_URL.includes('placeholder') &&
  !SUPABASE_URL.includes('tu-proyecto') &&
  !SUPABASE_URL.includes('your-project') &&
  SUPABASE_ANON_KEY &&
  !SUPABASE_ANON_KEY.includes('placeholder') &&
  !SUPABASE_ANON_KEY.includes('tu-api-anon-key')
);

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'superadmin' | 'administrador' | 'admin' | 'supervisor' | 'vigilante' | 'operativo' | 'residente';
  tenant_id: string;
  apartment_id?: string;
  tenants?: {
    name: string;
    zone: string;
  };
  apartments?: {
    tower_apt: string;
    debt: number;
    status: string;
  };
}

export interface IniciarSesionParams {
  codigoUnidad: string;
  usuarioOApto: string;
  password: string;
  esSuperAdmin?: boolean;
  rolPreferido?: UserProfile['role'];
}

// Perfiles de demostración para fallback si las credenciales de Supabase no están configuradas
const INITIAL_DEMO_PROFILES: Record<string, UserProfile> = {
  'estebanochoamesa@gmail.com': {
    id: '58c0a2b8-92f2-42ed-9fd1-6940b26f1ca8',
    email: 'estebanochoamesa@gmail.com',
    full_name: 'Esteban SuperAdmin',
    role: 'superadmin',
    tenant_id: 't1',
    tenants: {
      name: 'Reserva del Tesoro Club House',
      zone: 'El Poblado'
    }
  },
  'superadmin@veciapp.com': {
    id: 'user-superadmin-1',
    email: 'superadmin@veciapp.com',
    full_name: 'Esteban (SuperAdmin)',
    role: 'superadmin',
    tenant_id: 't1',
    tenants: {
      name: 'Reserva del Tesoro Club House',
      zone: 'El Poblado'
    }
  },
  'admin@tesoro.veciapp.com': {
    id: 'user-admin-1',
    email: 'admin@tesoro.veciapp.com',
    full_name: 'Dra. Carolina Zuluaga (Administradora)',
    role: 'admin',
    tenant_id: 't1',
    tenants: {
      name: 'Reserva del Tesoro Club House',
      zone: 'El Poblado'
    }
  },
  'carolina.admin@veciapp.co': {
    id: 'adm-1',
    email: 'carolina.admin@veciapp.co',
    full_name: 'Dra. Carolina Zuluaga',
    role: 'admin',
    tenant_id: 't1',
    tenants: {
      name: 'Reserva del Tesoro Club House',
      zone: 'El Poblado'
    }
  },
  'contacto@laurelespark.com': {
    id: 'adm-2',
    email: 'contacto@laurelespark.com',
    full_name: 'Juan Fernando Arango',
    role: 'admin',
    tenant_id: 't2',
    tenants: {
      name: 'Bosques de la Castellana',
      zone: 'Laureles'
    }
  },
  'admin.envigado@veciapp.co': {
    id: 'adm-3',
    email: 'admin.envigado@veciapp.co',
    full_name: 'Carlos Mario Restrepo',
    role: 'admin',
    tenant_id: 't3',
    tenants: {
      name: 'Altos de Zúñiga',
      zone: 'Envigado'
    }
  },
  'porteria1@tesoro.veciapp.com': {
    id: 'user-vigilante-1',
    email: 'porteria1@tesoro.veciapp.com',
    full_name: 'Guillermo Restrepo (Guardia de Portería)',
    role: 'vigilante',
    tenant_id: 't1',
    tenants: {
      name: 'Reserva del Tesoro Club House',
      zone: 'El Poblado'
    }
  },
  'operativo@tesoro.veciapp.com': {
    id: 'user-operativo-1',
    email: 'operativo@tesoro.veciapp.com',
    full_name: 'Ing. Mateo Gómez (Supervisor de Operaciones)',
    role: 'supervisor',
    tenant_id: 't1',
    tenants: {
      name: 'Reserva del Tesoro Club House',
      zone: 'El Poblado'
    }
  },
  'supervisor@tesoro.veciapp.com': {
    id: 'user-supervisor-1',
    email: 'supervisor@tesoro.veciapp.com',
    full_name: 'Ing. Mateo Gómez (Supervisor de Operaciones)',
    role: 'supervisor',
    tenant_id: 't1',
    tenants: {
      name: 'Reserva del Tesoro Club House',
      zone: 'El Poblado'
    }
  },
  'mateo.ops@urbixph.co': {
    id: 'user-supervisor-2',
    email: 'mateo.ops@urbixph.co',
    full_name: 'Ing. Mateo Gómez (Supervisor de Operaciones)',
    role: 'supervisor',
    tenant_id: 't1',
    tenants: {
      name: 'Reserva del Tesoro Club House',
      zone: 'El Poblado'
    }
  },
  'pedro.operativo@urbix.co': {
    id: 'user-operativo-1',
    email: 'pedro.operativo@urbix.co',
    full_name: 'Pedro Gómez (Técnico Operativo / Toderos)',
    role: 'operativo',
    tenant_id: 't1',
    tenants: {
      name: 'Reserva del Tesoro Club House',
      zone: 'El Poblado'
    }
  },
  't1-302@tesoro.veciapp.com': {
    id: 'user-residente-1',
    email: 't1-302@tesoro.veciapp.com',
    full_name: 'Santiago Restrepo & Valentina Montoya',
    role: 'residente',
    tenant_id: 't1',
    apartment_id: 'apt-302',
    tenants: {
      name: 'Reserva del Tesoro Club House',
      zone: 'El Poblado'
    },
    apartments: {
      tower_apt: 'Torre 1 - 302',
      debt: 480000,
      status: 'en_mora'
    }
  }
};

export const DEMO_PROFILES: Record<string, UserProfile> = { ...INITIAL_DEMO_PROFILES };

interface StoredCustomAdmin {
  profile: UserProfile;
  password?: string;
}

// Registrar un nuevo administrador en memoria y localStorage para permitir inicio de sesión inmediato
export function registrarAdminEnDemo(profile: UserProfile, password?: string) {
  const normalizedEmail = profile.email.trim().toLowerCase();
  const normalizedProfile: UserProfile = {
    ...profile,
    email: normalizedEmail,
    role: 'admin'
  };

  DEMO_PROFILES[normalizedEmail] = normalizedProfile;
  const emailPrefix = normalizedEmail.split('@')[0];
  if (emailPrefix) {
    DEMO_PROFILES[emailPrefix] = normalizedProfile;
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored: StoredCustomAdmin[] = JSON.parse(localStorage.getItem('veciapp_custom_admins') || '[]');
      const filtered = stored.filter(
        (item) => item.profile && item.profile.email?.toLowerCase() !== normalizedEmail
      );
      filtered.unshift({ profile: normalizedProfile, password: password?.trim() });
      localStorage.setItem('veciapp_custom_admins', JSON.stringify(filtered));
    } catch {
      // Ignorar error de storage
    }
  }
}

// Cargar administradores guardados previamente en localStorage
function loadCustomAdminsFromStorage(): StoredCustomAdmin[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored: StoredCustomAdmin[] = JSON.parse(localStorage.getItem('veciapp_custom_admins') || '[]');
      stored.forEach((item) => {
        if (item.profile && item.profile.email) {
          const clean = item.profile.email.trim().toLowerCase();
          DEMO_PROFILES[clean] = { ...item.profile, role: item.profile.role || 'admin' };
          const prefix = clean.split('@')[0];
          if (prefix) {
            DEMO_PROFILES[prefix] = { ...item.profile, role: item.profile.role || 'admin' };
          }
        }
      });
      return stored;
    } catch {
      return [];
    }
  }
  return [];
}

loadCustomAdminsFromStorage();

// Buscar si el usuario corresponde a un Administrador creado o perfil registrado
function findRegisteredAdminOrDemo(cleanInput: string, emailInterno: string, password: string): UserProfile | null {
  const customAdmins = loadCustomAdminsFromStorage();
  const cleanPass = password.trim();

  // 1. Buscar primero en los administradores creados desde el panel Superadmin
  const matchedCustom = customAdmins.find((item) => {
    if (!item.profile?.email) return false;
    const itemEmail = item.profile.email.trim().toLowerCase();
    const itemPrefix = itemEmail.split('@')[0];
    const itemName = (item.profile.full_name || '').trim().toLowerCase();
    return (
      itemEmail === cleanInput ||
      itemEmail === emailInterno ||
      itemPrefix === cleanInput ||
      (itemName && itemName === cleanInput)
    );
  });

  if (matchedCustom) {
    // Si tiene contraseña guardada, validarla (permitiendo coincidencia exacta o sin distinguir mayúsculas/espacios)
    if (matchedCustom.password) {
      const expected = matchedCustom.password.trim();
      if (cleanPass !== expected && cleanPass.toLowerCase() !== expected.toLowerCase()) {
        throw new Error(`Contraseña incorrecta para ${matchedCustom.profile.full_name}. Verifica la clave asignada.`);
      }
    }
    return {
      ...matchedCustom.profile,
      role: 'admin'
    };
  }

  // 2. Buscar en DEMO_PROFILES
  const demoMatch = DEMO_PROFILES[cleanInput] || DEMO_PROFILES[emailInterno];
  if (demoMatch) {
    return demoMatch;
  }

  return null;
}

// Función de inicio de sesión por unidad o superadmin
export async function iniciarSesion({
  codigoUnidad,
  usuarioOApto,
  password,
  esSuperAdmin = false,
  rolPreferido
}: IniciarSesionParams): Promise<UserProfile> {
  const cleanInput = usuarioOApto.trim().toLowerCase();
  
  // Detección automática: si contiene '@' o es el correo de Esteban, es correo directo
  const isDirectEmail = cleanInput.includes('@') || cleanInput === 'estebanochoamesa@gmail.com';
  
  const emailInterno = isDirectEmail || esSuperAdmin
    ? cleanInput
    : `${cleanInput}@${codigoUnidad.trim().toLowerCase()}.veciapp.com`;

  const isEstebanSuperadmin = emailInterno === 'estebanochoamesa@gmail.com' || cleanInput.includes('esteban');

  // 1. Verificar primero si es un Administrador creado localmente o un perfil registrado en memoria/localStorage
  const localOrDemoProfile = findRegisteredAdminOrDemo(cleanInput, emailInterno, password);
  if (localOrDemoProfile && localOrDemoProfile.role === 'admin') {
    return localOrDemoProfile;
  }

  // Si existen credenciales reales de Supabase configuradas
  const hasRealSupabaseConfig = isSupabaseConfigured;

  if (hasRealSupabaseConfig) {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: emailInterno,
        password,
      });

      if (!authError && authData?.user) {
        // Traer el perfil y rol del usuario de forma segura
        try {
          const { data: rawProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .maybeSingle();

          if (!profileError && rawProfile) {
            if (rawProfile.role === 'superadmin' || isEstebanSuperadmin) {
              return {
                id: rawProfile.id,
                email: authData.user.email || emailInterno,
                full_name: rawProfile.full_name || 'Esteban SuperAdmin',
                role: 'superadmin',
                tenant_id: rawProfile.tenant_id || 't1',
                tenants: {
                  name: 'Reserva del Tesoro Club House',
                  zone: 'El Poblado'
                }
              };
            }

            return {
              id: rawProfile.id,
              email: authData.user.email || emailInterno,
              full_name: rawProfile.full_name || 'Usuario Urbix',
              role: rawProfile.role || localOrDemoProfile?.role || rolPreferido || 'residente',
              tenant_id: rawProfile.tenant_id || localOrDemoProfile?.tenant_id || 't1',
              apartment_id: rawProfile.apartment_id,
              tenants: localOrDemoProfile?.tenants || {
                name: 'Reserva del Tesoro Club House',
                zone: 'El Poblado'
              },
              apartments: {
                tower_apt: rawProfile.username || 'Torre 1 - 302',
                debt: 0,
                status: 'al_dia'
              }
            };
          }
        } catch (err) {
          console.warn('Error al consultar tabla user_profiles:', err);
        }

        if (localOrDemoProfile) {
          return localOrDemoProfile;
        }

        return {
          id: authData.user.id,
          email: authData.user.email || emailInterno,
          full_name: isEstebanSuperadmin ? 'Esteban SuperAdmin' : (authData.user.email?.split('@')[0] || 'Usuario Urbix'),
          role: isEstebanSuperadmin ? 'superadmin' : (rolPreferido || 'admin'),
          tenant_id: 't1',
          tenants: {
            name: 'Reserva del Tesoro Club House',
            zone: 'El Poblado'
          }
        };
      } else if (authError) {
        console.warn('Supabase Auth fallback activado:', authError.message);
      }
    } catch (err: unknown) {
      console.warn('Fallback local activado tras excepción en Supabase:', err);
    }
  }

  // Fallback Inteligente para Administradores Creados, Cuentas Demo y Pruebas en Vivo
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Validaciones de contraseña
  if (!password || password.trim().length < 3) {
    throw new Error('La contraseña debe tener al menos 4 caracteres.');
  }

  // Si es Esteban
  if (isEstebanSuperadmin) {
    return DEMO_PROFILES['estebanochoamesa@gmail.com'];
  }

  // Si coincide con algún perfil demo o administrador registrado
  if (localOrDemoProfile) {
    return localOrDemoProfile;
  }

  // Inferencia inteligente por prefijo, correo o rol seleccionado
  let detectedRole: UserProfile['role'] = rolPreferido || 'residente';
  let fullName = `Usuario (${cleanInput})`;

  if (cleanInput.includes('superadmin') || cleanInput.includes('esteban')) {
    detectedRole = 'superadmin';
    fullName = 'Esteban SuperAdmin';
  } else if (cleanInput.includes('supervisor') || cleanInput.includes('mateo') || cleanInput.includes('operativo') || cleanInput.includes('todero') || rolPreferido === 'supervisor' || rolPreferido === 'operativo') {
    detectedRole = 'supervisor';
    fullName = `Ing. Mateo Gómez (Supervisor - ${codigoUnidad.toUpperCase()})`;
  } else if (cleanInput.includes('admin') || cleanInput.includes('gerencia') || rolPreferido === 'admin' || rolPreferido === 'administrador') {
    detectedRole = 'administrador';
    const namePart = cleanInput.split('@')[0].replace(/[._-]/g, ' ');
    fullName = `Dra. Carolina Zuluaga (${namePart.charAt(0).toUpperCase() + namePart.slice(1)})`;
  } else if (cleanInput.includes('porteria') || cleanInput.includes('guarda') || cleanInput.includes('vigilante') || rolPreferido === 'vigilante') {
    detectedRole = 'vigilante';
    fullName = `Guarda de Portería (${codigoUnidad.toUpperCase()})`;
  } else {
    detectedRole = 'residente';
    fullName = `Residente (${cleanInput.toUpperCase()})`;
  }

  return {
    id: `user-${Date.now()}`,
    email: emailInterno,
    full_name: fullName,
    role: detectedRole,
    tenant_id: 't1',
    tenants: {
      name: codigoUnidad === 'tesoro' ? 'Reserva del Tesoro Club House' : `Condominio ${codigoUnidad.toUpperCase()}`,
      zone: 'Medellín'
    },
    apartments: {
      tower_apt: cleanInput.toUpperCase(),
      debt: detectedRole === 'residente' ? 480000 : 0,
      status: detectedRole === 'residente' ? 'en_mora' : 'al_dia'
    }
  };
}

// Cargar perfil de usuario de forma segura desde Supabase sin romper por claves foráneas nulas
export async function loadUserProfileFromSupabase(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data: rawProfile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error || !rawProfile) return null;

    let tenantData: { name: string; zone: string } | undefined = undefined;
    if (rawProfile.tenant_id) {
      const { data: tData } = await supabase
        .from('tenants')
        .select('name, zone')
        .eq('id', rawProfile.tenant_id)
        .maybeSingle();
      if (tData) {
        tenantData = { name: tData.name, zone: tData.zone || 'Medellín' };
      }
    }

    let aptData: { tower_apt: string; debt: number; status: string } | undefined = undefined;
    if (rawProfile.apartment_id) {
      const { data: aData } = await supabase
        .from('apartments')
        .select('tower_apt, debt, status')
        .eq('id', rawProfile.apartment_id)
        .maybeSingle();
      if (aData) {
        aptData = {
          tower_apt: aData.tower_apt,
          debt: aData.debt || 0,
          status: aData.status || 'al_dia'
        };
      }
    }

    return {
      id: rawProfile.id,
      email: rawProfile.username || 'usuario@veciapp.com',
      full_name: rawProfile.full_name || 'Usuario',
      role: rawProfile.role || 'residente',
      tenant_id: rawProfile.tenant_id || 'tenant-1',
      apartment_id: rawProfile.apartment_id,
      tenants: tenantData || { name: 'Altos del Poblado Club House', zone: 'El Poblado' },
      apartments: aptData
    };
  } catch (err) {
    console.warn('Error loading user profile from Supabase:', err);
    return null;
  }
}
