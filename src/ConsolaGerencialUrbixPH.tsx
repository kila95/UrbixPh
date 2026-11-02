import React, { useState } from 'react';
import {
  Building2, FileText, HardHat, DollarSign,
  Wrench, Calendar, MessageSquare, ShieldCheck, Plus, Camera, AlertCircle, Search, Users, UserPlus, Trash2, Radio, Check, Edit3, Scan, FileSpreadsheet
} from 'lucide-react';
import type { GuardIncidentReport, CommonAreaReservation } from './App';
import type { UserProfile } from './supabaseClient';
import ContractorsModule from './ContractorsModule';
import MeetingMinutesModule from './MeetingMinutesModule';
import AdminGeneralInteractive from './components/AdminGeneralInteractive';
import SelectorPortafolioMultiConjunto from './components/SelectorPortafolioMultiConjunto';
import SalaAsambleaVirtualExecutive from './components/SalaAsambleaVirtualExecutive';
import SelectorTipoReunionUrbix from './components/SelectorTipoReunionUrbix';
import ModuloReunionesConSubmodulos from './components/ModuloReunionesConSubmodulos';
import AsambleasActasLegalesHub from './components/AsambleasActasLegalesHub';
import LectorFacturasProveedoresOCR from './components/LectorFacturasProveedoresOCR';
import GeneradorExogenaDIAN_NIIF from './components/GeneradorExogenaDIAN_NIIF';
import SeccionTesoreriaConDIAN from './components/SeccionTesoreriaConDIAN';
import SeccionGestionPersonalAdmin from './SeccionGestionPersonalAdmin';
import GestionCuadrillaAdminModal from './components/GestionCuadrillaAdminModal';
import PorteriaSupabaseSync from './PorteriaSupabaseSync';


export interface StaffMember {
  id: string;
  nombre: string;
  rol: string;
  email: string;
  estado: string;
  edificios?: string[];
}

