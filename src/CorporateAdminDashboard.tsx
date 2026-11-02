import React, { useState } from 'react';
import {
  Building2, ChevronDown, Check, LayoutGrid,
  DollarSign, AlertTriangle, Users, ArrowUpRight,
  ShieldCheck, Search, Filter, Plus, HardHat
} from 'lucide-react';
import AdminConsoleView from './AdminConsoleView';
import TenantSwitcher, { AssignedTenantItem } from './TenantSwitcher';
import ContractorsModule from './ContractorsModule';
import type { GuardIncidentReport, CommonAreaReservation, ResidentialTenant } from './App';
import type { UserProfile } from './supabaseClient';

export interface AssignedTenantSummary {
  id: string;
  name: string;
  zone: string;
  units: number;
  recaudo: number;
  moraTotal: number;
  novedades: number;
}

export interface CorporateAdminDashboardProps {
  userProfile?: UserProfile | null;
  adminName?: string;
  tenants?: ResidentialTenant[];
  selectedTenantId?: string;
  onSelectTenant?: (tenantId: string) => void;
  guardIncidents?: GuardIncidentReport[];
  reservations?: CommonAreaReservation[];
  onAssignIncident?: (id: string, assignedTo: string) => void;
  onUpdateIncidentStatus?: (id: string, status: GuardIncidentReport['status'], note?: string) => void;
  onAdminReservationDecision?: (id: string, decision: 'Aprobada' | 'Rechazada') => void;
  onOpenCreateTenantModal?: () => void;
  onShowToast?: (msg: string) => void;
}

