import React, { useState } from 'react';
import { 
  Crown, ShieldCheck, UserCheck, HardHat, 
  ChevronDown, AlertCircle, Building2, LogOut 
} from 'lucide-react';
import { UrbixLogoMark } from './UrbixLogo';

export type HierarchyRole = 'superadmin' | 'administrador' | 'supervisor';

export interface HierarchyTenantOption {
  id: string;
  name: string;
  nit?: string;
  zone?: string;
  city?: string;
  units?: number;
}

export interface AdminHeaderWithHierarchyProps {
  currentTenant?: string | HierarchyTenantOption;
  tenants?: HierarchyTenantOption[];
  onTenantChange?: (tenantIdOrName: string) => void;
  currentUserRole?: HierarchyRole;
  onRoleChange?: (role: HierarchyRole) => void;
  isReemplazoActivo?: boolean;
  onToggleReemplazo?: (active: boolean) => void;
  onLogout?: () => void;
}

export default function AdminHeaderWithHierarchy({
  currentTenant = 'Edificio Reserva del Tesoro P.H.',
  tenants = [
    { id: 't1', name: 'Edificio Reserva del Tesoro P.H.', zone: 'El Poblado, Medellín' },
    { id: 't2', name: 'Conjunto Residencial Bosques de San Lucas', zone: 'Envigado' },
    { id: 't3', name: 'Torres de la Castellana P.H.', zone: 'Laureles, Medellín' }
  ],
  onTenantChange,
  currentUserRole: controlledRole,
  onRoleChange,
  isReemplazoActivo: controlledReemplazo,
  onToggleReemplazo,
  onLogout
}: AdminHeaderWithHierarchyProps) {
  // Simulador de usuario actual (puedes cambiarlo para probar cada rol)
  const [internalRole, setInternalRole] = useState<HierarchyRole>('supervisor');
  const [internalReemplazo, setInternalReemplazo] = useState<boolean>(false);

  const currentUserRole = controlledRole !== undefined ? controlledRole : internalRole;
  const isReemplazoActivo = controlledReemplazo !== undefined ? controlledReemplazo : internalReemplazo;

  const handleRoleSelect = (newRole: HierarchyRole) => {
    setInternalRole(newRole);
    if (newRole !== 'supervisor') {
      setInternalReemplazo(false);
      onToggleReemplazo?.(false);
    }
    onRoleChange?.(newRole);
  };

  const handleToggleReemplazo = () => {
    const nextValue = !isReemplazoActivo;
    setInternalReemplazo(nextValue);
    onToggleReemplazo?.(nextValue);
  };

  // Configuración visual según el rango en la jerarquía
  const roleConfig: Record<
    HierarchyRole,
    {
      label: string;
      desc: string;
      icon: React.ComponentType<{ className?: string }>;
      badgeColor: string;
    }
  > = {
    superadmin: {
      label: 'Superadministrador',
      desc: 'Control Total de la Firma y Software',
      icon: Crown,
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
    },
    administrador: {
      label: 'Administrador Titular',
      desc: 'Representante Legal de la Copropiedad',
      icon: ShieldCheck,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    },
    supervisor: {
      label: 'Supervisor de Operaciones',
      desc: 'Auditoría en Sitio y Suplencia Delegada',
      icon: UserCheck,
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    }
  };

  const currentConfig = roleConfig[currentUserRole];
  const RoleIcon = currentConfig.icon;

  const selectedTenantValue =
    typeof currentTenant === 'string'
      ? currentTenant
      : currentTenant?.id || tenants[0]?.id || 't1';

  const currentTenantName =
    typeof currentTenant === 'string'
      ? tenants.find((t) => t.id === currentTenant || t.name === currentTenant)?.name || currentTenant
      : currentTenant?.name || tenants[0]?.name || 'Edificio Reserva del Tesoro P.H.';

  return (
    <div className="bg-slate-900 border-b border-slate-800">
      {/* BARRA PRINCIPAL DE JERARQUÍA Y CONTROL */}
      <div className="px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Lado Izquierdo: Identidad de la Copropiedad y Rango Activo */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <UrbixLogoMark className="w-10 h-10 shrink-0 drop-shadow-md" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base font-black text-white">
                  Urbi<span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">x</span> PH
                </h1>
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${currentConfig.badgeColor}`}>
                  <RoleIcon className="w-3.5 h-3.5" />
                  {currentConfig.label}
                </span>
                {currentUserRole === 'supervisor' && isReemplazoActivo && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 shadow-sm">
                    <ShieldCheck className="w-3 h-3" /> Suplencia Activa
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {currentConfig.desc} • <span className="text-slate-200 font-semibold">{currentTenantName}</span>
              </p>
            </div>
          </div>

          {/* Selector de Copropiedad (Multi-Tenant) */}
          {tenants.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <select
                value={selectedTenantValue}
                onChange={(e) => onTenantChange?.(e.target.value)}
                aria-label="Seleccionar copropiedad"
                className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer pr-2 py-0.5"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                    {t.name}{t.zone ? ` (${t.zone})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Lado Derecho: Selector de Rango (Para pruebas) y Botón de Relevo */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Selector para cambiar de vista según la jerarquía */}
          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Jerarquía:</span>
            <select 
              value={currentUserRole}
              onChange={(e) => handleRoleSelect(e.target.value as HierarchyRole)}
              className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
            >
              <option value="superadmin" className="bg-slate-900">1. Superadministrador (Gerencia)</option>
              <option value="administrador" className="bg-slate-900">2. Administrador Titular</option>
              <option value="supervisor" className="bg-slate-900">3. Supervisor Operativo</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          </div>

          {/* BOTÓN EXCLUSIVO DEL SUPERVISOR: ACTIVAR MODO REEMPLAZO */}
          {currentUserRole === 'supervisor' && (
            <button
              type="button"
              onClick={handleToggleReemplazo}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                isReemplazoActivo 
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20' 
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-amber-500/30'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              {isReemplazoActivo 
                ? 'Modo Relevo ACTIVO (Actuando como Administrador)' 
                : 'Activar Reemplazo del Administrador'}
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-bold transition border border-slate-700 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Salir
            </button>
          )}
        </div>
      </div>

      {/* FRANJA DE AUDITORÍA DE SUPLENCIA / RELEVO CUANDO EL SUPERVISOR ACTIVA EL REEMPLAZO */}
      {currentUserRole === 'supervisor' && isReemplazoActivo && (
        <div className="bg-emerald-500/10 border-t border-emerald-500/20 px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-300 font-semibold">
            <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>MODO RELEVO DELEGADO ACTIVO:</strong> El Supervisor de Operaciones cuenta temporalmente con las facultades del Administrador Titular en <strong>{currentTenantName}</strong> (Expedición de Paz y Salvos, Respuesta Oficial PQRSD y Autorización SG-SST).
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
            Trazabilidad Ley 675 Activa
          </span>
        </div>
      )}
    </div>
  );
}
