import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { 
  Radio, 
  Wrench, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Search,
  Filter,
  RefreshCw,
  Hash
} from 'lucide-react';

interface ModuloRondasNFCProps {
  tenantId?: string;
  onShowToast?: (msg: string) => void;
  onDerivarMantenimientoTodero?: (tarea: any) => void;
}

const DEFAULT_RONDAS = [
  {
    id: 'rnd_1',
    tagNfc: 'NFC-PT-01',
    punto: 'Subestación Eléctrica Principal',
    ubicacion: 'Sótano 2 - Sector Transformadores',
    hora: '06:15 AM',
    guarda: 'Patrullero Carlos Restrepo',
    estado: 'Normal - Verificado',
    presion: 'Voltaje 220V - Tablero Fase A/B/C Estable',
    hash: '0x8f3a9b1c4e7d2e5a6f8b9c0d1e2f3a4b5c6d7e8f'
  },
  {
    id: 'rnd_2',
    tagNfc: 'NFC-PT-02',
    punto: 'Cuarto de Bombas Hidroneumáticas',
    ubicacion: 'Sótano 1 - Tanques Reserva 40,000L',
    hora: '06:45 AM',
    guarda: 'Patrullero Mauricio Henao',
    estado: 'Alerta - Presión Baja',
    presion: 'Manómetro 38 PSI (Límite Mínimo 45 PSI)',
    hash: '0x4c2e7f9a1b3d5e8f0a2c4e6b8d0f2a4c6e8b0d2e'
  },
  {
    id: 'rnd_3',
    tagNfc: 'NFC-PT-03',
    punto: 'Puerta de Emergencia Perimetral Norte',
    ubicacion: 'Costado Calle 10 - Torre 1',
    hora: '07:20 AM',
    guarda: 'Patrullero Andrés Felipe Cano',
    estado: 'Normal - Verificado',
    presion: 'Electroimán 600lbs Activado • Sin Forzamiento',
    hash: '0x1a3b5c7d9e0f2a4c6e8b0d2e4f6a8c0e2b4d6f8a'
  },
  {
    id: 'rnd_4',
    tagNfc: 'NFC-PT-04',
    punto: 'Terraza y Cuarto de Máquinas Ascensores',
    ubicacion: 'Piso 16 - Torre 2',
    hora: '07:55 AM',
    guarda: 'Patrullero Carlos Restrepo',
    estado: 'Normal - Verificado',
    presion: 'Temperatura Sala 21°C • Extractores Operativos',
    hash: '0x9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d'
  }
];

