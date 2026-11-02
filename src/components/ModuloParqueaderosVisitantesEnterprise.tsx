import React, { useState } from 'react';
import {
  Car,
  Bike,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  PlusCircle,
  QrCode,
  LogOut,
  AlertTriangle,
  Printer,
  UserCheck,
  Building2,
  MapPin,
  RefreshCw,
  Sparkles,
  FileText
} from 'lucide-react';
import type { VisitaQrPH } from '../App';
import type { CeldaParqueaderoPH } from '../ModulosOperativosServiciosGenerales';

export interface ModuloParqueaderosVisitantesProps {
  celdasParqueaderoShared?: CeldaParqueaderoPH[];
  setCeldasParqueaderoShared?: React.Dispatch<React.SetStateAction<CeldaParqueaderoPH[]>>;
  visitasQrShared?: VisitaQrPH[];
  setVisitasQrShared?: React.Dispatch<React.SetStateAction<VisitaQrPH[]>>;
  onShowToast?: (msg: string) => void;
  appendAuditLog?: (action: string, details: string, customUser?: string) => void;
}

const DEFAULT_CELDAS_VISITANTES: CeldaParqueaderoPH[] = [
  {
    id: 'celda_v1',
    codigo_celda: 'V-01',
    ubicacion: 'Sótano 1 - Zona Visitantes Norte',
    tipo_permitido: 'Automóvil',
    estado: 'Ocupada',
    placa_actual: 'ABC-123',
    tipo_vehiculo_actual: 'Carro',
    numero_unidad_visita: 'Torre 2 - 301',
    visitante_nombre: 'Carlos Andrés Mesa',
    hora_entrada: '08:15 AM',
    horas_transcurridas: 2
  },
  {
    id: 'celda_v2',
    codigo_celda: 'V-02',
    ubicacion: 'Sótano 1 - Zona Visitantes Norte',
    tipo_permitido: 'Automóvil',
    estado: 'Disponible'
  },
  {
    id: 'celda_v3',
    codigo_celda: 'V-03 (PMR)',
    ubicacion: 'Sótano 1 - Acceso Ascensores (Movilidad Reducida)',
    tipo_permitido: 'PMR / Preferencial',
    estado: 'Disponible'
  },
  {
    id: 'celda_v4',
    codigo_celda: 'V-04 (Moto)',
    ubicacion: 'Sótano 1 - Bahía Motos Visitantes',
    tipo_permitido: 'Moto',
    estado: 'Ocupada',
    placa_actual: 'ZPQ-12F',
    tipo_vehiculo_actual: 'Moto',
    numero_unidad_visita: 'Torre 2 - 301',
    visitante_nombre: 'Rappi Domicilios (Juan David)',
    hora_entrada: '09:40 AM',
    horas_transcurridas: 1
  },
  {
    id: 'celda_v5',
    codigo_celda: 'V-05',
    ubicacion: 'Sótano 1 - Zona Visitantes Sur',
    tipo_permitido: 'Automóvil',
    estado: 'Disponible'
  },
  {
    id: 'celda_v6',
    codigo_celda: 'V-06',
    ubicacion: 'Nivel 1 - Fachada Principal',
    tipo_permitido: 'Automóvil',
    estado: 'Disponible'
  },
  {
    id: 'celda_v7',
    codigo_celda: 'V-07 (Moto)',
    ubicacion: 'Nivel 1 - Fachada Principal',
    tipo_permitido: 'Moto',
    estado: 'Disponible'
  },
  {
    id: 'celda_v8',
    codigo_celda: 'V-08',
    ubicacion: 'Sótano 2 - Visitantes Reserva',
    tipo_permitido: 'Automóvil',
    estado: 'Mantenimiento'
  }
];

