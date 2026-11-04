import React, { useState, useEffect } from 'react';
import { 
  Package, QrCode, KeyRound, UserCheck, Clock, 
  AlertTriangle, CheckCircle2, ShieldCheck, ChevronRight, 
  X, RefreshCw, Send, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export interface EncomiendaResidente {
  id: string;
  tracking_number?: string;
  carrier?: string;
  company?: string;
  description?: string;
  unit_number: string;
  photo_url?: string;
  received_at?: string;
  created_at?: string;
  status: 'En Custodia' | 'Entregado';
  pin_retiro?: string;
  locker_number?: string;
  guarda_nombre?: string;
  delivered_at?: string;
  guarda_entrega?: string;
  entregado_a?: string;
  autorizado_tercero_nombre?: string;
  autorizado_tercero_cedula?: string;
}

interface Props {
  unidadResidente: string; // Ej: "Torre 1 - 302" o "1302"
  onShowToast?: (msg: string) => void;
}

export default function ModuloMisPaquetesResidente({
  unidadResidente,
  onShowToast
}: Props) {
  const [tabFiltro, setTabFiltro] = useState<'custodia' | 'entregados'>('custodia');
  const [paquetes, setPaquetes] = useState<EncomiendaResidente[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estados de interacción
  const [paqueteSeleccionadoQR, setPaqueteSeleccionadoQR] = useState<EncomiendaResidente | null>(null);
  const [paqueteParaDelegar, setPaqueteParaDelegar] = useState<EncomiendaResidente | null>(null);
  const [nombreTercero, setNombreTercero] = useState('');
  const [cedulaTercero, setCedulaTercero] = useState('');
  const [guardandoDelegado, setGuardandoDelegado] = useState(false);
  const [mostrarPinMap, setMostrarPinMap] = useState<{ [id: string]: boolean }>({});

  // 1. Cargar paquetes reales de la unidad desde Supabase
  const cargarPaquetes = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('packages')
        .select('*')
        .ilike('unit_number', `%${unidadResidente.replace(/[^0-9]/g, '')}%`)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPaquetes(data as EncomiendaResidente[]);
      }
    } catch (err) {
      console.warn('Error consultando paquetes:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPaquetes();

    // Sincronización en tiempo real: Si portería recibe o entrega un paquete
    const channel = supabase
      .channel(`realtime_paquetes_${unidadResidente}_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'packages' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            cargarPaquetes();
            if (payload.eventType === 'INSERT') {
              onShowToast?.('📦 ¡Nueva encomienda recibida en portería!');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [unidadResidente]);

  // 2. Guardar autorización para que un tercero retire el paquete
  const handleGuardarDelegado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paqueteParaDelegar || !nombreTercero.trim() || !cedulaTercero.trim()) return;

    try {
      setGuardandoDelegado(true);
      const { error } = await supabase
        .from('packages')
        .update({
          autorizado_tercero_nombre: nombreTercero.trim(),
          autorizado_tercero_cedula: cedulaTercero.trim()
        })
        .eq('id', paqueteParaDelegar.id);

      if (error) throw error;

      // Actualizar vista local
      setPaquetes((prev) =>
        prev.map((p) =>
          p.id === paqueteParaDelegar.id
            ? { ...p, autorizado_tercero_nombre: nombreTercero.trim(), autorizado_tercero_cedula: cedulaTercero.trim() }
            : p
        )
      );

      onShowToast?.(`✅ ${nombreTercero.trim()} autorizado en portería para retirar el paquete`);
      setPaqueteParaDelegar(null);
      setNombreTercero('');
      setCedulaTercero('');
    } catch (err: any) {
      alert('Error guardando autorización: ' + err.message);
    } finally {
      setGuardandoDelegado(false);
    }
  };

  // Calcular horas transcurridas en custodia
  const calcularHorasCustodia = (fechaIngreso?: string) => {
    if (!fechaIngreso) return 0;
    const diffMs = Date.now() - new Date(fechaIngreso).getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
  };

  const paquetesCustodia = paquetes.filter((p) => p.status === 'En Custodia' || !p.status);
  const paquetesEntregados = paquetes.filter((p) => p.status === 'Entregado');
  const listaRender = tabFiltro === 'custodia' ? paquetesCustodia : paquetesEntregados;

  return (
    <div className="space-y-5 font-mono text-slate-100">
      
      {/* 1. BARRA SUPERIOR DE SUBMÓDULO & CONTROLES */}
      <div className="bg-[#090d14] border-2 border-cyan-500/30 rounded-3xl p-5 shadow-[0_0_30px_rgba(0,242,254,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#05131e] border border-[#00f2fe]/40 flex items-center justify-center text-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,0.3)]">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-500/10 text-[#00f2fe] border border-cyan-500/30 font-bold">
                CUSTODIA SEGURA & RECEPCIÓN
              </span>
              <span className="text-xs text-slate-400">Garita ⇄ Apto {unidadResidente}</span>
            </div>
            <h3 className="text-base font-black text-white mt-0.5">
              Control de Paquetería & Encomiendas
            </h3>
          </div>
        </div>

        {/* Pestañas de Filtrado */}
        <div className="flex items-center gap-1.5 bg-[#05080e] p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setTabFiltro('custodia')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              tabFiltro === 'custodia'
                ? 'bg-gradient-to-r from-[#00f2fe] to-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,242,254,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>En Custodia ({paquetesCustodia.length})</span>
          </button>

          <button
            onClick={() => setTabFiltro('entregados')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              tabFiltro === 'entregados'
                ? 'bg-gradient-to-r from-[#00f2fe] to-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,242,254,0.3)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Historial Entregados ({paquetesEntregados.length})</span>
          </button>
        </div>
      </div>

      {/* 2. LISTADO DE PAQUETES */}
      <div className="space-y-4">
        {cargando ? (
          <div className="text-center py-12 bg-[#05080e] rounded-3xl border border-slate-800 text-slate-500 text-xs font-mono">
            Consultando casillero digital en tiempo real...
          </div>
        ) : listaRender.length === 0 ? (
          <div className="text-center py-12 bg-[#05080e] rounded-3xl border border-dashed border-slate-800 text-slate-500 text-xs font-mono">
            {tabFiltro === 'custodia'
              ? 'No tienes paquetes pendientes por retirar en la garita.'
              : 'No hay entregas históricas registradas en este apartamento.'}
          </div>
        ) : (
          listaRender.map((pkg) => {
            const horasCustodia = calcularHorasCustodia(pkg.received_at || pkg.created_at);
            const esRetrasado = horasCustodia >= 48 && pkg.status === 'En Custodia';
            const pinSeguro = pkg.pin_retiro || (parseInt(pkg.id.replace(/[^0-9]/g, '').slice(-4)) || '4829').toString();
            const mostrandoPin = mostrarPinMap[pkg.id] ?? false;

            return (
              <div
                key={pkg.id}
                className={`bg-[#05080e] border-2 rounded-3xl p-5 space-y-4 transition ${
                  esRetrasado
                    ? 'border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                    : pkg.status === 'En Custodia'
                    ? 'border-cyan-500/30 hover:border-cyan-500/60'
                    : 'border-slate-800 opacity-90'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Foto y Datos del Paquete */}
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center shrink-0 relative group">
                      {pkg.photo_url ? (
                        <img
                          src={pkg.photo_url}
                          alt="Evidencia Portería"
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-cyan-400 opacity-80" />
                      )}
                      <span className="absolute bottom-1 right-1 text-[8px] bg-black/80 px-1 rounded text-cyan-300">
                        {pkg.locker_number ? `Casillero #${pkg.locker_number}` : 'Garita'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-black text-white">
                          {pkg.carrier || pkg.company || 'Servientrega'} — {pkg.description || 'Caja / Encomienda sellada'}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pkg.status === 'En Custodia'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {pkg.status}
                        </span>
                        {esRetrasado && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                            +48 Horas en Garita
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                        <span>
                          📥 Llegada: <strong className="text-slate-200">
                            {new Date(pkg.received_at || pkg.created_at || Date.now()).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </strong>
                        </span>
                        {pkg.status === 'En Custodia' && (
                          <span>
                            ⏱️ Tiempo en custodia: <strong className={esRetrasado ? 'text-amber-400 font-bold' : 'text-cyan-400'}>
                              {horasCustodia} hora(s)
                            </strong>
                          </span>
                        )}
                        {pkg.guarda_nombre && (
                          <span>👮 Recibido por: {pkg.guarda_nombre}</span>
                        )}
                      </div>

                      {/* Constancia de Tercero Autorizado si existe */}
                      {pkg.autorizado_tercero_nombre && pkg.status === 'En Custodia' && (
                        <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
                          <UserCheck className="w-4 h-4 shrink-0" />
                          <span>
                            Autorizado para retiro: <strong>{pkg.autorizado_tercero_nombre}</strong> (C.C. {pkg.autorizado_tercero_cedula})
                          </span>
                        </div>
                      )}

                      {/* Constancia de Entrega Real si ya fue entregado */}
                      {pkg.status === 'Entregado' && (
                        <div className="mt-2 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-300 space-y-1">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Entregado satisfactoriamente</span>
                          </div>
                          <p className="text-slate-400 text-[10px]">
                            Fecha: {pkg.delivered_at ? new Date(pkg.delivered_at).toLocaleString() : 'Reciente'} • Entregado por: {pkg.guarda_entrega || 'Guarda en turno'} {pkg.entregado_a ? `• Recibió: ${pkg.entregado_a}` : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones del Paquete (PIN, QR y Delegación) */}
                  {pkg.status === 'En Custodia' && (
                    <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0 pt-2 lg:pt-0">
                      
                      {/* PIN Dinámico de Retiro Seguro */}
                      <div className="bg-[#090d14] border border-cyan-500/40 rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-inner">
                        <div className="flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-cyan-400" />
                          <span className="text-[10px] text-slate-400 uppercase">PIN de Retiro:</span>
                        </div>
                        <span className="font-mono text-base font-black text-[#00f2fe] tracking-widest px-2">
                          {mostrandoPin ? pinSeguro : '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setMostrarPinMap((prev) => ({ ...prev, [pkg.id]: !mostrandoPin }))}
                          className="p-1 text-slate-500 hover:text-white cursor-pointer"
                        >
                          {mostrandoPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Botón QR */}
                        <button
                          type="button"
                          onClick={() => setPaqueteSeleccionadoQR({ ...pkg, pin_retiro: pinSeguro })}
                          className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-[#00f2fe]/10 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <QrCode className="w-4 h-4 text-[#00f2fe]" />
                          <span>Mostrar QR</span>
                        </button>

                        {/* Botón Autorizar Tercero */}
                        <button
                          type="button"
                          onClick={() => {
                            setPaqueteParaDelegar(pkg);
                            setNombreTercero(pkg.autorizado_tercero_nombre || '');
                            setCedulaTercero(pkg.autorizado_tercero_cedula || '');
                          }}
                          className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                          <span>{pkg.autorizado_tercero_nombre ? 'Editar Delegado' : 'Autorizar Tercero'}</span>
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. MODAL: MOSTRAR CÓDIGO QR / PIN AL GUARDA */}
      {paqueteSeleccionadoQR && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#05080e] border-2 border-cyan-500/40 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-[0_0_40px_rgba(0,242,254,0.25)] relative">
            <button
              onClick={() => setPaqueteSeleccionadoQR(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider">
              Pase Digital de Retiro
            </span>
            <h4 className="text-base font-black text-white">
              {paqueteSeleccionadoQR.carrier || 'Encomienda'} — Apto {unidadResidente}
            </h4>

            {/* Simulación visual de QR Code SVG en alta resolución */}
            <div className="p-4 bg-white rounded-2xl w-48 h-48 mx-auto flex items-center justify-center shadow-lg border-4 border-cyan-400/40">
              <svg viewBox="0 0 100 100" className="w-full h-full text-slate-950">
                <path d="M10 10h30v30h-30zM15 15v20h20v-20zM22 22h6v6h-6z" fill="currentColor"/>
                <path d="M60 10h30v30h-30zM65 15v20h20v-20zM72 22h6v6h-6z" fill="currentColor"/>
                <path d="M10 60h30v30h-30zM15 65v20h20v-20zM22 72h6v6h-6z" fill="currentColor"/>
                <circle cx="50" cy="50" r="8" fill="currentColor"/>
                <rect x="45" y="15" width="10" height="20" fill="currentColor"/>
                <rect x="15" y="45" width="20" height="10" fill="currentColor"/>
                <rect x="65" y="45" width="20" height="10" fill="currentColor"/>
                <rect x="45" y="65" width="10" height="20" fill="currentColor"/>
                <rect x="65" y="65" width="25" height="25" fill="currentColor"/>
              </svg>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-slate-400 block">O dicta el PIN en la garita:</span>
              <span className="font-mono text-2xl font-black text-[#00f2fe] tracking-widest block bg-[#090d14] py-2 rounded-xl border border-cyan-500/30">
                {paqueteSeleccionadoQR.pin_retiro}
              </span>
            </div>

            <p className="text-[10px] text-slate-500 leading-tight">
              Muestra este código al vigilante o dicta el PIN para liberar el paquete del casillero.
            </p>
          </div>
        </div>
      )}

      {/* 4. MODAL: AUTORIZAR A UN TERCERO PARA RECLAMAR */}
      {paqueteParaDelegar && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#05080e] border-2 border-cyan-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-[0_0_40px_rgba(0,242,254,0.25)] relative">
            <button
              onClick={() => setPaqueteParaDelegar(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white">Autorizar Retiro a Tercero</h4>
                <p className="text-[11px] text-slate-400">Habilita a un familiar o persona de confianza</p>
              </div>
            </div>

            <form onSubmit={handleGuardarDelegado} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Nombre Completo de la Persona Autorizada
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Gloria Patricia Mesa"
                  value={nombreTercero}
                  onChange={(e) => setNombreTercero(e.target.value)}
                  className="w-full bg-[#090d14] border border-slate-700 rounded-xl p-2.5 text-white focus:border-[#00f2fe] outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Número de Cédula / Documento
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 43.123.456"
                  value={cedulaTercero}
                  onChange={(e) => setCedulaTercero(e.target.value)}
                  className="w-full bg-[#090d14] border border-slate-700 rounded-xl p-2.5 text-white focus:border-[#00f2fe] outline-none"
                />
              </div>

              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-[11px] text-cyan-300">
                🔒 Portería exigirá la cédula física a esta persona y solicitará el PIN para confirmar la entrega.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaqueteParaDelegar(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoDelegado}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {guardandoDelegado ? 'Guardando...' : 'Habilitar en Garita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
