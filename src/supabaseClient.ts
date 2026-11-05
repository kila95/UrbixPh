import { createClient } from '@supabase/supabase-js';

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
  SUPABASE_ANON_KEY &&
  !SUPABASE_ANON_KEY.includes('placeholder')
);

export const DEFAULT_TENANT_UUID = '22079bb5-6ac7-4a15-be89-c53d14e4221b';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(value?: string | null): boolean {
  return Boolean(value && UUID_REGEX.test(value.trim()));
}

export function normalizeTenantUuid(tenantId?: string | null): string {
  if (tenantId && isValidUuid(tenantId)) {
    return tenantId.trim();
  }
  return DEFAULT_TENANT_UUID;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'superadmin' | 'saas_master_owner' | 'master_owner' | 'administrador' | 'admin' | 'admin_ph' | 'supervisor' | 'vigilante' | 'porteria' | 'operativo' | 'residente';
  tenant_id: string;
  apartment_id?: string;
  unit_number?: string;
  coefficient?: number;
  tenants?: {
    id?: string;
    name: string;
    zone: string;
  };
  apartments?: {
    id?: string;
    tower_apt: string;
    debt: number;
    status: string;
  };
}

export interface IniciarSesionParams {
  codigoUnidad?: string;
  usuarioOApto: string;
  password: string;
}

/**
 * Consulta y normaliza el perfil real desde `user_profiles` en Supabase
 */
export async function loadUserProfileFromSupabase(userId: string): Promise<UserProfile> {
  const { data: rawProfile, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !rawProfile) {
    throw new Error(`Perfil no encontrado en base de datos: ${profileError?.message || 'Sin registro'}`);
  }

  let tenantData: { id?: string; name: string; zone: string } | undefined = undefined;
  if (rawProfile.tenant_id) {
    const { data: tData } = await supabase
      .from('tenants')
      .select('id, name, zone')
      .eq('id', rawProfile.tenant_id)
      .maybeSingle();

    if (tData) {
      tenantData = { id: tData.id, name: tData.name, zone: tData.zone || 'Medellín' };
    }
  }

  let aptData: { id?: string; tower_apt: string; debt: number; status: string } | undefined = undefined;
  if (rawProfile.apartment_id) {
    const { data: aData } = await supabase
      .from('apartments')
      .select('id, tower_apt, debt, status')
      .eq('id', rawProfile.apartment_id)
      .maybeSingle();

    if (aData) {
      aptData = {
        id: aData.id,
        tower_apt: aData.tower_apt,
        debt: aData.debt || 0,
        status: aData.status || 'al_dia'
      };
    }
  }

  return {
    id: rawProfile.id,
    email: rawProfile.email || rawProfile.username || '',
    full_name: rawProfile.full_name || 'Usuario Urbix PH',
    role: rawProfile.role,
    tenant_id: rawProfile.tenant_id,
    apartment_id: rawProfile.apartment_id,
    unit_number: rawProfile.unit_number || aptData?.tower_apt,
    coefficient: rawProfile.coefficient || 0,
    tenants: tenantData,
    apartments: aptData
  };
}

/**
 * Autenticación 100% Real mediante Supabase Auth
 * Erradicación total de credenciales locales en texto plano y accesos simulados
 */
export async function iniciarSesion({
  codigoUnidad,
  usuarioOApto,
  password
}: IniciarSesionParams): Promise<UserProfile> {
  const cleanInput = usuarioOApto.trim().toLowerCase();

  // Si no es un email estándar, se estructura con el subdominio de la copropiedad
  const emailAuth = cleanInput.includes('@')
    ? cleanInput
    : `${cleanInput}@${(codigoUnidad || 'urbix').trim().toLowerCase()}.urbixph.co`;

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: emailAuth,
    password: password.trim()
  });

  if (authError || !authData?.user) {
    throw new Error(authError?.message || 'Credenciales de acceso inválidas en el sistema.');
  }

  return await loadUserProfileFromSupabase(authData.user.id);
}

export async function cerrarSesionReal(): Promise<void> {
  await supabase.auth.signOut();
}