export default function ModuloParqueaderosVisitantesEnterprise({
  celdasParqueaderoShared,
  setCeldasParqueaderoShared,
  visitasQrShared = [],
  setVisitasQrShared,
  onShowToast,
  appendAuditLog
}: ModuloParqueaderosVisitantesProps) {
  // Estado local para fallback de celdas
  const [internalCeldas, setInternalCeldas] = useState<CeldaParqueaderoPH[]>(DEFAULT_CELDAS_VISITANTES);
  const activeCeldas = celdasParqueaderoShared && celdasParqueaderoShared.length > 0 ? celdasParqueaderoShared : internalCeldas;
  const updateCeldas = setCeldasParqueaderoShared ?? setInternalCeldas;

  // Filtros y búsquedas
  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<'Todos' | 'Disponibles' | 'Ocupadas' | 'Carro' | 'Moto' | 'PMR'>('Todos');

  // Modal para asignación manual o rápida
  const [modalAsignar, setModalAsignar] = useState<CeldaParqueaderoPH | null>(null);
  const [visitanteSeleccionadoId, setVisitanteSeleccionadoId] = useState('');
  const [placaManual, setPlacaManual] = useState('');
  const [unidadManual, setUnidadManual] = useState('');
  const [nombreManual, setNombreManual] = useState('');

  // Ticket impreso / vista previa
  const [ticketModal, setTicketModal] = useState<{
    celda: string;
    placa: string;
    unidad: string;
    visitante: string;
    horaIngreso: string;
    fecha: string;
  } | null>(null);

  // Métrica en tiempo real
  const totalCeldas = activeCeldas.length;
  const celdasDisponibles = activeCeldas.filter(c => c.estado === 'Disponible').length;
  const celdasOcupadas = activeCeldas.filter(c => c.estado === 'Ocupada').length;
  const celdasMantenimiento = activeCeldas.filter(c => c.estado === 'Mantenimiento').length;

  // Visitantes que están ADENTRO (según visitasQrShared)
  const visitantesAdentro = visitasQrShared.filter(v => v.estado === 'Adentro');
  const visitantesConVehiculo = visitantesAdentro.filter(v => (v.tipoVehiculo || v.tipo || '').toLowerCase() !== 'peatonal');

  // Manejador: Asignar Celda a un Visitante
  const handleConfirmarAsignacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalAsignar) return;

    let placa = placaManual.trim().toUpperCase();
    let unidad = unidadManual.trim();
    let nombre = nombreManual.trim();
    let horaIngreso = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Si se seleccionó un visitante existente de la lista de personas "Adentro"
    if (visitanteSeleccionadoId) {
      const vis = visitasQrShared.find(v => v.id === visitanteSeleccionadoId);
      if (vis) {
        placa = (vis.placa || vis.placaVehiculo || 'SIN-PLACA').toUpperCase();
        unidad = vis.unidad || 'Unidad Residencial';
        nombre = vis.visitante || vis.nombreVisitante || 'Visitante Autorizado';

        // Actualizar el objeto del visitante con la celda asignada
        if (setVisitasQrShared) {
          setVisitasQrShared(prev =>
            prev.map(v => (v.id === vis.id ? { ...v, celdaParqueadero: modalAsignar.codigo_celda } : v))
          );
        }
      }
    }

    if (!placa && !nombre) {
      onShowToast?.('⚠️ Ingresa una placa o selecciona un visitante de la lista.');
      return;
    }

    // Actualizar la celda a Ocupada
    updateCeldas(prev =>
      prev.map(c =>
        c.id === modalAsignar.id
          ? {
              ...c,
              estado: 'Ocupada',
              placa_actual: placa || 'VIS-99',
              numero_unidad_visita: unidad || 'Torre 2 - 301',
              visitante_nombre: nombre || 'Visitante en Garita',
              hora_entrada: horaIngreso,
              horas_transcurridas: 0
            }
          : c
      )
    );

    appendAuditLog?.(
      'PARQUEADERO_ASIGNADO',
      `Celda ${modalAsignar.codigo_celda} asignada a vehículo ${placa} (Visitante: ${nombre} • ${unidad})`,
      'Vigilancia Garita'
    );

    onShowToast?.(`🚗 Celda ${modalAsignar.codigo_celda} asignada con éxito al vehículo ${placa}.`);
    
    // Generar ticket automático
    setTicketModal({
      celda: modalAsignar.codigo_celda,
      placa: placa || 'VIS-99',
      unidad: unidad || 'Torre 2 - 301',
      visitante: nombre || 'Visitante Autorizado',
      horaIngreso,
      fecha: new Date().toLocaleDateString('es-CO')
    });

    // Reset modal state
    setModalAsignar(null);
    setVisitanteSeleccionadoId('');
    setPlacaManual('');
    setUnidadManual('');
    setNombreManual('');
  };

  // Manejador: Liberar Celda
  const handleLiberarCelda = (celda: CeldaParqueaderoPH) => {
    const placaLiberada = celda.placa_actual || 'Vehículo';
    const unidadVisitada = celda.numero_unidad_visita || 'Unidad PH';

    updateCeldas(prev =>
      prev.map(c =>
        c.id === celda.id
          ? {
              ...c,
              estado: 'Disponible',
              placa_actual: undefined,
              visitante_nombre: undefined,
              numero_unidad_visita: undefined,
              hora_entrada: undefined,
              horas_transcurridas: undefined
            }
          : c
      )
    );

    appendAuditLog?.(
      'PARQUEADERO_LIBERADO',
      `Celda ${celda.codigo_celda} liberada. Vehículo ${placaLiberada} finalizó uso en ${unidadVisitada}.`,
      'Vigilancia Garita'
    );

    onShowToast?.(`✅ Celda ${celda.codigo_celda} liberada. Ahora se encuentra DISPONIBLE.`);
  };

  // Manejador: Cambiar Estado a Mantenimiento o Disponible
  const handleToggleMantenimiento = (celda: CeldaParqueaderoPH) => {
    const nuevoEstado = celda.estado === 'Mantenimiento' ? 'Disponible' : 'Mantenimiento';
    updateCeldas(prev =>
      prev.map(c => (c.id === celda.id ? { ...c, estado: nuevoEstado } : c))
    );
    onShowToast?.(`Celda ${celda.codigo_celda} marcada como ${nuevoEstado}.`);
  };

  // Filtrado de celdas según estado y búsqueda
  const celdasFiltradas = activeCeldas.filter(c => {
    const query = busqueda.toLowerCase().trim();
    const coincideBusqueda =
      !query ||
      c.codigo_celda.toLowerCase().includes(query) ||
      (c.placa_actual || '').toLowerCase().includes(query) ||
      (c.numero_unidad_visita || '').toLowerCase().includes(query) ||
      (c.visitante_nombre || '').toLowerCase().includes(query);

    if (!coincideBusqueda) return false;

    if (filtroTipo === 'Disponibles') return c.estado === 'Disponible';
    if (filtroTipo === 'Ocupadas') return c.estado === 'Ocupada';
    if (filtroTipo === 'Carro') return c.tipo_permitido?.toLowerCase().includes('auto') || c.tipo_permitido?.toLowerCase().includes('carro');
    if (filtroTipo === 'Moto') return c.tipo_permitido?.toLowerCase().includes('moto');
    if (filtroTipo === 'PMR') return c.tipo_permitido?.toLowerCase().includes('pmr') || c.tipo_permitido?.toLowerCase().includes('reducida');

    return true;
  });

  return (
    <div className="space-y-6 font-sans text-slate-100 animate-fadeIn">

      {/* 1. CABECERA Y METRICAS EN TIEMPO REAL */}
      <div className="bg-[#0b0f17] border border-cyan-500/20 p-6 rounded-3xl shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.25)]">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
                  Control de Estacionamiento • Garita Principal
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold animate-pulse">
                  ● Sincronizado en Vivo
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">Gestión de Parqueaderos de Visitantes</h3>
            </div>
          </div>

          {/* ACCIONES RÁPIDAS */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const disponible = activeCeldas.find(c => c.estado === 'Disponible');
                if (disponible) {
                  setModalAsignar(disponible);
                } else {
                  onShowToast?.('⚠️ No hay celdas de visitantes disponibles en este momento.');
                }
              }}
              className="bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" /> Asignación Rápida de Celda
            </button>
          </div>
        </div>

        {/* METRICAS KPI GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-[#07090e] border border-emerald-500/30 p-4 rounded-2xl space-y-1">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Disponibles</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {celdasDisponibles} <span className="text-xs text-slate-500 font-normal">/ {totalCeldas}</span>
            </div>
            <p className="text-[10px] text-slate-400">Listas para asignación inmediata</p>
          </div>

          <div className="bg-[#07090e] border border-rose-500/30 p-4 rounded-2xl space-y-1">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Ocupadas</span>
              <Car className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-black text-rose-400 font-mono">
              {celdasOcupadas} <span className="text-xs text-slate-500 font-normal">({Math.round((celdasOcupadas / (totalCeldas || 1)) * 100)}%)</span>
            </div>
            <p className="text-[10px] text-slate-400">Vehículos de visitas adentro</p>
          </div>

          <div className="bg-[#07090e] border border-cyan-500/30 p-4 rounded-2xl space-y-1">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Visitantes Adentro</span>
              <UserCheck className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-400 font-mono">
              {visitantesAdentro.length}
            </div>
            <p className="text-[10px] text-slate-400">({visitantesConVehiculo.length} con vehículo activo)</p>
          </div>

          <div className="bg-[#07090e] border border-amber-500/30 p-4 rounded-2xl space-y-1">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400">
              <span>Mantenimiento</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">
              {celdasMantenimiento}
            </div>
            <p className="text-[10px] text-slate-400">Celdas fuera de servicio</p>
          </div>
        </div>
      </div>

      {/* 2. PANEL DE VISITANTES ACTUALMENTE ADENTRO CON VEHÍCULO */}
      <div className="bg-[#0b0f17] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-sm font-black text-white flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-cyan-400" /> Visitantes Registrados "Adentro" (Control de Parqueo en Tiempo Real)
          </h4>
          <span className="text-xs font-mono text-slate-400">
            Total activos: <strong className="text-cyan-400">{visitantesAdentro.length}</strong>
          </span>
        </div>

        {visitantesAdentro.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {visitantesAdentro.map(v => {
              const celdaAsignada = activeCeldas.find(
                c => c.placa_actual === (v.placa || v.placaVehiculo) || c.visitante_nombre === (v.visitante || v.nombreVisitante) || c.codigo_celda === v.celdaParqueadero
              );

              return (
                <div
                  key={v.id}
                  className={`p-4 rounded-2xl border transition-all text-xs space-y-2 ${
                    celdaAsignada
                      ? 'bg-[#07090e] border-cyan-500/40 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                      : 'bg-[#07090e] border-slate-800 hover:border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {v.codigo || v.codigoQr}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                      ● Adentro ({v.horaIngreso || 'Hoy'})
                    </span>
                  </div>

                  <div>
                    <p className="font-bold text-white text-sm">{v.visitante || v.nombreVisitante}</p>
                    <p className="text-slate-400">
                      Destino: <strong className="text-slate-200">{v.unidad}</strong>
                    </p>
                    <p className="text-slate-400">
                      Vehículo / Placa: <strong className="text-cyan-400 font-mono">{v.placa || v.placaVehiculo || 'Peatonal'}</strong>
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    {celdaAsignada ? (
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono">
                        <Car className="w-3.5 h-3.5" /> Celda: {celdaAsignada.codigo_celda}
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-400 italic">Sin celda asignada</span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        const celdaDisponible = activeCeldas.find(c => c.estado === 'Disponible');
                        if (!celdaDisponible) {
                          onShowToast?.('⚠️ No hay celdas disponibles para asignar.');
                          return;
                        }
                        setModalAsignar(celdaDisponible);
                        setVisitanteSeleccionadoId(v.id);
                        setPlacaManual(v.placa || v.placaVehiculo || '');
                        setUnidadManual(v.unidad || '');
                        setNombreManual(v.visitante || v.nombreVisitante || '');
                      }}
                      className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-bold rounded-lg border border-cyan-500/40 text-[11px] transition cursor-pointer"
                    >
                      {celdaAsignada ? 'Reasignar' : '+ Asignar Celda'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-[#07090e] border border-dashed border-slate-800 rounded-2xl text-center text-xs text-slate-500 italic">
            No hay visitantes registrados con estado "Adentro" en este momento.
          </div>
        )}
      </div>

      {/* 3. REJILLA INTERACTIVA DE CELDAS DE VISITANTES */}
      <div className="bg-[#0b0f17] border border-slate-800 p-6 rounded-3xl shadow-xl space-y-6">
        
        {/* BARRA DE BÚSQUEDA Y FILTROS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Buscar por celda (ej: V-01), placa (ej: ABC-123), residente o visitante..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-[#07090e] border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl text-xs font-mono outline-none focus:border-cyan-400"
            />
          </div>

          {/* FILTROS POR TIPO */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {(['Todos', 'Disponibles', 'Ocupadas', 'Carro', 'Moto', 'PMR'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFiltroTipo(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition cursor-pointer shrink-0 ${
                  filtroTipo === f
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_10px_rgba(34,211,238,0.4)]'
                    : 'bg-[#07090e] text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* REJILLA DE CELDAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {celdasFiltradas.length > 0 ? (
            celdasFiltradas.map(celda => {
              const isDisponible = celda.estado === 'Disponible';
              const isOcupada = celda.estado === 'Ocupada';
              const isMantenimiento = celda.estado === 'Mantenimiento';

              return (
                <div
                  key={celda.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
                    isDisponible
                      ? 'bg-[#07090e] border-emerald-500/30 hover:border-emerald-500/60 shadow-lg shadow-emerald-500/5'
                      : isOcupada
                      ? 'bg-[#07090e] border-rose-500/40 shadow-lg shadow-rose-500/10'
                      : 'bg-[#07090e] border-amber-500/30 opacity-75'
                  }`}
                >
                  {/* INSIGNIA DE ESTADO E ÍCONO */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-black text-white bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                      {celda.codigo_celda}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border ${
                        isDisponible
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : isOcupada
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {celda.estado}
                    </span>
                  </div>

                  {/* INFORMACIÓN DE LA CELDA */}
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <MapPin className="w-3 h-3 text-cyan-400 shrink-0" /> {celda.ubicacion}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Tipo: <strong className="text-slate-200">{celda.tipo_permitido}</strong>
                    </p>
                  </div>

                  {/* DETALLE SI ESTÁ OCUPADA */}
                  {isOcupada && (
                    <div className="p-2.5 bg-slate-950/80 rounded-xl border border-rose-500/20 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-rose-400 text-sm">
                          {celda.placa_actual || 'SIN-PLACA'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {celda.hora_entrada || 'En curso'}
                        </span>
                      </div>
                      <p className="text-white font-bold truncate">{celda.visitante_nombre || 'Visitante Autorizado'}</p>
                      <p className="text-[11px] text-slate-400">Destino: {celda.numero_unidad_visita || 'N/A'}</p>
                    </div>
                  )}

                  {/* BOTONES DE ACCIÓN */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    {isDisponible && (
                      <button
                        type="button"
                        onClick={() => setModalAsignar(celda)}
                        className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold py-1.5 px-3 rounded-xl border border-emerald-500/40 text-xs transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <PlusCircle className="w-3.5 h-3.5" /> Asignar Celda
                      </button>
                    )}

                    {isOcupada && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleLiberarCelda(celda)}
                          className="flex-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold py-1.5 px-2 rounded-xl border border-rose-500/40 text-xs transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <LogOut className="w-3.5 h-3.5" /> Liberar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setTicketModal({
                              celda: celda.codigo_celda,
                              placa: celda.placa_actual || 'N/A',
                              unidad: celda.numero_unidad_visita || 'N/A',
                              visitante: celda.visitante_nombre || 'N/A',
                              horaIngreso: celda.hora_entrada || 'En curso',
                              fecha: new Date().toLocaleDateString('es-CO')
                            })
                          }
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 p-1.5 rounded-xl border border-slate-700 transition cursor-pointer"
                          title="Imprimir Ticket"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {isMantenimiento && (
                      <button
                        type="button"
                        onClick={() => handleToggleMantenimiento(celda)}
                        className="w-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold py-1.5 px-3 rounded-xl border border-amber-500/40 text-xs transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Habilitar
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full p-8 text-center border border-dashed border-slate-800 rounded-3xl text-slate-500 text-xs">
              No se encontraron celdas de parqueadero con los criterios seleccionados.
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE ASIGNACIÓN DE CELDA */}
      {modalAsignar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#0b0f17] border border-cyan-500/30 p-6 rounded-3xl max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white">Asignar Celda {modalAsignar.codigo_celda}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalAsignar(null)}
                className="text-slate-400 hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmarAsignacion} className="space-y-4 text-xs">
              {/* Opción 1: Seleccionar visitante de la lista "Adentro" */}
              {visitantesAdentro.length > 0 && (
                <div className="space-y-1">
                  <label className="font-mono text-cyan-400 font-bold text-[11px] uppercase">
                    1. Seleccionar Visitante "Adentro":
                  </label>
                  <select
                    value={visitanteSeleccionadoId}
                    onChange={(e) => {
                      setVisitanteSeleccionadoId(e.target.value);
                      const vis = visitasQrShared.find(v => v.id === e.target.value);
                      if (vis) {
                        setPlacaManual(vis.placa || vis.placaVehiculo || '');
                        setUnidadManual(vis.unidad || '');
                        setNombreManual(vis.visitante || vis.nombreVisitante || '');
                      }
                    }}
                    className="w-full bg-[#07090e] border border-slate-700 text-white p-3 rounded-xl font-mono outline-none focus:border-cyan-400 cursor-pointer"
                  >
                    <option value="">-- O seleccionar manualmente abajo --</option>
                    {visitantesAdentro.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.visitante || v.nombreVisitante} ({v.unidad}) - Placa: {v.placa || v.placaVehiculo || 'N/A'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Opción 2: Ingreso Manual de Placa y Destino */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <p className="font-mono text-slate-400 text-[11px] font-bold uppercase">
                  2. Datos del Vehículo y Destino:
                </p>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Placa del Vehículo</label>
                  <input
                    type="text"
                    placeholder="Ej. ABC-123 o ZPQ-12F"
                    value={placaManual}
                    onChange={(e) => setPlacaManual(e.target.value)}
                    className="w-full bg-[#07090e] border border-slate-700 text-white p-3 rounded-xl font-mono uppercase outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Unidad Residencial Destino</label>
                  <input
                    type="text"
                    placeholder="Ej. Torre 2 - 301"
                    value={unidadManual}
                    onChange={(e) => setUnidadManual(e.target.value)}
                    className="w-full bg-[#07090e] border border-slate-700 text-white p-3 rounded-xl font-mono outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Nombre del Visitante / Conductor</label>
                  <input
                    type="text"
                    placeholder="Ej. Carlos Andrés Mesa"
                    value={nombreManual}
                    onChange={(e) => setNombreManual(e.target.value)}
                    className="w-full bg-[#07090e] border border-slate-700 text-white p-3 rounded-xl font-mono outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalAsignar(null)}
                  className="w-1/2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 rounded-xl cursor-pointer transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black py-3 rounded-xl cursor-pointer transition shadow-lg shadow-cyan-500/20"
                >
                  Confirmar Asignación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA / TICKET IMPRESO */}
      {ticketModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white text-slate-900 p-6 rounded-3xl max-w-sm w-full space-y-4 shadow-2xl font-mono text-xs border-4 border-slate-900">
            <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-3">
              <h4 className="font-black text-base uppercase">URBIX PH • PORTERÍA</h4>
              <p className="text-[10px] text-slate-600">Comprobante de Parqueadero de Visitantes</p>
              <p className="text-[10px] text-slate-500">{ticketModal.fecha}</p>
            </div>

            <div className="space-y-2 py-2">
              <div className="flex justify-between">
                <span className="text-slate-600">CELDA ASIGNADA:</span>
                <span className="font-black text-sm bg-slate-200 px-2 rounded">{ticketModal.celda}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">PLACA:</span>
                <span className="font-bold text-sm">{ticketModal.placa}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">DESTINO:</span>
                <span className="font-bold">{ticketModal.unidad}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">CONDUCTOR:</span>
                <span className="font-bold truncate max-w-[150px]">{ticketModal.visitante}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">HORA INGRESO:</span>
                <span className="font-bold">{ticketModal.horaIngreso}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-400 pt-3 text-[9px] text-slate-600 text-center space-y-1">
              <p className="font-bold">⚠️ REGLAMENTO DE PROPIEDAD HORIZONTAL (LEY 675)</p>
              <p>Tiempo máximo permitido: 4 horas continuas. Mantener el vehículo en el lugar asignado.</p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setTicketModal(null)}
                className="w-1/2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2 rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                  onShowToast?.('🖨️ Ticket de parqueadero enviado a impresión.');
                }}
                className="w-1/2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" /> Imprimir
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