export interface ConsolaGerencialUrbixPHProps {
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

export default function ConsolaGerencialUrbixPH({
  currentTenant,
  userProfile,
  tenantName,
  adminName,
  guardIncidents = [],
  onUpdateIncidentStatus,
  onOpenCreateTenantModal,
  onShowToast
}: ConsolaGerencialUrbixPHProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'asamblea' | 'actas' | 'contractors' | 'cartera' | 'facturas_ocr' | 'exogena_dian' | 'mantenimiento' | 'personal' | 'reservas' | 'pqrs' | 'porteria'>('general');

  const [searchQuery, setSearchQuery] = useState('');
  const [mostrarModalCuadrilla, setMostrarModalCuadrilla] = useState(false);

  const resolvedTenantName = currentTenant?.name || tenantName || 'P.H. Reserva del Tesoro';
  const resolvedAdminName = userProfile?.full_name || adminName || 'Esteban Ochoa';

  // Catálogo de copropiedades / edificios disponibles para asignación a supervisores
  const catalogCopropiedades = [
    'P.H. Reserva del Tesoro (Torre 1 & 2)',
    'Conjunto Altavista PH',
    'Edificio Portal del Campestre',
    'Torres de Vizcaya PH',
    'Mirador del Poblado PH'
  ];

  // Personal / Staff operativo con edificios asignados a cargo
  const [personalStaff, setPersonalStaff] = useState<StaffMember[]>([
    {
      id: 'st_1',
      nombre: 'Carlos Mario Pineda',
      rol: 'Administrador',
      email: 'carlos.admin@urbix.ph',
      estado: 'Activo',
      edificios: ['P.H. Reserva del Tesoro (Torre 1 & 2)', 'Conjunto Altavista PH']
    },
    {
      id: 'st_2',
      nombre: 'Julián Arango',
      rol: 'Supervisor Operativo',
      email: 'supervisor@urbix.ph',
      estado: 'Activo',
      edificios: ['P.H. Reserva del Tesoro (Torre 1 & 2)', 'Edificio Portal del Campestre', 'Mirador del Poblado PH']
    },
    {
      id: 'st_3',
      nombre: 'Don José (Todero)',
      rol: 'Aseo & Mantenimiento',
      email: 'jose.operativo@urbix.ph',
      estado: 'Activo',
      edificios: ['P.H. Reserva del Tesoro (Torre 1 & 2)']
    },
    {
      id: 'st_4',
      nombre: 'Luis Fernando Pérez',
      rol: 'Vigilante / Portería',
      email: 'porteria.tesoro@urbix.ph',
      estado: 'Activo',
      edificios: ['Garita Principal - Reserva del Tesoro']
    }
  ]);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [emailNuevo, setEmailNuevo] = useState('');
  const [rolNuevo, setRolNuevo] = useState('Supervisor Operativo');
  const [edificiosSeleccionados, setEdificiosSeleccionados] = useState<string[]>([
    'P.H. Reserva del Tesoro (Torre 1 & 2)'
  ]);
  const [nuevoEdificioPersonalizado, setNuevoEdificioPersonalizado] = useState('');

  // Estado para modal de edición de edificios de staff
  const [staffEnEdicion, setStaffEnEdicion] = useState<StaffMember | null>(null);
  const [edificiosEdicionTemp, setEdificiosEdicionTemp] = useState<string[]>([]);
  const [inputCustomEdicion, setInputCustomEdicion] = useState('');

  // Datos consolidados de Cartera (Ley 675)
  const [apartments, setApartments] = useState([
    { id: '101', torre: '1', apto: '101', propietario: 'Mateo Zuluaga', saldo: 0, estado: 'Al día', coeficiente: '0.82%' },
    { id: '102', torre: '1', apto: '102', propietario: 'Carolina Herrera', saldo: 420000, estado: 'En mora', coeficiente: '0.82%' },
    { id: '201', torre: '1', apto: '201', propietario: 'Andrés Gómez', saldo: 1260000, estado: 'Cobro jurídico', coeficiente: '0.95%' },
    { id: '302', torre: '1', apto: '302', propietario: 'Esteban Ochoa', saldo: 0, estado: 'Al día', coeficiente: '1.05%' },
  ]);

  // Datos consolidados de Mantenimiento
  const [reports, setReports] = useState([
    { id: 'rep-1', area: 'Sótano 1', categoria: 'Iluminación', detalle: 'Balasto quemado lámpara salida parqueadero', prioridad: 'Media', asignado: 'Don José (Todero)', estado: 'En proceso' },
    { id: 'rep-2', area: 'Piscina', categoria: 'Motobombas', detalle: 'Ruido anormal en motor de recirculación', prioridad: 'Alta', asignado: 'Contratista Hidráulico', estado: 'Pendiente' }
  ]);

  // Reservas de áreas comunes con validación de Paz y Salvo y Depósito ($100.000 COP)
  const [localReservations, setLocalReservations] = useState([
    { id: 'res-1', zona: 'Salón Social', apto: 'Torre 1 - 302', residente: 'Esteban Ochoa', fecha: 'Sábado 31 Oct - 6:00 PM', deposito: 100000, pazYSalvo: true, estado: 'Aprobada ✓' },
    { id: 'res-2', zona: 'Zona BBQ', apto: 'Torre 1 - 102', residente: 'Carolina Herrera', fecha: 'Domingo 1 Nov - 1:00 PM', deposito: 100000, pazYSalvo: false, estado: 'Bloqueado por mora' },
    { id: 'res-3', zona: 'Cancha Sintética', apto: 'Torre 1 - 101', residente: 'Mateo Zuluaga', fecha: 'Domingo 1 Nov - 4:00 PM', deposito: 100000, pazYSalvo: true, estado: 'Pendiente aprobación' }
  ]);

  // Datos consolidados de PQRS (Ley 1755)
  const [pqrsList, setPqrsList] = useState([
    { id: 'pqr-1', radicado: 'RAD-2026-0841', apto: 'Torre 2 - 301', tipo: 'Reclamo Técnico (10 días hábiles)', asunto: 'Filtración de humedad en cielo raso', estado: 'En término legal' }
  ]);
  const [isCircularOpen, setIsCircularOpen] = useState(false);
  const [circularTitle, setCircularTitle] = useState('');
  const [circularBody, setCircularBody] = useState('');

  const toggleEdificioForm = (edificio: string) => {
    setEdificiosSeleccionados((prev) =>
      prev.includes(edificio) ? prev.filter((e) => e !== edificio) : [...prev, edificio]
    );
  };

  const handleAgregarCustomForm = () => {
    if (!nuevoEdificioPersonalizado.trim()) return;
    const item = nuevoEdificioPersonalizado.trim();
    if (!edificiosSeleccionados.includes(item)) {
      setEdificiosSeleccionados((prev) => [...prev, item]);
    }
    setNuevoEdificioPersonalizado('');
  };

  const handleCrearEmpleado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNuevo.trim() || !emailNuevo.trim()) return;