export default function CorporateAdminDashboard({
  userProfile,
  adminName,
  tenants = [],
  guardIncidents = [],
  reservations = [],
  onSelectTenant,
  onAssignIncident,
  onUpdateIncidentStatus,
  onAdminReservationDecision,
  onOpenCreateTenantModal,
  onShowToast
}: CorporateAdminDashboardProps) {
  // Lista base de copropiedades asignadas a este administrador / firma gestora
  const [baseAssignedTenants] = useState<AssignedTenantSummary[]>([
    { id: 't1', name: 'Reserva del Tesoro', zone: 'El Poblado', units: 120, recaudo: 94, moraTotal: 6850000, novedades: 2 },
    { id: 't2', name: 'Bosques de la Castellana', zone: 'Laureles', units: 85, recaudo: 88, moraTotal: 9200000, novedades: 5 },
    { id: 't3', name: 'Altos de San Lucas', zone: 'El Poblado', units: 64, recaudo: 97, moraTotal: 2100000, novedades: 0 },
    { id: 't4', name: 'Terrazas de Envigado', zone: 'Envigado', units: 110, recaudo: 91, moraTotal: 12400000, novedades: 3 }
  ]);

  // Copropiedades obtenidas desde la relación PostgREST admin_tenant_assignments -> tenants:tenant_id
  const [dbAssignedTenants, setDbAssignedTenants] = useState<AssignedTenantItem[] | null>(null);

  // Incorporar también cualquier copropiedad nueva registrada por el administrador en sesión
  const extraTenants: AssignedTenantSummary[] = tenants
    .filter((t) => !baseAssignedTenants.some((b) => b.id === t.id))
    .map((t) => ({
      id: t.id,
      name: t.name,
      zone: t.zone,
      units: t.units,
      recaudo: 95,
      moraTotal: 1500000,
      novedades: guardIncidents.filter((g) => g.tenantId === t.id && g.status !== 'Solucionado' && g.status !== 'Resuelto').length
    }));

  const defaultMergedTenants: AssignedTenantSummary[] = [...baseAssignedTenants, ...extraTenants];

  // Si admin_tenant_assignments devolvió copropiedades específicas desde Supabase, enriquecerlas con métricas operativas
  const assignedTenants: AssignedTenantSummary[] = dbAssignedTenants && dbAssignedTenants.length > 0
    ? dbAssignedTenants.map((dbItem, idx) => {
        const match = defaultMergedTenants.find((m) => m.id === dbItem.id || m.name.toLowerCase() === dbItem.name.toLowerCase());
        return match
          ? { ...match, id: dbItem.id, name: dbItem.name, zone: dbItem.zone }
          : {
              id: dbItem.id,
              name: dbItem.name,
              zone: dbItem.zone || 'Medellín',
              units: 90 + idx * 15,
              recaudo: 93,
              moraTotal: 3400000,
              novedades: guardIncidents.filter((g) => g.tenantId === dbItem.id && g.status !== 'Solucionado' && g.status !== 'Resuelto').length
            };
      })
    : defaultMergedTenants;

  // Tenant seleccionado actualmente ('t1' abre directamente la Consola de Gestión de la copropiedad principal; 'all' muestra el consolidado de la firma)
  const [activeTenantId, setActiveTenantId] = useState<string>('t1');
  const [corporateViewTab, setCorporateViewTab] = useState<'overview' | 'contractors'>('overview');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  // Totales agregados de la firma gestora
  const totalCarteraMora = assignedTenants.reduce((acc, curr) => acc + curr.moraTotal, 0);
  const totalUnidades = assignedTenants.reduce((acc, curr) => acc + curr.units, 0);
  const promedioRecaudo = assignedTenants.length > 0
    ? Math.round(assignedTenants.reduce((acc, curr) => acc + curr.recaudo, 0) / assignedTenants.length)
    : 0;
  const totalNovedades = assignedTenants.reduce((acc, curr) => acc + curr.novedades, 0);

  const currentTenant = assignedTenants.find((t) => t.id === activeTenantId) || assignedTenants[0];

  const handleSwitchTenant = (id: string) => {
    setActiveTenantId(id);
    setDropdownOpen(false);
    if (id !== 'all' && onSelectTenant) {
      onSelectTenant(id);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 space-y-6 rounded-3xl border border-slate-800">
      
      {/* ========================================================
          BARRA DE CONTEXTO CORPORATIVO & SWITCHER DE UNIDADES
         ======================================================== */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Firma Administradora
              </span>
              <span className="text-xs text-slate-500">•</span>
              <span className="text-xs text-slate-400">Mundo Horizontal S.A.S.</span>
              {(userProfile?.full_name || adminName) && (
                <>
                  <span className="text-xs text-slate-600">•</span>
                  <span className="text-xs text-slate-300 font-semibold">{userProfile?.full_name || adminName}</span>
                </>
              )}
            </div>
            <h2 className="text-xl font-black text-white">Panel de Control Multirresidencial</h2>
          </div>
        </div>

        {/* ACCIÓN DE AUTOGESTIÓN + SELECTOR RELACIONAL SUPABASE (TENANT SWITCHER) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenCreateTenantModal && (
            <button
              type="button"
              onClick={onOpenCreateTenantModal}
              className="px-3.5 py-2.5 bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Registrar Copropiedad</span>
            </button>
          )}

          {/* Selector Relacional PostgREST (admin_tenant_assignments -> tenants:tenant_id) */}
          <TenantSwitcher
            userProfile={userProfile}
            selectedTenantId={activeTenantId}
            onSelectTenant={handleSwitchTenant}
            onTenantsLoaded={(loaded) => setDbAssignedTenants(loaded)}
            fallbackTenants={defaultMergedTenants.map((t) => ({ id: t.id, name: t.name, zone: t.zone }))}
          />
        </div>
      </div>

      {/* ========================================================
          VISTA 1: CONSOLIDADO GENERAL (TODAS LAS COPROPIEDADES)
         ======================================================== */}
      {activeTenantId === 'all' ? (
        <div className="space-y-6">
          {/* Sub-pestañas Corporativas: Consolidado Financiero vs Proveedores Homologados SG-SST */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setCorporateViewTab('overview')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                corporateViewTab === 'overview'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Consolidado de Copropiedades ({assignedTenants.length})
            </button>
            <button
              type="button"
              onClick={() => setCorporateViewTab('contractors')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                corporateViewTab === 'contractors'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <HardHat className="w-4 h-4" /> Contratistas & Obras SG-SST (Homologados Firma)
            </button>
          </div>

          {corporateViewTab === 'contractors' ? (
            <ContractorsModule
              tenantName="Portafolio Corporativo Mundo Horizontal"
              onShowToast={onShowToast}
            />
          ) : (
            <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Unidades Administradas</span>
              <p className="text-2xl font-black text-white mt-1">{assignedTenants.length} Copropiedades</p>
              <p className="text-xs text-slate-400 mt-2">{totalUnidades} apartamentos bajo contrato</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recaudo Promedio</span>
              <p className="text-2xl font-black text-emerald-400 mt-1">{promedioRecaudo}%</p>
              <p className="text-xs text-emerald-500/80 mt-2 font-medium">Meta corporativa cumplida (&gt;85%)</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cartera en Mora Global</span>
              <p className="text-2xl font-black text-rose-400 mt-1">${(totalCarteraMora / 1000000).toFixed(2)}M</p>
              <p className="text-xs text-slate-400 mt-2">Acumulado en los {assignedTenants.length} conjuntos</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Incidencias de Ronda</span>
              <p className="text-2xl font-black text-amber-400 mt-1">{totalNovedades} Pendientes</p>
              <p className="text-xs text-slate-400 mt-2">Reportadas por portería</p>
            </div>
          </div>

          {/* TABLA COMPARATIVA DE CONJUNTOS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" /> Comparativo de Cartera y Operación
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-3">Copropiedad</th>
                    <th className="p-3">Sector</th>
                    <th className="p-3">Inmuebles</th>
                    <th className="p-3">% Recaudo</th>
                    <th className="p-3">Mora Acumulada</th>
                    <th className="p-3">Novedades</th>
                    <th className="p-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {assignedTenants.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-bold text-white">{t.name}</td>
                      <td className="p-3 text-slate-400">{t.zone}</td>
                      <td className="p-3">{t.units}</td>
                      <td className="p-3 font-bold text-emerald-400">{t.recaudo}%</td>
                      <td className="p-3 text-rose-400 font-bold">${(t.moraTotal / 1000000).toFixed(2)}M</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.novedades > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {t.novedades} activas
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleSwitchTenant(t.id)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                        >
                          Gestionar <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
            </>
          )}
        </div>
      ) : (
        /* ========================================================
            VISTA 2: GESTIÓN ESPECÍFICA DE LA UNIDAD SELECCIONADA
           ======================================================== */
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Copropiedad en Foco</span>
              <h3 className="text-xl font-black text-white">{currentTenant?.name}</h3>
              <p className="text-xs text-slate-400">
                {currentTenant?.zone} • {currentTenant?.units} Inmuebles registrados • Recaudo actual: <strong className="text-emerald-400">{currentTenant?.recaudo}%</strong>
              </p>
            </div>
            {assignedTenants.length > 1 && (
              <button
                type="button"
                onClick={() => handleSwitchTenant('all')}
                className="px-3.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer self-start sm:self-auto"
              >
                ← Volver al Consolidado
              </button>
            )}
          </div>

          {/* Consola individual de la copropiedad seleccionada (Ley 675) */}
          <AdminConsoleView
            currentTenant={currentTenant}
            userProfile={userProfile}
            tenantName={currentTenant?.name || 'Reserva del Tesoro'}
            adminName={userProfile?.full_name || adminName}
            guardIncidents={guardIncidents}
            reservations={reservations}
            onAssignIncident={onAssignIncident}
            onUpdateIncidentStatus={onUpdateIncidentStatus}
            onAdminReservationDecision={onAdminReservationDecision}
            onOpenCreateTenantModal={onOpenCreateTenantModal}
            onShowToast={onShowToast}
          />
        </div>
      )}

    </div>
  );
}
