import React, { useState } from 'react';
import { 
  Building2, 
  ChevronDown, 
  ShieldCheck, 
  UserCheck, 
  Users, 
  Sparkles,
  LogOut
} from 'lucide-react';
import GestionCuadrillaAdminModal from './GestionCuadrillaAdminModal';

export interface TenantAsignado {
  id: string;
  name: string;
  nit?: string;
  units_count?: number;
}

export default function AdminHeaderTenantSelector({
  tenantsPermitidos = [],
  tenantActivo,
  onCambiarTenant,
  adminNombre = 'Carlos Mario Pineda',
  onCerrarSesion,
  onShowToast
}: {
  tenantsPermitidos: TenantAsignado[];
  tenantActivo: TenantAsignado | null;
  onCambiarTenant: (tenant: TenantAsignado) => void;
  adminNombre?: string;
  onCerrarSesion?: () => void;
  onShowToast?: (msg: string) => void;
}) {
  const [modalCuadrillaAbierto, setModalCuadrillaAbierto] = useState(false);

  return (
    <>
      <header className="bg-[#07090e] border-b border-cyan-500/20 px-4 sm:px-6 py-3.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-slate-100 font-sans shadow-lg rounded-2xl mb-3">
        
        {/* IDENTIFICACIÓN DEL ADMINISTRADOR Y COPROPIEDADES ASIGNADAS */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest block">
                Consola de Administración PH
              </span>
              <strong className="text-sm text-white font-bold block leading-tight">
                {adminNombre}
              </strong>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block mx-1" />

          {/* SELECTOR DE CONJUNTO RESIDENCIAL ACTIVO */}
          <div className="flex items-center gap-2 bg-[#0b0f17] border border-slate-800 hover:border-cyan-500/40 p-1.5 rounded-2xl transition">
            <span className="text-[10px] font-mono text-slate-400 pl-2">Copropiedad:</span>
            <select
              value={tenantActivo?.id || ''}
              onChange={(e) => {
                const seleccionado = tenantsPermitidos.find(t => t.id === e.target.value);
                if (seleccionado) {
                  onCambiarTenant(seleccionado);
                  onShowToast?.(`🏢 Operando ahora en: ${seleccionado.name}`);
                }
              }}
              className="bg-transparent text-white font-mono text-xs font-bold outline-none cursor-pointer pr-2 py-0.5"
            >
              {tenantsPermitidos.map((tenant) => (
                <option key={tenant.id} value={tenant.id} className="bg-[#0b0f17] text-white">
                  {tenant.name} {tenant.units_count ? `(${tenant.units_count} Unid.)` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ACCIONES DEL ADMINISTRADOR SOBRE EL CONJUNTO SELECCIONADO */}
        <div className="flex items-center gap-2.5 justify-end">
          
          {/* BOTÓN PARA ASIGNAR SUPERVISOR Y CUADRILLA A ESTE CONJUNTO */}
          <button
            type="button"
            onClick={() => setModalCuadrillaAbierto(true)}
            className="bg-[#0b0f17] hover:bg-cyan-950/30 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-bold px-3.5 py-2 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-2 shadow-[0_0_12px_rgba(34,211,238,0.15)]"
          >
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Asignar Supervisor &amp; Garita</span>
          </button>

          {/* CERRAR SESIÓN */}
          <button
            type="button"
            onClick={onCerrarSesion}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-500/30"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </header>

      {/* MODAL PARA GESTIONAR SUPERVISOR, PORTERÍA Y ASEO DEL CONJUNTO SELECCIONADO */}
      {modalCuadrillaAbierto && tenantActivo && (
        <GestionCuadrillaAdminModal
          tenantId={tenantActivo.id}
          nombreConjunto={tenantActivo.name}
          onCerrar={() => setModalCuadrillaAbierto(false)}
          onShowToast={onShowToast}
        />
      )}
    </>
  );
}