    const edificiosFinales =
      edificiosSeleccionados.length > 0
        ? edificiosSeleccionados
        : [resolvedTenantName || 'P.H. Reserva del Tesoro (Torre 1 & 2)'];

    const nuevoTrabajador: StaffMember = {
      id: `st_${Date.now()}`,
      nombre: nombreNuevo.trim(),
      rol: rolNuevo,
      email: emailNuevo.trim(),
      estado: 'Activo',
      edificios: edificiosFinales
    };

    setPersonalStaff([nuevoTrabajador, ...personalStaff]);
    setNombreNuevo('');
    setEmailNuevo('');
    setEdificiosSeleccionados(['P.H. Reserva del Tesoro (Torre 1 & 2)']);
    onShowToast?.(`✅ ${rolNuevo} "${nuevoTrabajador.nombre}" registrado con ${edificiosFinales.length} edificio(s) asignados a cargo.`);
  };

  const handleAbrirEdicionEdificios = (staff: StaffMember) => {
    setStaffEnEdicion(staff);
    setEdificiosEdicionTemp(staff.edificios || ['P.H. Reserva del Tesoro (Torre 1 & 2)']);
  };

  const toggleEdificioModal = (edificio: string) => {
    setEdificiosEdicionTemp((prev) =>
      prev.includes(edificio) ? prev.filter((e) => e !== edificio) : [...prev, edificio]
    );
  };

  const handleAgregarCustomModal = () => {
    if (!inputCustomEdicion.trim()) return;
    const item = inputCustomEdicion.trim();
    if (!edificiosEdicionTemp.includes(item)) {
      setEdificiosEdicionTemp((prev) => [...prev, item]);
    }
    setInputCustomEdicion('');
  };

  const handleGuardarEdificiosStaff = () => {
    if (!staffEnEdicion) return;
    const finalList = edificiosEdicionTemp.length > 0 ? edificiosEdicionTemp : ['P.H. Reserva del Tesoro (Torre 1 & 2)'];

    setPersonalStaff((prev) =>
      prev.map((s) => (s.id === staffEnEdicion.id ? { ...s, edificios: finalList } : s))
    );

    onShowToast?.(`🏢 Edificios a cargo actualizados para ${staffEnEdicion.nombre}: ${finalList.length} asignados.`);
    setStaffEnEdicion(null);
  };

  const handleDespedirEmpleado = (id: string, nombre: string) => {
    setPersonalStaff(personalStaff.filter(s => s.id !== id));
    onShowToast?.(`🚫 Acceso revocado y empleado "${nombre}" dado de baja.`);
  };

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

  const combinedReports = [
    ...guardIncidents.map((inc) => ({
      id: inc.id,
      area: inc.location || 'Área General',
      categoria: inc.category || 'General',
      detalle: inc.desc || inc.title || '',
      prioridad: (inc.category || '').includes('Seguridad') || (inc.category || '').includes('Daño') ? 'Alta' : 'Media',
      asignado: inc.assignedTo || 'Don José (Todero)',
      estado:
        inc.status === 'Solucionado' || inc.status === 'Resuelto'
          ? 'Solucionado'
          : inc.status === 'En Proceso' || inc.status === 'En Revisión'
          ? 'En proceso'
          : 'Pendiente',
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

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 font-sans p-3 sm:p-5 md:p-6 space-y-4 sm:space-y-6 flex flex-col rounded-2xl sm:rounded-3xl border border-slate-800/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
      
      {/* 1. CABECERA SIEMPRE ARRIBA */}
      <header className="w-full shrink-0 bg-[#0b0f17]/90 backdrop-blur-xl border-b border-cyan-500/20 px-4 sm:px-6 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-[0_4px_25px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-xl shadow-[0_0_20px_rgba(34,211,238,0.4)] shrink-0">
            U
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight leading-tight">Urbix • Consola Gerencial</h1>
              <span className="text-[10px] font-black uppercase tracking-widest bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 px-2.5 py-0.5 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.15)]">
                LEY 675 COLOMBIA
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              {resolvedTenantName} • <span className="text-cyan-400">Admin: {resolvedAdminName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setMostrarModalCuadrilla(true)}
            className="px-3.5 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[40px]"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" /> Asignar Cuadrilla ({resolvedTenantName})
          </button>
          {onOpenCreateTenantModal && (
            <button
              type="button"
              onClick={onOpenCreateTenantModal}
              className="px-3.5 py-2 bg-[#07090e] hover:bg-slate-800 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[40px]"
            >
              <Plus className="w-3.5 h-3.5" /> Registrar Unidad
            </button>
          )}
        </div>
      </header>

      {mostrarModalCuadrilla && (
        <GestionCuadrillaAdminModal
          tenantId={currentTenant?.id || 'ten_01'}
          nombreConjunto={resolvedTenantName}
          onCerrar={() => setMostrarModalCuadrilla(false)}
          onShowToast={onShowToast}
        />
      )}

      {/* SELECTOR MÓVIL DIRECTO (PANTALLAS PEQUEÑAS) */}
      <div className="lg:hidden w-full bg-[#0b0f17] border border-cyan-500/20 p-2.5 rounded-2xl flex items-center gap-2 shadow-md">
        <span className="text-xs font-mono text-cyan-400 font-bold shrink-0">Submódulo:</span>
        <select
          value={activeTab}
          onChange={(e) => setActiveTab(e.target.value as any)}
          className="bg-slate-900 text-cyan-300 font-bold text-xs p-2 rounded-xl border border-slate-700 w-full outline-none focus:border-cyan-400 cursor-pointer"
        >
          <option value="general">🏢 General (Portafolio & Macro-Salud)</option>
          <option value="asamblea">🗳️ Asambleas & Actas Legales (Ley 675)</option>
          <option value="contractors">🛡️ Contratistas & Obras (SG-SST)</option>
          <option value="cartera">💰 Tesorería, OCR & Exógena DIAN</option>
          <option value="mantenimiento">🔧 Mantenimiento & Órdenes</option>
          <option value="porteria">🚨 Portería & Minuta (Tiempo Real Supabase)</option>
          <option value="personal">👥 Personal & Staff</option>
          <option value="reservas">📅 Áreas Comunes & Depósitos</option>
          <option value="pqrs">💬 PQRS (Ley 1755)</option>
        </select>
      </div>

      {/* 2. BARRA DE NAVEGACIÓN EN UNA SOLA LÍNEA HORIZONTAL SIN SALTOS (SWIPE TÁCTIL) */}
      <nav className="w-full flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none py-2 px-3 bg-[#0b0f17] border border-cyan-500/20 rounded-2xl shrink-0 shadow-lg touch-pan-x">
        <span className="text-xs font-bold text-cyan-400 font-mono px-3 py-1.5 bg-cyan-500/10 rounded-xl border border-cyan-500/30 shrink-0">
          ⚡ Módulos Sincronizados (Executive Glass)
        </span>
        {[
          { id: 'general', label: 'General', icon: Building2, color: 'text-cyan-400' },
          { id: 'porteria', label: 'Portería (Tiempo Real)', icon: Radio, color: 'text-[#00f2fe]' },
          { id: 'asamblea', label: 'Asambleas & Actas Legales', icon: Users, color: 'text-cyan-400' },
          { id: 'contractors', label: 'Contratistas & Obras', icon: HardHat, color: 'text-emerald-400' },
          { id: 'cartera', label: 'Tesorería, OCR & DIAN', icon: DollarSign, color: 'text-teal-400' },
          { id: 'mantenimiento', label: 'Mantenimiento', icon: Wrench, color: 'text-amber-400' },
          { id: 'personal', label: 'Personal & Staff', icon: Users, color: 'text-purple-400' },
          { id: 'reservas', label: 'Áreas Comunes', icon: Calendar, color: 'text-indigo-400' },
          { id: 'pqrs', label: 'PQRS', icon: MessageSquare, color: 'text-cyan-400' },
        ].map((tab) => {

          const Icon = tab.icon;
          const isActive = activeTab === tab.id || (tab.id === 'asamblea' && activeTab === 'actas');
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 whitespace-nowrap cursor-pointer shrink-0 min-h-[40px] ${
                isActive 
                  ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.2)]' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.color}`} /> {tab.label}
            </button>
          );
        })}
      </nav>

      {/* 3. CONTENIDO PRINCIPAL ABAJO */}
      <main className="w-full flex-1 space-y-6">
        
        {/* 1. GENERAL (Control Multi-Copropiedad, Macro-Salud PH y SaaS Interactivo) */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <SelectorPortafolioMultiConjunto onShowToast={onShowToast} />
            <AdminGeneralInteractive onShowToast={onShowToast} />

            {/* Tarjetas de acceso directo gerencial */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" /> Cartera Crítica / Cobro Prejurídico (Ley 675)
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cartera')}
                    className="text-xs text-cyan-400 font-bold hover:underline cursor-pointer"
                  >
                    Ver cartera →
                  </button>
                </div>
                <div className="space-y-2">
                  {apartments.filter((a) => a.saldo > 0).map((a) => (
                    <div key={a.id} className="p-3 bg-[#07090e] border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
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

              <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" /> Personal Activo y Operación SG-SST
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab('personal')}
                      className="text-xs text-purple-400 font-bold hover:underline cursor-pointer"
                    >
                      Gestionar Staff ({personalStaff.length}) →
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
                  {personalStaff.slice(0, 3).map((s) => (
                    <div key={s.id} className="p-3 bg-[#07090e] border border-slate-800 rounded-2xl flex items-center justify-between text-xs gap-2">
                      <div>
                        <span className="font-bold text-white">{s.nombre}</span>
                        <p className="text-slate-400 font-mono text-[11px]">{s.rol} • {s.email}</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-1 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shrink-0">
                        🟢 {s.estado}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. CENTRO INTEGRAL DE ASAMBLEAS & ACTAS LEGALES (LEY 675 DE 2001) */}
        {(activeTab === 'asamblea' || activeTab === 'actas') && (
          <AsambleasActasLegalesHub
            copropiedadNombre={resolvedTenantName}
            onShowToast={onShowToast}
          />
        )}

        {/* 3. CONTRATISTAS & OBRAS */}
        {activeTab === 'contractors' && (
          <ContractorsModule tenantName={resolvedTenantName} onShowToast={onShowToast} />
        )}

        {/* 4. SECCIÓN DE TESORERÍA CON SUB-PESTAÑAS (FLUJO DE CAJA, OCR FACTURAS, EXÓGENA DIAN & NIIF) */}
        {(activeTab === 'cartera' || activeTab === 'facturas_ocr' || activeTab === 'exogena_dian') && (
          <SeccionTesoreriaConDIAN
            onShowToast={onShowToast}
            nombreCopropiedad={resolvedTenantName}
          >
            <div className="space-y-4">
              <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                      <DollarSign className="w-4 h-4 text-cyan-400" /> Tesorería y Cartera Ordinaria / Extraordinaria (Ley 675)
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">Control unificado de expensas, intereses de mora, recaudos PSE y estados de cuenta por coeficiente.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar unidad o propietario..."
                        className="pl-8 pr-3 py-1.5 bg-[#07090e] border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-cyan-400"
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

                <div className="overflow-x-auto bg-[#07090e] border border-slate-800 rounded-2xl">
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
                        <tr key={a.id} className="hover:bg-slate-900/50">
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
            </div>
          </SeccionTesoreriaConDIAN>
        )}

        {/* 5. MANTENIMIENTO */}
        {activeTab === 'mantenimiento' && (
          <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                <Wrench className="w-4 h-4 text-amber-400" /> Órdenes de Trabajo y Mantenimiento General
              </h3>
              <p className="text-xs text-slate-400 mt-1">Gestión directa de daños, reparaciones y asignación al personal de toderos en la copropiedad.</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {combinedReports.map((r) => (
                <div key={r.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-white text-sm">{r.area} • {r.categoria}</span>
                    <p className="text-xs text-slate-300 mt-1">{r.detalle}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Asignado a: <strong className="text-cyan-400">{r.asignado}</strong></p>
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
          </div>
        )}

        {/* 6. PERSONAL & STAFF (Control Total del Administrador, Edificios, Nómina y Turnos de Línea de Tiempo) */}
        {activeTab === 'personal' && (
          <SeccionGestionPersonalAdmin onShowToast={onShowToast} />
        )}

        {/* 7. ÁREAS COMUNES */}
        {activeTab === 'reservas' && (
          <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                <Calendar className="w-4 h-4 text-indigo-400" /> Gestión de Áreas Comunes y Depósitos
              </h3>
              <p className="text-xs text-slate-400 mt-1">Control de reservas para Salón Social, Zona BBQ y Cancha Sintética con validación de paz y salvo.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {localReservations.map((res) => (
                <div key={res.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl space-y-3 flex flex-col justify-between">
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
                    <p className="text-[11px] text-slate-400 mt-1">Depósito Garantía: <strong className="text-cyan-400">${res.deposito.toLocaleString('es-CO')} COP</strong></p>
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
                        className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl transition cursor-pointer"
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

        {/* 8. PQRS */}
        {activeTab === 'pqrs' && (
          <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <MessageSquare className="w-4 h-4 text-cyan-400" /> Bandeja PQRSD (Ley 1755 y Ley 675)
                </h3>
                <p className="text-xs text-slate-400 mt-1">Atención de peticiones, quejas y reclamos con plazos legales y firma digital.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsCircularOpen(!isCircularOpen)}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Emitir Circular Oficial
              </button>
            </div>

            {isCircularOpen && (
              <form onSubmit={handleEmitCircular} className="p-4 bg-[#07090e] border border-cyan-500/30 rounded-2xl space-y-3 text-xs">
                <h4 className="font-bold text-cyan-400">Nueva Circular Institucional (Ley 675)</h4>
                <input
                  type="text"
                  required
                  value={circularTitle}
                  onChange={(e) => setCircularTitle(e.target.value)}
                  placeholder="Título (ej. Mantenimiento Preventivo de Ascensores)"
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400"
                />
                <textarea
                  rows={2}
                  value={circularBody}
                  onChange={(e) => setCircularBody(e.target.value)}
                  placeholder="Mensaje o detalle para todos los copropietarios..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white outline-none focus:border-cyan-400 resize-none"
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
                    className="px-4 py-1.5 bg-cyan-500 text-slate-950 font-bold rounded-xl cursor-pointer"
                  >
                    Publicar Circular
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {pqrsList.map((p) => (
                <div key={p.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-cyan-400">{p.radicado}</span>
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

        {/* 10. PORTERÍA & SINCRONIZACIÓN EN TIEMPO REAL CON SUPABASE */}
        {activeTab === 'porteria' && (
          <PorteriaSupabaseSync
            tenantId={currentTenant?.id || 'ten_01'}
            vigilanteName={resolvedAdminName}
            onShowToast={onShowToast}
          />
        )}

      </main>

    </div>
  );
}
