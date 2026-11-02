import React, { useState } from 'react';
import { Package, PlusCircle, Search, CheckCircle2, Clock, Camera } from 'lucide-react';

export default function ModuloEncomiendasConFotoEnterprise({
  encomiendasShared = [],
  setEncomiendasShared,
  onShowToast
}: {
  encomiendasShared?: any[];
  setEncomiendasShared?: React.Dispatch<React.SetStateAction<any[]>>;
  onShowToast?: (msg: string) => void;
}) {
  const [torreApto, setTorreApto] = useState('');
  const [destinatario, setDestinatario] = useState('');
  const [empresaTransporte, setEmpresaTransporte] = useState('Mercado Libre');
  const [fotoEvidencia, setFotoEvidencia] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [pinValidacion, setPinValidacion] = useState('');
  const [paqueteSeleccionadoId, setPaqueteSeleccionadoId] = useState<string | null>(null);

  // Simular captura o carga de foto del paquete
  const handleSimularCapturaFoto = () => {
    // Simulamos una URL de imagen de evidencia en la garita
    const mockFotoUrl = 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=300&q=80';
    setFotoEvidencia(mockFotoUrl);
    onShowToast?.('📸 Foto de evidencia del paquete capturada exitosamente.');
  };

  // Registrar encomienda con PIN y Foto
  const handleRegistrarPaquete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!torreApto.trim() || !destinatario.trim()) {
      onShowToast?.('Por favor ingresa la torre, apartamento y el destinatario.');
      return;
    }

    const randomPin = `PIN-${Math.floor(1000 + Math.random() * 9000)}`;
    const fechaActual = `Hoy ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const nuevaEncomienda = {
      id: `enc_${Date.now()}`,
      guia: `GUIA-${Math.floor(100000 + Math.random() * 900000)}`,
      unidad: torreApto.trim(),
      destinatario: destinatario.trim(),
      empresa: empresaTransporte,
      casillero: `Casillero #${Math.floor(1 + Math.random() * 25)}`,
      pinRetiro: randomPin,
      codigoPin: randomPin,
      fotoUrl: fotoEvidencia || 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=300&q=80',
      fechaLlegada: fechaActual,
      fechaIngreso: fechaActual,
      horasCustodia: 0,
      estado: 'En Custodia',
      guardaReceptor: 'Guarda en Turno (Garita)'
    };

    if (setEncomiendasShared) {
      setEncomiendasShared((prev: any[]) => [nuevaEncomienda, ...prev]);
    }

    setTorreApto('');
    setDestinatario('');
    setFotoEvidencia(null);
    onShowToast?.(`Paquete registrado con evidencia fotográfica. PIN: ${randomPin}`);
  };

  // Entregar paquete validando PIN
  const handleEntregarPaquete = (id: string, pinCorrecto: string) => {
    const expected = String(pinCorrecto || '');
    if (
      pinValidacion.trim() !== expected.replace('PIN-', '') &&
      pinValidacion.trim().toUpperCase() !== expected.toUpperCase()
    ) {
      onShowToast?.('❌ PIN de retiro incorrecto.');
      return;
    }

    const horaEntrega = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (setEncomiendasShared) {
      setEncomiendasShared((prev: any[]) =>
        prev.map((p: any) =>
          p.id === id
            ? {
                ...p,
                estado: 'Entregado',
                fechaEntrega: horaEntrega,
                horaEntrega: horaEntrega
              }
            : p
        )
      );
    }

    setPinValidacion('');
    setPaqueteSeleccionadoId(null);
    onShowToast?.('✅ Paquete entregado al residente con éxito.');
  };

  const listaFiltrada = (encomiendasShared || []).filter((p: any) =>
    (p.unidad || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.destinatario || '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.empresa || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-2xl space-y-6 font-sans">
      
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/25 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20 uppercase tracking-widest">
              Control de Portería • Logística y Evidencia Fotográfica
            </span>
            <h3 className="text-base font-black text-white mt-1">Gestión de Encomiendas con Auditoría de Estado y Foto</h3>
          </div>
        </div>

        {/* Buscador rápido */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar apto, residente..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Formulario de Registro con Foto */}
      <form onSubmit={handleRegistrarPaquete} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <input
          type="text"
          placeholder="Torre y Apto (Ej: Torre 2 - 301)"
          value={torreApto}
          onChange={(e) => setTorreApto(e.target.value)}
          className="p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-amber-500"
          required
        />

        <input
          type="text"
          placeholder="Nombre del destinatario..."
          value={destinatario}
          onChange={(e) => setDestinatario(e.target.value)}
          className="p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs outline-none focus:border-amber-500"
          required
        />

        <select
          value={empresaTransporte}
          onChange={(e) => setEmpresaTransporte(e.target.value)}
          className="p-3 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs font-mono outline-none focus:border-amber-500"
        >
          <option>Mercado Libre</option>
          <option>Amazon Prime</option>
          <option>Servientrega</option>
          <option>Coordinadora</option>
          <option>Interrapidísimo</option>
        </select>

        {/* Botón de Captura de Foto */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSimularCapturaFoto}
            className={`flex-1 py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
              fotoEvidencia ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Camera className="w-4 h-4" /> {fotoEvidencia ? 'Foto OK ✓' : 'Tomar Foto'}
          </button>
        </div>

        <div className="md:col-span-4 pt-1">
          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Registrar Paquete con Evidencia en Custodia
          </button>
        </div>
      </form>

      {/* Listado de Encomiendas con Foto */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
          <Clock className="w-4 h-4 text-amber-400" /> Registro con Soporte Fotográfico en Custodia
        </h4>

        <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
          {listaFiltrada.length > 0 ? (
            listaFiltrada.map((p: any) => {
              const pinActual = p.pinRetiro || p.codigoPin || 'PIN-0000';
              const fechaActual = p.fechaLlegada || p.fechaIngreso || 'Hoy';
              const casilleroActual = p.casillero || 'Casillero #01';
              return (
                <div key={p.id} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                  
                  <div className="flex items-center gap-3">
                    <img
                      src={p.fotoUrl || 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=150&q=80'}
                      alt="Evidencia paquete"
                      className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm">{p.destinatario} ({p.unidad})</span>
                        <span className="bg-slate-800 text-amber-400 px-2 py-0.5 rounded text-[11px] font-mono font-bold">{p.empresa}</span>
                        <span className="bg-slate-950 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono">{casilleroActual}</span>
                      </div>
                      <p className="text-slate-400 font-mono">
                        🔑 PIN: <strong className="text-emerald-400">{pinActual}</strong> | 🕒 {fechaActual}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg font-bold text-[11px] border ${
                      p.estado === 'En Custodia' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}>
                      {p.estado} {p.estado === 'Entregado' && `(${p.fechaEntrega || p.horaEntrega || 'Entregado'})`}
                    </span>

                    {p.estado === 'En Custodia' && (
                      <div className="flex items-center gap-2">
                        {paqueteSeleccionadoId === p.id ? (
                          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-700">
                            <input
                              type="text"
                              placeholder="PIN..."
                              value={pinValidacion}
                              onChange={(e) => setPinValidacion(e.target.value)}
                              className="w-20 p-1.5 bg-slate-900 border border-slate-700 text-white rounded-lg text-xs outline-none font-mono text-center"
                            />
                            <button
                              type="button"
                              onClick={() => handleEntregarPaquete(p.id, pinActual)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
                            >
                              Ok
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPaqueteSeleccionadoId(p.id)}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Entregar
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-2xl">
              No hay encomiendas registradas con evidencia fotográfica todavía.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
