import React, { useState } from 'react';
import { 
  Building2, 
  Radio, 
  PhoneCall, 
  AlertTriangle, 
  X, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  ShieldCheck,
  Wrench,
  Search,
  Check
} from 'lucide-react';

type TipoModal = 'copropiedades' | 'garitas' | 'llamadas' | 'tickets' | null;

export default function TarjetasKpiInteractivas() {
  const [modalActivo, setModalActivo] = useState<TipoModal>(null);

  // Datos simulados en tiempo real para cada drill-down modal
  const copropiedadesDetalle = [
    { id: '1', nombre: 'Reserva del Tesoro PH', ciudad: 'Medellín, El Poblado', unidades: 180, estado: 'Activo', garitaIp: '192.168.1.101', ley: 'Ley 675' },
    { id: '2', nombre: 'Torres de San Juan', ciudad: 'Medellín, Laureles', unidades: 96, estado: 'Alerta Garita', garitaIp: '192.168.2.45', ley: 'Ley 675' },
    { id: '3', nombre: 'Altos del Poblado', ciudad: 'Medellín, El Poblado', unidades: 240, estado: 'Activo', garitaIp: '192.168.1.105', ley: 'Ley 675' },
    { id: '4', nombre: 'Plaza Belén PH', ciudad: 'Medellín, Belén', unidades: 112, estado: 'Activo', garitaIp: '192.168.3.12', ley: 'Ley 675' },
    { id: '5', nombre: 'Norte Real PH', ciudad: 'Bello, Niquía', unidades: 160, estado: 'Activo', garitaIp: '192.168.4.88', ley: 'Ley 675' },
    { id: '6', nombre: 'Envigado Campestre', ciudad: 'Envigado, Zuñiga', unidades: 200, estado: 'Activo', garitaIp: '192.168.5.20', ley: 'Ley 675' }
  ];

  const garitasDetalle = [
    { id: 'g1', copropiedad: 'Reserva del Tesoro', ip: '192.168.1.101', ping: '12ms', status: 'Online 🟢', canalWebRTC: 'Cifrado TLS 1.3' },
    { id: 'g2', copropiedad: 'Torres de San Juan', ip: '192.168.2.45', ping: 'Offline 🔴', status: 'Reconectando...', canalWebRTC: 'Fallo de Red Local' },
    { id: 'g3', copropiedad: 'Altos del Poblado', ip: '192.168.1.105', ping: '18ms', status: 'Online 🟢', canalWebRTC: 'Cifrado TLS 1.3' },
    { id: 'g4', copropiedad: 'Plaza Belén PH', ip: '192.168.3.12', ping: '14ms', status: 'Online 🟢', canalWebRTC: 'Cifrado TLS 1.3' },
    { id: 'g5', copropiedad: 'Norte Real PH', ip: '192.168.4.88', ping: '22ms', status: 'Online 🟢', canalWebRTC: 'Cifrado TLS 1.3' }
  ];

  const llamadasDetalle = [
    { id: 'c1', hora: '10:42 AM', copropiedad: 'Reserva del Tesoro', origen: 'Garita Principal', destino: 'Apto 1204', duracion: '45s', estado: 'Completada 📞' },
    { id: 'c2', hora: '10:38 AM', copropiedad: 'Altos del Poblado', origen: 'Garita Vehicular', destino: 'Apto 502', duracion: '1m 12s', estado: 'Completada 📞' },
    { id: 'c3', hora: '10:35 AM', copropiedad: 'Envigado Campestre', origen: 'Garita Peatonal', destino: 'Apto 301', duracion: '22s', estado: 'Completada 📞' },
    { id: 'c4', hora: '10:15 AM', copropiedad: 'Plaza Belén PH', origen: 'Garita Principal', destino: 'Apto 804', duracion: '30s', estado: 'Completada 📞' }
  ];

  const ticketsDetalle = [
    { id: 'tk101', copropiedad: 'Torres de San Juan', asunto: 'Desconexión de Garita Principal por microcorte de red local ISP', prioridad: 'Alta', tiempo: 'Hace 15 min', responsable: 'Mesa de Soporte Urbix' },
    { id: 'tk102', copropiedad: 'Plaza Belén PH', asunto: 'Ajuste de permisos de residente para asignación de parqueadero', prioridad: 'Media', tiempo: 'Hace 45 min', responsable: 'Mesa de Soporte Urbix' }
  ];

  return (
    <>
      {/* 4 TARJETAS KPI CLICKABLES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono select-none">
        
        {/* TARJETA 1: COPROPIEDADES */}
        <div
          onClick={() => setModalActivo('copropiedades')}
          className="bg-[#090d14] border border-cyan-500/20 hover:border-cyan-400 p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,242,254,0.15)] group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Copropiedades Activas</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-black text-white">12 / 12</p>
            <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Ley 675
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Clic para ver catálogo completo</span>
            <span className="text-cyan-400 font-bold group-hover:translate-x-0.5 transition-transform">Ver &rarr;</span>
          </p>
        </div>

        {/* TARJETA 2: GARITAS ONLINE */}
        <div
          onClick={() => setModalActivo('garitas')}
          className="bg-[#090d14] border border-emerald-500/20 hover:border-emerald-400 p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Garitas Online</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-emerald-400 transition-opacity" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-black text-emerald-400">11 En Línea</p>
            <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold animate-pulse flex items-center gap-1">
              <Radio className="w-3 h-3" /> 1 Off
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>1 Dispositivo requiriendo asistencia</span>
            <span className="text-emerald-400 font-bold group-hover:translate-x-0.5 transition-transform">Ver &rarr;</span>
          </p>
        </div>

        {/* TARJETA 3: LLAMADAS CITÓFONO */}
        <div
          onClick={() => setModalActivo('llamadas')}
          className="bg-[#090d14] border border-cyan-500/20 hover:border-cyan-400 p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,242,254,0.15)] group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Llamadas Citófono (Hoy)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-cyan-400 transition-opacity" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-black text-cyan-300">348 Sesiones</p>
            <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <PhoneCall className="w-3 h-3" /> WebRTC
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Tráfico activo de voz e imágenes</span>
            <span className="text-cyan-300 font-bold group-hover:translate-x-0.5 transition-transform">Ver &rarr;</span>
          </p>
        </div>

        {/* TARJETA 4: TICKETS SOPORTE */}
        <div
          onClick={() => setModalActivo('tickets')}
          className="bg-[#090d14] border border-amber-500/20 hover:border-amber-400 p-4 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Tickets Soporte Abiertos</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-amber-400 transition-opacity" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-2xl font-black text-amber-300">2 Pendientes</p>
            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Atención
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>SLA de respuesta &lt; 15 min</span>
            <span className="text-amber-300 font-bold group-hover:translate-x-0.5 transition-transform">Ver &rarr;</span>
          </p>
        </div>

      </div>

      {/* MODAL DRILL-DOWN INTERACTIVO */}
      {modalActivo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 font-mono select-none animate-fadeIn">
          <div className="bg-[#080d1a] border border-cyan-500/30 rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-[0_0_40px_rgba(0,242,254,0.2)]">
            
            {/* CABECERA DEL MODAL */}
            <div className="p-5 border-b border-cyan-500/20 flex items-center justify-between bg-[#060912]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-950 border border-cyan-500/30 text-[#00f2fe]">
                  {modalActivo === 'copropiedades' && <Building2 className="w-5 h-5" />}
                  {modalActivo === 'garitas' && <Radio className="w-5 h-5" />}
                  {modalActivo === 'llamadas' && <PhoneCall className="w-5 h-5" />}
                  {modalActivo === 'tickets' && <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-black text-white capitalize">
                    {modalActivo === 'copropiedades' && 'Catálogo Global de Copropiedades (Ley 675)'}
                    {modalActivo === 'garitas' && 'Estado de Dispositivos y Garitas de Portería'}
                    {modalActivo === 'llamadas' && 'Registro de Citofonía y Sesiones WebRTC (Hoy)'}
                    {modalActivo === 'tickets' && 'Mesa de Ayuda y Tickets de Soporte Técnico'}
                  </h3>
                  <p className="text-xs text-cyan-400/70">
                    Inspección detallada de datos operativos en tiempo real
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalActivo(null)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CONTENIDO SCROLLABLE SEGÚN EL KPI SELECCIONADO */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
              
              {/* MODAL 1: COPROPIEDADES */}
              {modalActivo === 'copropiedades' && (
                <div className="space-y-4">
                  <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl flex items-center justify-between text-cyan-300 text-[11px]">
                    <span className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#00f2fe]" /> Total Copropiedades bajo régimen Ley 675: <strong>12 Licenciadas</strong>
                    </span>
                    <span className="text-[10px] bg-cyan-900/60 px-2 py-0.5 rounded-full border border-cyan-400/30">1.480 Unidades Totales</span>
                  </div>
                  
                  <div className="space-y-2">
                    {copropiedadesDetalle.map((c) => (
                      <div key={c.id} className="p-3.5 bg-[#0b101d] border border-slate-800 hover:border-cyan-500/40 rounded-2xl flex items-center justify-between transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{c.nombre}</span>
                            <span className="text-[9px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">{c.ciudad}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {c.unidades} Unidades Residenciales • IP Garita: <code className="text-cyan-400">{c.garitaIp}</code>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            c.estado === 'Activo' 
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' 
                              : 'bg-amber-950 text-amber-400 border-amber-500/30 animate-pulse'
                          }`}>
                            {c.estado}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MODAL 2: GARITAS ONLINE */}
              {modalActivo === 'garitas' && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-emerald-300 text-[11px]">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Dispositivos de Portería Sincronizados: <strong>11 de 12 Online</strong>
                    </span>
                    <span className="text-[10px] bg-amber-950 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">1 Alerta Activa</span>
                  </div>

                  <div className="space-y-2">
                    {garitasDetalle.map((g) => (
                      <div key={g.id} className="p-3.5 bg-[#0b101d] border border-slate-800 hover:border-emerald-500/40 rounded-2xl flex items-center justify-between transition">
                        <div>
                          <p className="font-bold text-white text-sm">{g.copropiedad}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            IP: <code className="text-cyan-400">{g.ip}</code> • Latencia: <span className="text-slate-300">{g.ping}</span>
                          </p>
                        </div>
                        <div className="text-right space-y-1">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border inline-block ${
                            g.status.includes('Online') 
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' 
                              : 'bg-rose-950 text-rose-400 border-rose-500/30 animate-pulse'
                          }`}>
                            {g.status}
                          </span>
                          <p className="text-[9px] text-slate-500">{g.canalWebRTC}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MODAL 3: LLAMADAS CITÓFONO */}
              {modalActivo === 'llamadas' && (
                <div className="space-y-4">
                  <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl flex items-center justify-between text-cyan-300 text-[11px]">
                    <span className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-cyan-400" /> Sesiones de Citofonía Virtual registradas hoy: <strong>348 Llamadas</strong>
                    </span>
                    <span className="text-[10px] bg-cyan-900/60 px-2 py-0.5 rounded-full border border-cyan-400/30">Cero llamadas perdidas</span>
                  </div>

                  <div className="space-y-2">
                    {llamadasDetalle.map((c) => (
                      <div key={c.id} className="p-3.5 bg-[#0b101d] border border-slate-800 hover:border-cyan-500/40 rounded-2xl flex items-center justify-between transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-400 text-[10px]">{c.hora}</span>
                            <span className="font-bold text-white text-sm">{c.copropiedad}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {c.origen} &rarr; <strong className="text-cyan-300">{c.destino}</strong>
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/30 px-2.5 py-1 rounded-full font-bold">
                            {c.duracion}
                          </span>
                          <p className="text-[9px] text-emerald-400 mt-1">{c.estado}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* MODAL 4: TICKETS SOPORTE */}
              {modalActivo === 'tickets' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-950/30 border border-amber-500/30 rounded-2xl flex items-center justify-between text-amber-300 text-[11px]">
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" /> Tickets en curso: <strong>2 Abiertos</strong>
                    </span>
                    <span className="text-[10px] bg-amber-900/60 px-2 py-0.5 rounded-full border border-amber-400/30">SOPORTE 24/7 ACTIVO</span>
                  </div>

                  <div className="space-y-3">
                    {ticketsDetalle.map((tk) => (
                      <div key={tk.id} className="p-4 bg-[#0b101d] border border-amber-500/30 rounded-2xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-amber-400 font-bold text-xs">Ticket #{tk.id} • {tk.copropiedad}</span>
                          <span className="text-[9px] bg-amber-950 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                            Prioridad {tk.prioridad}
                          </span>
                        </div>
                        <p className="text-slate-200 font-semibold text-xs">{tk.asunto}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                          <span>Reportado: {tk.tiempo}</span>
                          <span className="text-cyan-400 font-bold">{tk.responsable}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* PIE DEL MODAL CON BOTÓN DE CIERRE */}
            <div className="p-4 bg-[#060912] border-t border-cyan-500/20 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">Urbix PH • Plataforma Multi-Tenant Segura</span>
              <button
                onClick={() => setModalActivo(null)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs transition cursor-pointer shadow-[0_0_15px_rgba(0,242,254,0.3)]"
              >
                Cerrar Ventana
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
