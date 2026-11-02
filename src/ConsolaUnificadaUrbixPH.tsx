import React, { useState } from 'react';
import {
  Building2, FileText, HardHat, DollarSign,
  Wrench, Calendar, MessageSquare, ShieldCheck, Plus, Camera, AlertCircle, Search, LogOut
} from 'lucide-react';
import type { GuardIncidentReport, CommonAreaReservation } from './App';
import type { UserProfile } from './supabaseClient';
import ContractorsModule from './ContractorsModule';
import MeetingMinutesModule from './MeetingMinutesModule';
import SeccionGestionPersonalAdmin from './SeccionGestionPersonalAdmin';

export interface ConsolaUnificadaUrbixPHProps {
  currentTenant?: { id?: string; name?: string; zone?: string; units?: number; recaudo?: number } | null;
  userProfile?: UserProfile | null;
  tenantName?: string;
  adminName?: string;
  guardIncidents?: GuardIncidentReport[];
  reservations?: CommonAreaReservation[];
  onAssignIncident?: (id: string, assignedTo: string) => void;
  onUpdateIncidentStatus?: (id: string, status: GuardIncidentReport['status'], note?: string) => void;
  onAdminReservationDecision?: (id: string, decision: 'Aprobada' | 'Rechazada') => void;
  onOpenCreateTenantModal?: () => void;
  onCerrarSesion?: () => void;
  onShowToast?: (msg: string) => void;
}