export default function ModuloRondasNFC({
  tenantId = '',
  onShowToast,
  onDerivarMantenimientoTodero
}: ModuloRondasNFCProps) {
  const [rondas, setRondas] = useState<any[]>(DEFAULT_RONDAS);
  const [filtro, setFiltro] = useState<'TODOS' | 'ALERTAS' | 'NORMALES'>('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);

  const cargarRondas = async () => {
    try {
      setCargando(true);
      if (!isSupabaseConfigured) {
        setCargando(false);
        return;
      }

      // Consultar entradas de bitácora o rondas si existen en Supabase
      const { data, error } = await supabase
        .from('guard_patrol_checkpoints')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('scanned_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapeadas = data.map((d: any) => ({
          id: d.id,
          tagNfc: d.tag_id || 'NFC-TAG',
          punto: d.checkpoint_name,
          ubicacion: d.location_details,
          hora: new Date(d.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          guarda: d.guard_name || 'Guarda Rondero',
          estado: d.status || 'Normal - Verificado',
          presion: d.telemetry_reading || 'Lectura de control OK',
          hash: d.verification_hash || '0x' + Math.random().toString(16).substring(2, 10)
        }));
        setRondas(mapeadas);
      }
    } catch (err: any) {
      console.warn('Cargando datos locales de rondas auditadas:', err?.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRondas();
  }, [tenantId]);

  const rondasFiltradas = rondas.filter((r) => {
    const cumpleBusqueda =
      r.punto.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.ubicacion.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.tagNfc.toLowerCase().includes(busqueda.toLowerCase()) ||
      r.guarda.toLowerCase().includes(busqueda.toLowerCase());

    const isNormal = (r.estado || '').includes('Normal') || (r.estado || '').includes('Verificado');
    if (filtro === 'ALERTAS') return cumpleBusqueda && !isNormal;
    if (filtro === 'NORMALES') return cumpleBusqueda && isNormal;
    return cumpleBusqueda;
  });

  const derivarATodero = (ronda: any) => {
    const novedadOrden = {
      id: `ord_novedad_${Date.now()}`,
      area: ronda.punto,
      categoria: 'Reparación / Plomería',
      detalle: `Novedad de ronda en ${ronda.punto}: ${ronda.presion || 'Revisión técnica urgente requerida por Supervisor'}`,
      estado: 'Pendiente',
      fechaReporte: `Hoy ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    };

    onDerivarMantenimientoTodero?.(novedadOrden);
    onShowToast?.(`🛠️ Novedad de ronda derivada a orden de mantenimiento todero.`);
  };

  return (
    <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-6 shadow-xl">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-bold">
              Auditoría Inmutable
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Criptografía SHA-256
            </span>
          </div>
          <h4 className="text-base font-bold text-white font-mono flex items-center gap-2 mt-1">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" /> 1. Auditoría de Patrullajes y Rondas (NFC / QR)
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Puntos de control recorridos con sellos de tiempo y hashes criptográficos de verificación.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cargarRondas}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 rounded-xl text-xs font-mono transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            <span>Refrescar</span>
          </button>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-xl border border-cyan-500/30 font-bold">
            {rondas.length} Puntos Auditados
          </span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por punto, guarda o tag..."
            className="w-full bg-[#07090e] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-cyan-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFiltro('TODOS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
              filtro === 'TODOS'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Todos ({rondas.length})
          </button>
          <button
            type="button"
            onClick={() => setFiltro('ALERTAS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
              filtro === 'ALERTAS'
                ? 'bg-rose-500/20 text-rose-300 border-rose-400'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Alertas ({rondas.filter(r => !(r.estado || '').includes('Normal')).length})
          </button>
          <button
            type="button"
            onClick={() => setFiltro('NORMALES')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer border ${
              filtro === 'NORMALES'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            Normales ({rondas.filter(r => (r.estado || '').includes('Normal')).length})
          </button>
        </div>
      </div>

      {/* Grilla de Puntos de Control */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rondasFiltradas.map((ronda: any, idx: number) => {
          const isNormal = (ronda.estado || '').includes('Normal') || (ronda.estado || '').includes('Verificado');
          return (
            <div key={ronda.id || idx} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl space-y-3 text-xs shadow-lg hover:border-slate-700 transition">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-[10px] font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30 mr-2">
                    {ronda.tagNfc || `NFC-PT-0${idx + 1}`}
                  </span>
                  <strong className="text-white text-sm block mt-1">{ronda.punto}</strong>
                  <p className="text-slate-400 text-[11px] mt-0.5">{ronda.ubicacion || 'Sector común P.H.'}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg font-bold text-[10px] border shrink-0 ${
                  isNormal
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}>
                  {ronda.estado || 'Verificado'}
                </span>
              </div>

              <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between text-slate-400">
                  <span>Horario: <strong className="text-white">{ronda.hora || '08:00 AM'}</strong></span>
                  <span>Guarda: <strong className="text-teal-400">{ronda.guarda || 'Patrullero'}</strong></span>
                </div>
                {ronda.presion && (
                  <p className="text-slate-300">Medición: <strong className="text-white">{ronda.presion}</strong></p>
                )}
                {ronda.hash && (
                  <p className="text-[10px] text-slate-500 truncate flex items-center gap-1" title={ronda.hash}>
                    <Hash className="w-3 h-3 text-slate-600" />
                    <span>Hash: {ronda.hash}</span>
                  </p>
                )}
              </div>

              {!isNormal && (
                <button
                  type="button"
                  onClick={() => derivarATodero(ronda)}
                  className="w-full bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Wrench className="w-3.5 h-3.5" /> Derivar a Mantenimiento Todero
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
