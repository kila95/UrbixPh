import React, { useState, useEffect, useRef } from 'react';
import { supabase, isSupabaseConfigured, SUPABASE_URL } from './supabaseClient';
import { 
  Shield, 
  AlertTriangle, 
  Send, 
  Radio, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  RefreshCw, 
  Copy, 
  Database, 
  Zap, 
  Sparkles,
  Info
} from 'lucide-react';
import { sanitizarTextoSeguro } from './core/coreFreezeGuard';

export interface PorteriaSupabaseSyncProps {
  tenantId?: string;
  vigilanteName?: string;
  onNovedadCreated?: () => void;
  onShowToast?: (msg: string) => void;
}

export interface MaintenanceReportItem {
  id: string | number;
  tenant_id?: string;
  category: string;
  location: string;
  description: string;
  vigilante_name?: string;
  status: string;
  created_at?: string;
  isRealtimeLive?: boolean;
}

export default function PorteriaSupabaseSync({ 
  tenantId = 'ten_01', 
  vigilanteName = 'Guarda en Turno',
  onNovedadCreated,
  onShowToast 
}: PorteriaSupabaseSyncProps) {
  const [novedades, setNovedades] = useState<MaintenanceReportItem[]>([
    {
      id: 'demo-init-1',
      tenant_id: tenantId,
      category: 'Infraestructura / Daño',
      location: 'Torre 1 - Lobby Principal',
      description: 'Lámpara de emergencia parpadeando y zumbido en tablero eléctrico',
      vigilante_name: 'Guarda en Turno',
      status: 'Reportado',
      created_at: new Date().toISOString()
    }
  ]);
  
  // Estados de conexión en tiempo real
  const [realtimeStatus, setRealtimeStatus] = useState<'SUBSCRIBED' | 'CONNECTING' | 'ERROR' | 'OFFLINE'>('CONNECTING');
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState<string | null>(null);
  const [notifMessage, setNotifMessage] = useState<{ text: string; type: 'success' | 'warning' | 'info' } | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Estados del formulario
  const [categoryNov, setCategoryNov] = useState('Infraestructura / Daño');
  const [locationNov, setLocationNov] = useState('');
  const [descNov, setDescNov] = useState('');
  const [loading, setLoading] = useState(false);

  const notifTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (text: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setNotifMessage({ text, type });
    onShowToast?.(text);
    if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    notifTimerRef.current = setTimeout(() => {
      setNotifMessage(null);
    }, 4500);
  };

  // Cargar datos y suscribir canal en Tiempo Real con Supabase
  useEffect(() => {
    fetchNovedades();

    if (!isSupabaseConfigured) {
      setRealtimeStatus('OFFLINE');
      return;
    }

    setRealtimeStatus('CONNECTING');

    // Suscripción al canal Realtime de Postgres Changes
    const channelName = `realtime_porteria_${tenantId}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_reports'
        },
        (payload) => {
          console.log('⚡ [Realtime Supabase] Evento recibido:', payload);
          setLastRealtimeEvent(`Evento ${payload.eventType} recibido a las ${new Date().toLocaleTimeString()}`);
          
          if (payload.eventType === 'INSERT') {
            const newRecord = {
              ...(payload.new as MaintenanceReportItem),
              isRealtimeLive: true
            };
            setNovedades((prev) => {
              if (prev.some((item) => String(item.id) === String(newRecord.id))) {
                return prev;
              }
              return [newRecord, ...prev];
            });
            showNotification(`⚡ [Tiempo Real] Nueva novedad recibida de: ${(payload.new as any).location || 'Portería'}`, 'success');
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as MaintenanceReportItem;
            setNovedades((prev) =>
              prev.map((item) => (String(item.id) === String(updated.id) ? { ...item, ...updated } : item))
            );
            showNotification(`⚡ [Tiempo Real] Estado actualizado a: ${updated.status}`, 'info');
          } else if (payload.eventType === 'DELETE') {
            const oldId = (payload.old as any).id;
            setNovedades((prev) => prev.filter((item) => String(item.id) !== String(oldId)));
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [Supabase Channel Status]:', status);
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('SUBSCRIBED');
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('ERROR');
        } else if (status === 'TIMED_OUT' || status === 'CLOSED') {
          setRealtimeStatus('ERROR');
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (notifTimerRef.current) clearTimeout(notifTimerRef.current);
    };
  }, [tenantId]);

  async function fetchNovedades() {
    try {
      const { data, error } = await supabase
        .from('maintenance_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        setNovedades(data);
      }
    } catch (err) {
      console.warn('Uso de almacenamiento en caché:', err);
    }
  }

  // Registrar novedad en Supabase
  const handleReportNovedad = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanLocation = sanitizarTextoSeguro(locationNov, 100);
    const cleanDesc = sanitizarTextoSeguro(descNov, 500);

    if (!cleanLocation || !cleanDesc) return;
    setLoading(true);

    const payload = {
      tenant_id: tenantId,
      category: categoryNov,
      location: cleanLocation,
      description: cleanDesc,
      vigilante_name: vigilanteName,
      status: 'Reportado',
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from('maintenance_reports')
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.warn('Aviso de inserción en Supabase (modo seguro local):', error.message);
        // Si la tabla no existe en Supabase todavía, fallback resiliente
        const localItem: MaintenanceReportItem = {
          id: `local-${Date.now()}`,
          ...payload
        };
        setNovedades(prev => [localItem, ...prev]);
        showNotification('Novedad guardada localmente (Tabla pendiente en Supabase).', 'warning');
      } else {
        const savedItem: MaintenanceReportItem = data || {
          id: `sync-${Date.now()}`,
          ...payload,
          isRealtimeLive: true
        };
        setNovedades(prev => {
          if (prev.some(item => String(item.id) === String(savedItem.id))) return prev;
          return [savedItem, ...prev];
        });
        showNotification('¡Novedad replicada con éxito en la base de datos Supabase!', 'success');
      }
    } catch (err: unknown) {
      const localItem: MaintenanceReportItem = {
        id: `local-${Date.now()}`,
        ...payload
      };
      setNovedades(prev => [localItem, ...prev]);
      showNotification('Novedad almacenada en memoria resiliente.', 'info');
    } finally {
      setLoading(false);
      setLocationNov('');
      setDescNov('');
      if (onNovedadCreated) onNovedadCreated();
    }
  };

  // Botón de prueba rápida en tiempo real con 1 clic
  const handleTestQuickSync = () => {
    const ubicacionesDemo = [
      'Ascensor Torre 2 - Parada Piso 8',
      'Portón Vehicular Principal - Sensor Infrarrojo',
      'Piscina de Adultos - Bomba de recirculación',
      'Parqueadero Visitantes Celda 12',
      'Garita Portería - Citófono Interior'
    ];
    const descripcionesDemo = [
      'Prueba de transmisión en vivo de WebSocket en tiempo real.',
      'Sincronización confirmada entre vigilante y administración central.',
      'Test de integridad de datos y blindaje de código Urbix PH.'
    ];

    const pickLoc = ubicacionesDemo[Math.floor(Math.random() * ubicacionesDemo.length)];
    const pickDesc = descripcionesDemo[Math.floor(Math.random() * descripcionesDemo.length)];

    setLocationNov(pickLoc);
    setDescNov(pickDesc);
    setCategoryNov('Infraestructura / Daño');
  };

  const sqlSetupScript = `-- ==============================================================================
-- URBIX PH - ESQUEMA DDL & REPLICACIÓN EN TIEMPO REAL (SUPABASE)
-- Ejecuta este script en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Tabla de Reportes de Mantenimiento y Portería
CREATE TABLE IF NOT EXISTS public.maintenance_reports (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  tenant_id TEXT NOT NULL DEFAULT 'ten_01',
  category TEXT NOT NULL DEFAULT 'Infraestructura / Daño',
  location TEXT NOT NULL,
  description TEXT NOT NULL,
  vigilante_name TEXT NOT NULL DEFAULT 'Guarda en Turno',
  status TEXT NOT NULL DEFAULT 'Reportado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Habilitar Row Level Security (RLS) Blindado
ALTER TABLE public.maintenance_reports ENABLE ROW LEVEL SECURITY;

-- 3. Crear Políticas de Seguridad RLS
DROP POLICY IF EXISTS "Lectura pública permitida" ON public.maintenance_reports;
CREATE POLICY "Lectura pública permitida" ON public.maintenance_reports
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inserción permitida para vigilantes y usuarios" ON public.maintenance_reports;
CREATE POLICY "Inserción permitida para vigilantes y usuarios" ON public.maintenance_reports
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Actualización autorizada" ON public.maintenance_reports;
CREATE POLICY "Actualización autorizada" ON public.maintenance_reports
  FOR UPDATE USING (true);

-- 4. CRÍTICO: Habilitar replicación en Tiempo Real (WebSocket)
ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_reports;
`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlSetupScript);
    setCopiedSql(true);
    showNotification('¡Script SQL copiado al portapapeles! Pégalo en el SQL Editor de Supabase.', 'success');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="bg-[#090d14] text-slate-100 p-5 font-sans rounded-3xl border-2 border-cyan-500/30 shadow-[0_0_30px_rgba(0,242,254,0.15)] relative overflow-hidden">
      
      {/* Resplandor ambiental de fondo */}
      <div className="absolute -top-16 -right-16 w-60 h-60 bg-[#00f2fe]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6 relative">
        
        {/* CABECERA CON ESTADO EN TIEMPO REAL */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#05131e] border border-[#00f2fe]/40 flex items-center justify-center text-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,0.3)] shrink-0">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base sm:text-lg text-white">
                  Portería & Mantenimiento en Tiempo Real
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                  Supabase Live
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Transmisión bi-direccional instantánea entre guardas y administración
              </p>
            </div>
          </div>

          {/* INSIGNIA DE ESTADO DE CONEXIÓN */}
          <div className="flex items-center gap-2 shrink-0">
            {realtimeStatus === 'SUBSCRIBED' ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tiempo Real Activo</span>
              </div>
            ) : realtimeStatus === 'CONNECTING' ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>Conectando WebSocket...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span>Modo Resiliente</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowSqlGuide(!showSqlGuide)}
              className="px-2.5 py-1.5 rounded-xl bg-[#05131e] border border-cyan-500/40 text-[#00f2fe] text-xs font-mono font-bold hover:bg-[#00f2fe]/10 transition cursor-pointer flex items-center gap-1"
              title="Ver esquema SQL y activación de realtime"
            >
              <Database className="w-3.5 h-3.5" />
              <span>SQL RLS</span>
            </button>
          </div>
        </div>

        {/* NOTIFICACIÓN TOAST INLINE */}
        {notifMessage && (
          <div className={`p-3 rounded-2xl border text-xs font-mono flex items-center justify-between gap-2 animate-fadeIn ${
            notifMessage.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : notifMessage.type === 'warning'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
          }`}>
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {notifMessage.text}
            </span>
            <button 
              type="button" 
              onClick={() => setNotifMessage(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* PANEL GUÍA SQL / RLS CUANDO SE ABRE */}
        {showSqlGuide && (
          <div className="bg-[#05080e] border border-cyan-500/40 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#00f2fe]" />
                <span className="text-xs font-bold text-white font-mono uppercase">
                  Script SQL para tu Supabase (Replicación en Tiempo Real & RLS)
                </span>
              </div>
              <button
                type="button"
                onClick={copySqlToClipboard}
                className="px-3 py-1 bg-[#00f2fe] hover:bg-cyan-300 text-slate-950 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,242,254,0.4)]"
              >
                {copiedSql ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedSql ? '¡Copiado!' : 'Copiar SQL'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              Para que los cambios se reflejen entre varias pestañas en tiempo real sin recargar, 
              copia este script y ejecútalo en tu <strong className="text-cyan-300">Supabase Dashboard &gt; SQL Editor</strong>.
            </p>
            <pre className="text-[10px] font-mono bg-black/60 p-3 rounded-xl border border-slate-800 text-cyan-300 overflow-x-auto max-h-48 leading-relaxed">
              {sqlSetupScript}
            </pre>
          </div>
        )}

        {/* FORMULARIO DE NOVEDADES */}
        <div className="bg-[#05080e] border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-cyan-400" />
              Reportar Incidencia o Novedad de Vigilancia
            </h3>
            
            <button
              type="button"
              onClick={handleTestQuickSync}
              className="text-[11px] font-mono text-[#00f2fe] hover:text-white bg-[#00f2fe]/10 hover:bg-[#00f2fe]/20 border border-[#00f2fe]/30 px-3 py-1 rounded-xl transition cursor-pointer flex items-center gap-1 self-start sm:self-auto"
            >
              <Sparkles className="w-3 h-3 text-[#00f2fe]" /> Auto-Llenar Ejemplo de Prueba
            </button>
          </div>

          <form onSubmit={handleReportNovedad} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Categoría</label>
                <select
                  value={categoryNov}
                  onChange={(e) => setCategoryNov(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-[#090d14] border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/40 font-mono"
                >
                  <option>Infraestructura / Daño</option>
                  <option>Seguridad / Puertas / Censores</option>
                  <option>Iluminación / Tableros</option>
                  <option>Ascensores / Bombas</option>
                  <option>Convivencia / Ruido</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Ubicación Precisa</label>
                <input
                  type="text"
                  placeholder="Ej. Sótano 2, Torre 3, Celda 45"
                  value={locationNov}
                  onChange={(e) => setLocationNov(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-[#090d14] border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/40 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-slate-400">Descripción del Suceso</label>
              <textarea
                rows={2}
                placeholder="Detalle de la novedad observada por el personal de portería..."
                value={descNov}
                onChange={(e) => setDescNov(e.target.value)}
                className="w-full mt-1 p-2.5 bg-[#090d14] border border-slate-700 text-white rounded-xl text-xs outline-none resize-none focus:border-[#00f2fe] focus:ring-1 focus:ring-[#00f2fe]/40 font-mono"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !locationNov.trim() || !descNov.trim()}
              className="w-full bg-gradient-to-r from-[#00f2fe] to-cyan-400 hover:brightness-110 text-slate-950 text-xs font-black py-3 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,242,254,0.3)] transition disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Transmitiendo a Supabase...' : 'Publicar Registro en Tiempo Real'}
            </button>
          </form>

          {/* LISTA EN TIEMPO REAL */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 font-mono pb-1 border-b border-slate-800">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                Registros Transmitidos en Vivo
              </span>
              <span className="text-[#00f2fe] font-mono">{novedades.length} reportes</span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {novedades.map((nov) => (
                <div 
                  key={nov.id} 
                  className={`p-3.5 bg-[#07090e] border rounded-xl flex items-start justify-between text-xs transition duration-300 ${
                    nov.isRealtimeLive 
                      ? 'border-[#00f2fe] shadow-[0_0_15px_rgba(0,242,254,0.25)] bg-[#05131e]' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white font-mono">{nov.category}</span>
                      {nov.isRealtimeLive && (
                        <span className="text-[9px] font-mono bg-[#00f2fe]/20 text-[#00f2fe] px-1.5 py-0.5 rounded font-bold animate-pulse">
                          ⚡ EN VIVO
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 font-medium">
                      <span className="text-[#00f2fe] font-semibold">{nov.location}:</span> {nov.description}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono pt-1">
                      <span>👤 {nov.vigilante_name || 'Guarda en Turno'}</span>
                      <span>•</span>
                      <span>🕒 {nov.created_at ? new Date(nov.created_at).toLocaleTimeString() : 'Reciente'}</span>
                    </div>
                  </div>

                  <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-1 rounded-lg font-bold font-mono shrink-0">
                    {nov.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
