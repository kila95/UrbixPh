import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ParkingSquare, Plus, Car, Bike, X, Layers, Trash2 } from 'lucide-react';

export interface ModalConfiguradorParqueaderosProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onBahiasActualizadas: () => void;
  onShowToast?: (msg: string) => void;
}

export default function ModalConfiguradorParqueaderos({
  tenantId,
  isOpen,
  onClose,
  onBahiasActualizadas,
  onShowToast
}: ModalConfiguradorParqueaderosProps) {
  const [modo, setModo] = useState<'lote' | 'individual'>('lote');
  const [guardando, setGuardando] = useState(false);

  // Formulario Individual
  const [tipoInd, setTipoInd] = useState<'CARRO' | 'MOTO'>('CARRO');
  const [nomenclaturaInd, setNomenclaturaInd] = useState('');
  const [zonaInd, setZonaInd] = useState('Sótano 1');

  // Formulario en Lote (Masivo)
  const [tipoLote, setTipoLote] = useState<'CARRO' | 'MOTO'>('CARRO');
  const [prefijoLote, setPrefijoLote] = useState('V-');
  const [cantidadLote, setCantidadLote] = useState(15);
  const [zonaLote, setZonaLote] = useState('Bahía Visitantes Sótano 1');

  if (!isOpen) return null;

  // 1. Guardar Celda Individual en Supabase
  const handleGuardarIndividual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomenclaturaInd.trim()) return;

    try {
      setGuardando(true);
      const { error } = await supabase.from('visitor_parking_slots').insert([{
        tenant_id: tenantId,
        slot_number: nomenclaturaInd.trim().toUpperCase(),
        zone: zonaInd.trim(),
        vehicle_type: tipoInd,
        status: 'DISPONIBLE'
      }]);

      if (error) throw error;

      onShowToast?.(`Bahía ${nomenclaturaInd.toUpperCase()} creada con éxito`);
      setNomenclaturaInd('');
      onBahiasActualizadas();
    } catch (err: any) {
      alert('Error creando bahía: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  // 2. Generación Masiva en Lote en Supabase
  const handleGenerarLote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cantidadLote <= 0) return;

    try {
      setGuardando(true);
      const registros = [];

      for (let i = 1; i <= cantidadLote; i++) {
        const numeroFormateado = i < 10 ? `0${i}` : `${i}`;
        registros.push({
          tenant_id: tenantId,
          slot_number: `${prefijoLote.trim().toUpperCase()}${numeroFormateado}`,
          zone: zonaLote.trim(),
          vehicle_type: tipoLote,
          status: 'DISPONIBLE'
        });
      }

      const { error } = await supabase
        .from('visitor_parking_slots')
        .upsert(registros, { onConflict: 'tenant_id,slot_number' });

      if (error) throw error;

      onShowToast?.(`Se crearon ${cantidadLote} bahías de ${tipoLote.toLowerCase()} en la base de datos.`);
      onBahiasActualizadas();
      onClose();
    } catch (err: any) {
      alert('Error en generación masiva: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl font-sans text-slate-100">
        
        {/* Encabezado */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <ParkingSquare className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Configuración del Inventario de Bahías</h3>
              <p className="text-[11px] text-slate-400 font-mono">Panel de Parametrización (Administrador)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Modo: Masivo vs Individual */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setModo('lote')}
            className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              modo === 'lote' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Generar en Lote (Recomendado)</span>
          </button>
          <button
            type="button"
            onClick={() => setModo('individual')}
            className={`py-2 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
              modo === 'individual' ? 'bg-cyan-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar Celda Individual</span>
          </button>
        </div>

        {/* FORMA 1: GENERACIÓN EN LOTE (MASIVO) */}
        {modo === 'lote' ? (
          <form onSubmit={handleGenerarLote} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Tipo de Bahía</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTipoLote('CARRO');
                    setPrefijoLote('V-');
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer font-bold ${
                    tipoLote === 'CARRO' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>Carros</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTipoLote('MOTO');
                    setPrefijoLote('M-');
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-2 cursor-pointer font-bold ${
                    tipoLote === 'MOTO' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  <span>Motos</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Prefijo Nomenclatura</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. V- o M-"
                  value={prefijoLote}
                  onChange={(e) => setPrefijoLote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Total de Celdas a Crear</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={cantidadLote}
                  onChange={(e) => setCantidadLote(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-center font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Ubicación / Sector Físico</label>
              <input
                type="text"
                required
                placeholder="Ej. Sótano 1 - Zona Visitantes"
                value={zonaLote}
                onChange={(e) => setZonaLote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400">
              Vista previa: Se crearán las celdas desde <strong className="text-cyan-300">{prefijoLote}01</strong> hasta <strong className="text-cyan-300">{prefijoLote}{cantidadLote < 10 ? `0${cantidadLote}` : cantidadLote}</strong> en estado disponible.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                {guardando ? 'Aprovisionando...' : 'Crear Lote de Bahías'}
              </button>
            </div>
          </form>
        ) : (
          /* FORMA 2: REGISTRO INDIVIDUAL */
          <form onSubmit={handleGuardarIndividual} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Tipo</label>
              <select
                value={tipoInd}
                onChange={(e) => setTipoInd(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              >
                <option value="CARRO">Carro</option>
                <option value="MOTO">Moto</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Nomenclatura Exacta</label>
              <input
                type="text"
                required
                placeholder="Ej. V-21 o M-08"
                value={nomenclaturaInd}
                onChange={(e) => setNomenclaturaInd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-mono uppercase text-[10px]">Zona / Sótano</label>
              <input
                type="text"
                required
                placeholder="Ej. Sótano 2"
                value={zonaInd}
                onChange={(e) => setZonaInd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-medium cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl cursor-pointer disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar Celda'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
