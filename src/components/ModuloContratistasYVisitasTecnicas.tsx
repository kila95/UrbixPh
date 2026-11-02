import React, { useState } from 'react';
import { HardHat, ShieldCheck, AlertTriangle, CheckCircle2, Search, QrCode } from 'lucide-react';

export const DEFAULT_CONTRATISTAS_VISITAS_TECNICAS = [
  {
    id: 'con_01',
    empresa: 'Claro Colombia (Fibra Óptica)',
    tecnico: 'Andrés Felipe Morales',
    cedula: '1.037.492.102',
    aptoDestino: 'Torre 2 - 301',
    tipoIngreso: 'Pre-autorizado (Convenio Marco)',
    arlVigente: true,
    polizaRce: true,
    estadoPorteria: 'Adentro en Labor',
    horaIngreso: '09:15 AM'
  },
  {
    id: 'con_02',
    empresa: 'Técnico Independiente (Instalación Aire Acondicionado)',
    tecnico: 'Jhon Jairo Arango',
    cedula: '71.594.203',
    aptoDestino: 'Torre 1 - 502',
    tipoIngreso: 'Excepción / Verificado Manual PILA',
    arlVigente: true,
    polizaRce: false,
    estadoPorteria: 'Pendiente Validación Supervisor',
    horaIngreso: '10:02 AM'
  }
];

export default function ModuloContratistasYVisitasTecnicas({
  contratistasShared = [],
  setContratistasShared,
  onShowToast
}: {
  contratistasShared?: any[];
  setContratistasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  onShowToast?: (msg: string) => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Simulación de listado sincronizado con portería (Paso 1, 2, 3 y 4)
  const contratistasList = contratistasShared && contratistasShared.length > 0 ? contratistasShared : DEFAULT_CONTRATISTAS_VISITAS_TECNICAS;

  // Autorizar o revocar ingreso excepcional desde Supervisión
  const handleCambiarEstadoContratista = (id: string, nuevoEstado: string) => {
    if (setContratistasShared) {
      setContratistasShared((prev: any[]) => {
        const baseList = prev && prev.length > 0 ? prev : DEFAULT_CONTRATISTAS_VISITAS_TECNICAS;
        return baseList.map((c: any) => c.id === id ? { ...c, estadoPorteria: nuevoEstado } : c);
      });
    }
    if (onShowToast) {
      onShowToast(`👷 Estado del contratista actualizado a: ${nuevoEstado}`);
    }
  };

  const contratistasFiltrados = contratistasList.filter((c: any) => {
    const matchTexto = (c.empresa || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                       (c.tecnico || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                       (c.aptoDestino || '').toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = filtroEstado === 'Todos' || c.estadoPorteria === filtroEstado;
    return matchTexto && matchEstado;
  });

  return (
    <div className="bg-[#0B0F19] text-slate-200 p-6 font-sans border border-slate-800/80 rounded-2xl shadow-xl mt-6">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/80 pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
            <HardHat className="w-4 h-4" />
            SG-SST Decreto 1072 • Control de Contratistas y Proveedores
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            Monitoreo de Técnicos Externos y Obras en Torres (Supervisión)
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Supervisa quién ingresó por garita con convenios pre-aprobados (Paso 1 y 2) o autoriza excepciones retenidas en portería (Paso 3).
          </p>
        </div>

        {/* Resumen rápido */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">En el Edificio Hoy</p>
            <p className="text-lg font-black text-emerald-400">
              {contratistasList.filter((c: any) => c.estadoPorteria === 'Adentro en Labor').length} Técnicos
            </p>
          </div>
          <div className="bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl text-center">
            <p className="text-[10px] font-bold text-slate-500 uppercase">Retenidos en Garita</p>
            <p className="text-lg font-black text-amber-400">
              {contratistasList.filter((c: any) => c.estadoPorteria === 'Pendiente Validación Supervisor').length} Por Aprobar
            </p>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          {['Todos', 'Adentro en Labor', 'Pendiente Validación Supervisor', 'Retirado / Finalizó'].map((est) => (
            <button
              key={est}
              type="button"
              onClick={() => setFiltroEstado(est)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filtroEstado === est 
                  ? 'bg-amber-600 text-white shadow-md' 
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {est}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input 
            type="text"
            placeholder="Buscar empresa, técnico o apto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
          />
        </div>
      </div>

      {/* TABLA / TARJETAS DE CONTRATISTAS EN TIEMPO REAL */}
      <div className="space-y-3">
        {contratistasFiltrados.map((item: any) => (
          <div 
            key={item.id} 
            className={`p-4 rounded-xl border transition-all flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 ${
              item.estadoPorteria === 'Pendiente Validación Supervisor'
                ? 'bg-amber-950/15 border-amber-500/40'
                : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-white bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                  🏢 {item.empresa}
                </span>
                <span className="text-xs font-bold text-indigo-400 bg-indigo-950/40 px-2.5 py-1 rounded-md border border-indigo-800/50">
                  📍 Destino: {item.aptoDestino}
                </span>
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <QrCode className="w-3 h-3 text-emerald-400" /> {item.tipoIngreso}
                </span>
              </div>

              <p className="text-sm font-bold text-slate-200">
                👷 Técnico: <span className="text-white">{item.tecnico}</span> • CC: <span className="font-mono text-slate-400">{item.cedula}</span> • Ingreso: <span className="text-emerald-400">{item.horaIngreso}</span>
              </p>

              {/* Semáforo Documental SG-SST */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <span className={`text-[11px] font-bold flex items-center gap-1 ${item.arlVigente ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.arlVigente ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  Planilla ARL / EPS: {item.arlVigente ? 'Vigente (Verificada)' : 'Vencida / Sin Soporte'}
                </span>

                <span className={`text-[11px] font-bold flex items-center gap-1 ${item.polizaRce ? 'text-emerald-400' : 'text-amber-400'}`}>
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Póliza Daños a Terceros (RCE): {item.polizaRce ? 'Cubierta por Convenio' : 'Sin Póliza (Riesgo Copropiedad)'}
                </span>
              </div>
            </div>

            {/* CONTROLES DEL SUPERVISOR */}
            <div className="flex items-center gap-3 w-full lg:w-auto justify-end border-t lg:border-t-0 border-slate-800 pt-3 lg:pt-0">
              <select
                value={item.estadoPorteria}
                onChange={(e) => handleCambiarEstadoContratista(item.id, e.target.value)}
                className={`text-xs font-bold rounded-xl px-3 py-2 border outline-none cursor-pointer ${
                  item.estadoPorteria === 'Adentro en Labor'
                    ? 'bg-emerald-950/50 border-emerald-600/50 text-emerald-300'
                    : item.estadoPorteria === 'Pendiente Validación Supervisor'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                    : 'bg-slate-900 border-slate-700 text-slate-400'
                }`}
              >
                <option value="Pendiente Validación Supervisor">⏳ Retenido en Garita (Por Aprobar)</option>
                <option value="Adentro en Labor">✅ Autorizado / Adentro en Labor</option>
                <option value="Retirado / Finalizó">🚪 Retirado / Labor Finalizada</option>
                <option value="Acceso Denegado (Riesgo ARL)">🚫 Acceso Denegado (Falta ARL)</option>
              </select>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
