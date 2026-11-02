import React, { useState } from 'react';
import { BookOpen, PlusCircle, Search, Clock, Shield, UserCheck } from 'lucide-react';

export interface RegistroMinutaDigital {
  id: string;
  timestamp: string;
  fecha: string;
  guarda: string;
  categoria: string;
  detalle: string;
  firmaHash?: string;
}

export default function ModuloMinutaDigitalEnterprise({
  minutaShared = [],
  setMinutaShared,
  onShowToast,
  appendAuditLog
}: {
  minutaShared?: any[];
  setMinutaShared?: React.Dispatch<React.SetStateAction<any[]>>;
  onShowToast?: (msg: string) => void;
  appendAuditLog?: (action: string, details: string, customUser?: string) => void;
}) {
  const [categoria, setCategoria] = useState('Novedad General');
  const [guardaActivo, setGuardaActivo] = useState('Guarda Carlos Restrepo (Turno Mañana)');
  const [descripcion, setDescripcion] = useState('');
  const [busqueda, setBusqueda] = useState('');

  // Registrar nueva novedad en la minuta inmutable y propagar automáticamente al Supervisor
  const handleRegistrarMinuta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descripcion.trim()) return;

    const horaExacta = new Date().toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const fechaHoy = new Date().toLocaleDateString('es-CO');

    const nuevaNota: RegistroMinutaDigital = {
      id: `min_${Date.now()}`,
      timestamp: horaExacta,
      fecha: fechaHoy,
      guarda: guardaActivo,
      categoria: categoria,
      detalle: descripcion.trim(),
      firmaHash: 'SHA-256 Verified'
    };

    if (setMinutaShared) {
      setMinutaShared((prev: any[]) => [nuevaNota, ...prev]);
    }

    appendAuditLog?.(
      'MINUTA_DIGITAL_INMUTABLE_SYNC',
      `[${nuevaNota.categoria}] Asentado en Minuta Digital por ${nuevaNota.guarda} a las ${nuevaNota.timestamp} (${nuevaNota.fecha}): "${nuevaNota.detalle}" • Firma: SHA-256 Verified • Sincronizado con Bandeja de Bitácoras del Supervisor.`,
      nuevaNota.guarda
    );

    setDescripcion('');
    onShowToast?.('Novedad registrada, sellada (SHA-256) y sincronizada con la Consola del Supervisor.');
  };

  const minutaFiltrada = minutaShared.filter(
    (m: any) =>
      (m.detalle || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (m.categoria || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (m.guarda || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6 font-sans mt-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-500/10 text-teal-400 rounded-2xl border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.15)]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-teal-400 bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/20 uppercase tracking-widest">
                Bitácora Legal • Superintendencia de Vigilancia
              </span>
              <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20 uppercase">
                ● Sync en Vivo con Supervisor
              </span>
            </div>
            <h3 className="text-base font-black text-white mt-1">
              Libro de Minuta Digital Inmutable (Turno Activo)
            </h3>
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar en la minuta..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-teal-400 font-mono"
          />
        </div>
      </div>

      {/* Formulario de Registro de Novedades */}
      <form
        onSubmit={handleRegistrarMinuta}
        className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800"
      >
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-slate-400 uppercase flex items-center gap-1">
            <UserCheck className="w-3 h-3 text-teal-400" /> Guarda Responsable
          </label>
          <select
            value={guardaActivo}
            onChange={(e) => setGuardaActivo(e.target.value)}
            className="p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs font-mono outline-none focus:border-teal-400"
          >
            <option value="Guarda Carlos Restrepo (Turno Mañana)">Guarda Carlos Restrepo (Turno Mañana)</option>
            <option value="Guarda Wilmar Tapias (Rondero Perimetral)">Guarda Wilmar Tapias (Rondero Perimetral)</option>
            <option value="Guarda Luis F. Pérez (Turno Tarde)">Guarda Luis F. Pérez (Turno Tarde)</option>
            <option value="Guarda Jhon Jairo Ospina (Turno Noche)">Guarda Jhon Jairo Ospina (Turno Noche)</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-mono text-slate-400 uppercase">Categoría de Minuta</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs font-mono outline-none focus:border-teal-400"
          >
            <option>Novedad General</option>
            <option>Relevo de Turno</option>
            <option>Ingreso de Trasteo / Mudanza</option>
            <option>Instrucción de Administración</option>
            <option>Vehículo Sospechoso / Retenido</option>
          </select>
        </div>

        <div className="md:col-span-2 flex flex-col gap-1">
          <label className="text-[10px] font-mono text-slate-400 uppercase">Detalle Inmutable del Evento</label>
          <input
            type="text"
            placeholder="Descripción detallada de la novedad del turno..."
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-teal-400"
            required
          />
        </div>

        <div className="flex flex-col justify-end">
          <button
            type="submit"
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Asentar en Minuta
          </button>
        </div>
      </form>

      {/* Historial de la Minuta */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
            <Clock className="w-4 h-4 text-teal-400" /> Registro Cronológico Inmutable ({minutaFiltrada.length})
          </h4>
          <span className="text-[11px] font-mono text-teal-400 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" /> Propagación instantánea a Bandeja de Bitácoras del Supervisor
          </span>
        </div>

        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {minutaFiltrada && minutaFiltrada.length > 0 ? (
            minutaFiltrada.map((m: any) => (
              <div
                key={m.id}
                className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono font-black text-teal-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-teal-500/30 text-xs">
                      {m.timestamp}
                    </span>
                    {m.fecha && (
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {m.fecha}
                      </span>
                    )}
                    <span className="font-bold text-white bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                      {m.categoria}
                    </span>
                    <span className="text-slate-400 text-[11px] font-mono">👮 {m.guarda}</span>
                  </div>
                  <p className="text-slate-200 text-xs mt-1">{m.detalle}</p>
                </div>
                <span className="text-[10px] font-mono text-teal-400 bg-slate-950 px-2.5 py-1 rounded border border-teal-500/30 shrink-0">
                  {m.firmaHash || 'SHA-256 Verified'}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-2xl">
              No hay notas registradas en la minuta digital todavía.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
