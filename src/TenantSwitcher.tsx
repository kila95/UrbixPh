import React, { useState, useEffect } from 'react';
import { supabase, UserProfile } from './supabaseClient';

export interface AssignedTenantItem {
  id: string;
  name: string;
  zone: string;
}

interface AdminTenantAssignmentRow {
  tenant_id: string;
  tenants: AssignedTenantItem | AssignedTenantItem[] | null;
}

export interface TenantSwitcherProps {
  userProfile?: UserProfile | null;
  selectedTenantId?: string;
  onSelectTenant?: (tenantId: string) => void;
  onTenantsLoaded?: (tenants: AssignedTenantItem[]) => void;
  fallbackTenants?: AssignedTenantItem[];
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === 'string' && msg.trim().length > 0) return msg;
  }
  if (typeof err === 'string' && err.trim().length > 0) return err;
  return 'Error de conexión con el servidor';
}

export default function TenantSwitcher({
  userProfile,
  selectedTenantId: controlledTenantId,
  onSelectTenant,
  onTenantsLoaded,
  fallbackTenants = []
}: TenantSwitcherProps) {
  const [assignedTenants, setAssignedTenants] = useState<AssignedTenantItem[]>(fallbackTenants);
  const [loadedFromDb, setLoadedFromDb] = useState<boolean>(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(controlledTenantId || 'all');
  const [loadingTenants, setLoadingTenants] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Sincronizar con prop controlada desde el dashboard padre si cambia externamente
  useEffect(() => {
    if (controlledTenantId !== undefined && controlledTenantId !== selectedTenantId) {
      setSelectedTenantId(controlledTenantId);
    }
  }, [controlledTenantId]);

  // Mantener sincronizadas las copropiedades locales cuando se crean nuevas en sesión
  useEffect(() => {
    if (!loadedFromDb && fallbackTenants.length > 0) {
      setAssignedTenants(fallbackTenants);
    }
  }, [fallbackTenants, loadedFromDb]);

  useEffect(() => {
    let isMounted = true;

    const applyFallbackTenants = () => {
      if (!isMounted) return;
      setLoadedFromDb(false);
      if (fallbackTenants.length > 0) {
        setAssignedTenants(fallbackTenants);
        onTenantsLoaded?.(fallbackTenants);
        if (fallbackTenants.length === 1) {
          const singleId = fallbackTenants[0].id;
          setSelectedTenantId(singleId);
          onSelectTenant?.(singleId);
        }
      } else if (userProfile?.tenant_id && userProfile?.tenants) {
        const singleFallback: AssignedTenantItem[] = [
          {
            id: userProfile.tenant_id,
            name: userProfile.tenants.name,
            zone: userProfile.tenants.zone
          }
        ];
        setAssignedTenants(singleFallback);
        onTenantsLoaded?.(singleFallback);
        setSelectedTenantId(singleFallback[0].id);
        onSelectTenant?.(singleFallback[0].id);
      }
    };

    async function fetchAssignedTenants() {
      if (!userProfile?.id) {
        applyFallbackTenants();
        if (isMounted) setLoadingTenants(false);
        return;
      }

      if (isMounted) {
        setLoadingTenants(true);
        setFetchError(null);
      }

      const hasRealSupabaseConfig = Boolean(
        import.meta.env.VITE_SUPABASE_URL &&
        !import.meta.env.VITE_SUPABASE_URL.includes('placeholder') &&
        import.meta.env.VITE_SUPABASE_ANON_KEY &&
        !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('placeholder')
      );

      const hasValidUuid = UUID_REGEX.test(userProfile.id);

      try {
        if (hasRealSupabaseConfig && hasValidUuid) {
          // Consulta relacional con PostgREST / Supabase
          const { data, error } = await supabase
            .from('admin_tenant_assignments')
            .select(`
              tenant_id,
              tenants:tenant_id (
                id,
                name,
                zone
              )
            `)
            .eq('user_id', userProfile.id);

          if (!error && data && data.length > 0) {
            const rawRows = data as unknown as AdminTenantAssignmentRow[];
            const tenantsList: AssignedTenantItem[] = rawRows
              .map((item) => (Array.isArray(item.tenants) ? item.tenants[0] : item.tenants))
              .filter((t): t is AssignedTenantItem => Boolean(t && t.id && t.name));

            if (tenantsList.length > 0 && isMounted) {
              setLoadedFromDb(true);
              setAssignedTenants(tenantsList);
              onTenantsLoaded?.(tenantsList);

              if (tenantsList.length === 1) {
                const singleId = tenantsList[0].id;
                setSelectedTenantId(singleId);
                onSelectTenant?.(singleId);
              }
              return;
            }
          }
        }

        // Respaldo automático cuando la tabla relacional aún no tiene registros o el usuario está en modo demo
        applyFallbackTenants();
      } catch (err: unknown) {
        const message = extractErrorMessage(err);
        if (fallbackTenants.length > 0 || (userProfile?.tenant_id && userProfile?.tenants)) {
          applyFallbackTenants();
        } else if (isMounted) {
          setFetchError(`No se pudieron obtener las copropiedades asignadas (${message}).`);
        }
      } finally {
        if (isMounted) {
          setLoadingTenants(false);
        }
      }
    }

    fetchAssignedTenants();

    return () => {
      isMounted = false;
    };
  }, [userProfile?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedTenantId(newId);
    onSelectTenant?.(newId);
  };

  if (loadingTenants) {
    return (
      <div className="text-xs text-slate-400 animate-pulse p-2">
        Cargando copropiedades asignadas...
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-xs text-rose-400 p-2">
        {fetchError}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selectedTenantId}
        onChange={handleChange}
        className="bg-slate-950 border border-slate-800 text-white text-xs font-bold p-2.5 rounded-xl outline-none focus:border-emerald-500 transition cursor-pointer"
      >
        {assignedTenants.length > 1 && (
          <option value="all">📊 Vista Consolidada ({assignedTenants.length})</option>
        )}
        {assignedTenants.map((t) => (
          <option key={t.id} value={t.id}>
            🏢 {t.name} ({t.zone})
          </option>
        ))}
      </select>
    </div>
  );
}