export default function ConsolaUnificadaUrbixPH({
  currentTenant,
  userProfile,
  tenantName,
  adminName,
  guardIncidents = [],
  onAssignIncident,
  onUpdateIncidentStatus,
  onOpenCreateTenantModal,
  onCerrarSesion,
  onShowToast
}: ConsolaUnificadaUrbixPHProps) {
  // Las 7 pestañas limpias de la Consola de Gestión (Imagen 2) que absorben los 10 módulos de la Imagen 1
  const [activeTab, setActiveTab] = useState<'general' | 'actas' | 'contractors' | 'cartera' | 'mantenimiento' | 'reservas' | 'pqrs'>('general');
  const [searchQuery, setSearchQuery] = useState('');

  const resolvedTenantName = currentTenant?.name || tenantName || 'P.H. Reserva del Tesoro';
  const resolvedAdminName = userProfile?.full_name || adminName || 'Esteban Ochoa';

  // Datos consolidados de Cartera (Integra Módulos 3 y 4: Tesorería y Cartera Ley 675)
  const [apartments, setApartments] = useState([
    { id: '101', torre: '1', apto: '101', propietario: 'Mateo Zuluaga', saldo: 0, estado: 'Al día', coeficiente: '0.82%' },
    { id: '102', torre: '1', apto: '102', propietario: 'Carolina Herrera', saldo: 420000, estado: 'En mora', coeficiente: '0.82%' },
    { id: '201', torre: '1', apto: '201', propietario: 'Andrés Gómez', saldo: 1260000, estado: 'Cobro jurídico', coeficiente: '0.95%' },
    { id: '302', torre: '1', apto: '302', propietario: 'Esteban Ochoa', saldo: 0, estado: 'Al día', coeficiente: '1.05%' },
  ]);

  // Datos consolidados de Mantenimiento y Staff Operativo (Integra Módulos 5 y 6)
  const [reports, setReports] = useState([
    { id: 'rep-1', area: 'Sótano 1', categoria: 'Iluminación', detalle: 'Balasto quemado lámpara salida parqueadero', prioridad: 'Media', asignado: 'Pedro (Todero)', estado: 'En proceso' },
    { id: 'rep-2', area: 'Piscina', categoria: 'Motobombas', detalle: 'Ruido anormal en motor de recirculación', prioridad: 'Alta', asignado: 'Contratista Hidráulico', estado: 'Pendiente' }
  ]);

  // Reservas de áreas comunes con validación de Paz y Salvo y Depósito ($100.000 COP)
  const [localReservations, setLocalReservations] = useState([
    { id: 'res-1', zona: 'Salón Social', apto: 'Torre 1 - 302', residente: 'Esteban Ochoa', fecha: 'Sábado 31 Oct - 6:00 PM', deposito: 100000, pazYSalvo: true, estado: 'Aprobada' },
    { id: 'res-2', zona: 'Zona BBQ', apto: 'Torre 1 - 102', residente: 'Carolina Herrera', fecha: 'Domingo 1 Nov - 1:00 PM', deposito: 100000, pazYSalvo: false, estado: 'Bloqueado por mora' },
    { id: 'res-3', zona: 'Cancha Sintética', apto: 'Torre 1 - 101', residente: 'Mateo Zuluaga', fecha: 'Domingo 1 Nov - 4:00 PM', deposito: 100000, pazYSalvo: true, estado: 'Pendiente aprobación' }
  ]);

  // Datos consolidados de PQRS (Integra Módulo 8: PQRSD Ley 1755)
  const [pqrsList, setPqrsList] = useState([
    { id: 'pqr-1', radicado: 'RAD-2026-0841', apto: 'Torre 2 - 301', tipo: 'Reclamo Técnico (10 días hábiles)', asunto: 'Filtración de humedad en cielo raso', estado: 'En término legal' }
  ]);

  const [isCircularOpen, setIsCircularOpen] = useState(false);
  const [circularTitle, setCircularTitle] = useState('');
  const [circularBody, setCircularBody] = useState('');

  const combinedReports = [
    ...guardIncidents.map((inc) => ({
      id: inc.id,
      area: inc.location || 'Área General',
      categoria: inc.category || 'General',
      detalle: inc.desc || inc.title || '',
      prioridad: (inc.category || '').includes('Seguridad') || (inc.category || '').includes('Daño') ? 'Alta' : 'Media',
      asignado: inc.assignedTo || 'Pedro (Todero)',
      estado:
        inc.status === 'Solucionado' || inc.status === 'Resuelto'
          ? 'Solucionado'
          : inc.status === 'En Proceso' || inc.status === 'En Revisión'
          ? 'En proceso'
          : 'Pendiente',
      photoUrl: inc.photoUrl,
      isLiveGuardIncident: true
    })),
    ...reports
  ];

  const filteredApartments = apartments.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.apto.toLowerCase().includes(q) ||
      a.propietario.toLowerCase().includes(q) ||
      `torre ${a.torre}`.includes(q) ||
      a.estado.toLowerCase().includes(q)
    );
  });

  const handleEmitCircular = (e: React.FormEvent) => {
    e.preventDefault();
    if (!circularTitle.trim()) return;
    setPqrsList((prev) => [
      {
        id: `pqr-${Date.now()}`,
        radicado: `RAD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        apto: 'Todas las Torres',
        tipo: 'Circular Oficial Ley 675',
        asunto: `${circularTitle.trim()}: ${circularBody.trim() || 'Comunicado oficial de administración'}`,
        estado: 'Publicada ✓'
      },
      ...prev
    ]);
    setCircularTitle('');
    setCircularBody('');
    setIsCircularOpen(false);
    onShowToast?.('📢 Circular oficial emitida a toda la copropiedad');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col rounded-3xl border border-slate-800 overflow-hidden">
      
      {/* BARRA SUPERIOR INSTITUCIONAL (Imagen 2) */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20 shrink-0">
              U
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-black text-white leading-tight">Urbix • Consola de Gestión</h1>
                <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                  LEY 675
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {resolvedTenantName} • Admin: {resolvedAdminName}
              </p>
            </div>
          </div>

          {onOpenCreateTenantModal && (
            <button
              type="button"
              onClick={onOpenCreateTenantModal}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-emerald-500/30 text-emerald-400 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 xl:hidden"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Unidad
            </button>
          )}
        </div>

        {/* NAVEGACIÓN PRINCIPAL UNIFICADA (7 PESTAÑAS LIMPIAS) */}
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 xl:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'general' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 text-emerald-400" /> General
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('actas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'actas' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-blue-400" /> Actas &amp; Consejo
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('contractors')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'contractors' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-400 hover:text-white'
            }`}
          >
            <HardHat className="w-4 h-4" /> Contratistas &amp; Obras
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cartera')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'cartera' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" /> Cartera
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mantenimiento')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'mantenimiento' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-4 h-4 text-amber-400" /> Mantenimiento
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reservas')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'reservas' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4 text-purple-400" /> Áreas Comunes
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pqrs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === 'pqrs' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" /> PQRS
          </button>

          {onCerrarSesion && (
            <button
              type="button"
              onClick={onCerrarSesion}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 hover:text-white transition whitespace-nowrap cursor-pointer shadow-[0_0_15px_rgba(244,63,94,0.15)] ml-2"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" /> Cerrar Sesión
            </button>
          )}
        </nav>
      </header>

      {/* CONTENIDO DINÁMICO SEGÚN LA PESTAÑA */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* 1. GENERAL (Macro-Salud PH y SaaS & MRR) */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-bold text-slate-400">Salud Financiera PH</span>
                <p className="text-2xl font-black text-emerald-400 mt-1">94.5% Óptimo</p>
                <p className="text-[11px] text-slate-400 mt-2">Macro-Salud multi-tenant activa</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-bold text-slate-400">Recaudo del Mes</span>
                <p className="text-2xl font-black text-white mt-1">$48.5M / $52M</p>
                <p className="text-[11px] text-emerald-400 mt-2">93.3% cumplimiento</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <span className="text-xs font-bold text-slate-400">SaaS MRR (Plataforma)</span>
                <p className="text-2xl font-black text-blue-400 mt-1">$1.380.000 COP</p>
                <p className="text-[11px] text-slate-400 mt-2">3 Copropiedades suscritas</p>
              </div>
            </div>

            {/* Resumen ejecutivo rápido con accesos directos a las pestañas unificadas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" /> Cartera Crítica / Cobro Prejurídico (Ley 675)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cartera')}
                    className="text-xs text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    Ver cartera →
                  </button>
                </div>
                <div className="space-y-2">
                  {apartments.filter((a) => a.saldo > 0).map((a) => (
                    <div key={a.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white">Torre {a.torre} - Apto {a.apto}</span>
                        <p className="text-slate-400">{a.propietario}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-rose-400">${a.saldo.toLocaleString('es-CO')}</p>
                        <span className="text-[10px] text-slate-500 uppercase">{a.estado}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-amber-400" /> Órdenes de Mantenimiento &amp; SG-SST
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('actas')}
                      className="text-xs text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      Libro de Actas →
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('contractors')}
                      className="text-xs text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      Contratistas SG-SST →
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  {combinedReports.slice(0, 3).map((r) => (
                    <div key={r.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs gap-2">
                      <div>
                        <span className="font-bold text-white">{r.area} • {r.categoria}</span>
                        <p className="text-slate-400">{r.detalle}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded border shrink-0 ${
                        r.estado === 'Solucionado'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {r.estado}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* SECCIÓN DE GESTIÓN DE PERSONAL, SUPERVISORES Y VIGILANTES */}
            <SeccionGestionPersonalAdmin onShowToast={onShowToast} />
          </div>
        )}

        {/* 2. ACTAS & CONSEJO (Asambleas, Bóveda SHA-256 y Ley 675) */}
        {activeTab === 'actas' && (
          <MeetingMinutesModule
            tenantId={currentTenant?.id || 't1'}
            tenantName={resolvedTenantName}
            onShowToast={onShowToast}
          />
        )}

        {/* 3. CONTRATISTAS & OBRAS (Obras & SG-SST, Pólizas RCE y ARL) */}
        {activeTab === 'contractors' && (
          <ContractorsModule
            tenantName={resolvedTenantName}
            onShowToast={onShowToast}
          />
        )}

        {/* 4. CARTERA (Tesorería y Cartera Ley 675) */}
        {activeTab === 'cartera' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white">Tesorería y Cartera Ordinaria / Extraordinaria (Ley 675)</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar unidad o propietario..."
                    className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => onShowToast?.('📄 Cuentas de cobro mensuales generadas conforme a Ley 675')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" /> Generar Cobros
                </button>
              </div>
            </div>

            <div className="overflow-x-auto bg-slate-900 border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                  <tr>
                    <th className="p-3.5">Unidad</th>
                    <th className="p-3.5">Propietario</th>
                    <th className="p-3.5">Coeficiente</th>
                    <th className="p-3.5">Saldo Cartera</th>
                    <th className="p-3.5">Estado</th>
                    <th className="p-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {filteredApartments.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-800/30">
                      <td className="p-3.5 font-bold text-white">Torre {a.torre} - {a.apto}</td>
                      <td className="p-3.5">{a.propietario}</td>
                      <td className="p-3.5 font-mono">{a.coeficiente}</td>
                      <td className="p-3.5 font-black text-white">${a.saldo.toLocaleString('es-CO')}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.saldo === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {a.estado}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {a.saldo === 0 ? (
                          <button
                            type="button"
                            onClick={() => onShowToast?.(`✅ Certificado de Paz y Salvo emitido para Torre ${a.torre} - ${a.apto}`)}
                            className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer"
                          >
                            Emitir Paz y Salvo
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setApartments((prev) =>
                                prev.map((item) =>
                                  item.id === a.id ? { ...item, saldo: 0, estado: 'Al día' } : item
                                )
                              );
                              onShowToast?.(`💳 Pago aplicado a Torre ${a.torre} - ${a.apto}. Unidad a Paz y Salvo.`);
                            }}
                            className="text-[11px] font-bold text-amber-400 hover:underline cursor-pointer"
                          >
                            Registrar Pago
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. MANTENIMIENTO (Nómina Staff, Toderos y Órdenes de Trabajo) */}
        {activeTab === 'mantenimiento' && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white">Órdenes de Mantenimiento y Staff Operativo</h3>
            <div className="grid grid-cols-1 gap-3">
              {combinedReports.map((r) => (
                <div key={r.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-white text-sm">{r.area} • {r.categoria}</span>
                    <p className="text-xs text-slate-300 mt-1">{r.detalle}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Asignado a: <strong className="text-teal-400">{r.asignado}</strong></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={r.estado}
                      onChange={(e) => {
                        const nextStatus = e.target.value;
                        if ((r as any).isLiveGuardIncident && onUpdateIncidentStatus) {
                          onUpdateIncidentStatus(r.id, nextStatus);
                        } else {
                          setReports((prev) =>
                            prev.map((item) => (item.id === r.id ? { ...item, estado: nextStatus } : item))
                          );
                          onShowToast?.(`🔧 Estado actualizado a: ${nextStatus}`);
                        }
                      }}
                      className="text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 outline-none cursor-pointer"
                    >
                      <option value="Pendiente" className="bg-slate-900 text-slate-200">Pendiente</option>
                      <option value="En proceso" className="bg-slate-900 text-amber-400">En proceso</option>
                      <option value="Solucionado" className="bg-slate-900 text-emerald-400">Solucionado</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            {/* GESTIÓN DE PERSONAL Y NÓMINA STAFF EN PESTAÑA DE MANTENIMIENTO */}
            <SeccionGestionPersonalAdmin onShowToast={onShowToast} />
          </div>
        )}

        {/* 6. ÁREAS COMUNES (Reservas y Depósitos) */}
        {activeTab === 'reservas' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-white">Gestión de Áreas Comunes y Depósitos de Garantía ($100.000 COP)</h3>
              <p className="text-xs text-slate-400">Control de reservas para Salón Social, Zona BBQ y Cancha Sintética con validación automática de paz y salvo en cartera.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {localReservations.map((res) => (
                <div key={res.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-black text-white text-sm">{res.zona}</h4>
                        <p className="text-xs text-slate-400">{res.apto} • {res.residente}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                        res.pazYSalvo ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {res.pazYSalvo ? 'Paz y Salvo ✓' : 'En Mora ✕'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-mono mt-2">📅 {res.fecha}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Depósito Garantía: <strong className="text-emerald-400">${res.deposito.toLocaleString('es-CO')} COP</strong></p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Estado: <strong className="text-white">{res.estado}</strong></span>
                    {res.pazYSalvo && res.estado !== 'Aprobada ✓' && (
                      <button
                        type="button"
                        onClick={() => {
                          setLocalReservations((prev) =>
                            prev.map((item) => (item.id === res.id ? { ...item, estado: 'Aprobada ✓' } : item))
                          );
                          onShowToast?.(`✅ Reserva de ${res.zona} aprobada para ${res.apto}`);
                        }}
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer"
                      >
                        Aprobar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. PQRS (PQRSD Ley 1755 y Reloj Legal) */}
        {activeTab === 'pqrs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Bandeja PQRSD (Ley 1755 y Ley 675)</h3>
              <button
                type="button"
                onClick={() => setIsCircularOpen(!isCircularOpen)}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Emitir Circular Oficial
              </button>
            </div>

            {isCircularOpen && (
              <form onSubmit={handleEmitCircular} className="p-4 bg-slate-900 border border-emerald-500/30 rounded-2xl space-y-3 text-xs">
                <h4 className="font-bold text-emerald-400">Nueva Circular Institucional (Ley 675)</h4>
                <input
                  type="text"
                  required
                  value={circularTitle}
                  onChange={(e) => setCircularTitle(e.target.value)}
                  placeholder="Título (ej. Mantenimiento Preventivo de Ascensores)"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                />
                <textarea
                  rows={2}
                  value={circularBody}
                  onChange={(e) => setCircularBody(e.target.value)}
                  placeholder="Mensaje o detalle para todos los copropietarios..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500 resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCircularOpen(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded-xl cursor-pointer"
                  >
                    Publicar Circular
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {pqrsList.map((p) => (
                <div key={p.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-emerald-400">{p.radicado}</span>
                      <span className="font-bold text-white">{p.tipo}</span>
                      <span className="text-slate-400">• {p.apto}</span>
                    </div>
                    <p className="text-slate-300 mt-1">{p.asunto}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg font-bold border ${
                      p.estado.includes('Respondido') || p.estado.includes('Publicada')
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {p.estado}
                    </span>
                    {!p.estado.includes('Respondido') && !p.estado.includes('Publicada') && (
                      <button
                        type="button"
                        onClick={() => {
                          setPqrsList((prev) =>
                            prev.map((item) =>
                              item.id === p.id ? { ...item, estado: 'Respondido con Firma Digital ✓' } : item
                            )
                          );
                          onShowToast?.(`✍️ Radicado ${p.radicado} respondido con Firma Digital Ley 1755`);
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg transition cursor-pointer"
                      >
                        Firmar Respuesta
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
