import React, { useState } from 'react';
import { Package, PlusCircle, Search, CheckCircle2, Clock, Camera } from 'lucide-react';

export default function ModuloEncomiendasConBusquedaPinEnterprise({
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
  
  // Estados para filtros, búsqueda y PIN
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'Todos' | 'En Custodia' | 'Entregados'>('En Custodia');
  
  const [pinValidacion, setPinValidacion] = useState('');
  const [paqueteSeleccionadoId, setPaqueteSeleccionadoId] = useState<string | null>(null);

  // Simular captura de foto
  const handleSimularCapturaFoto = () => {
    const mockFotoUrl = 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=300&q=80';
    setFotoEvidencia(mockFotoUrl);
    onShowToast?.('📸 Foto de evidencia del paquete capturada exitosamente.');
  };

  // Registrar encomienda
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
    onShowToast?.(`Paquete registrado. PIN generado: ${randomPin}`);
  };

  // Entregar paquete
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

  // Filtrado inteligente: Apto, casillero, empresa O PIN de seguridad
  const listaFiltrada = (encomiendasShared || []).filter((p: any) => {
    const query = busqueda.toLowerCase().trim();
    const pinStr = (p.pinRetiro || p.codigoPin || '').toLowerCase();
    const matchTexto = 
      (p.unidad || '').toLowerCase().includes(query) ||
      (p.destinatario || '').toLowerCase().includes(query) ||
      (p.empresa || '').toLowerCase().includes(query) ||
      (p.casillero || '').toLowerCase().includes(query) ||
      pinStr.includes(query); // 🔑 Búsqueda instantánea por PIN

    if (filtroEstado === 'En Custodia') return matchTexto && p.estado === 'En Custodia';
    if (filtroEstado === 'Entregados') return matchTexto && p.estado === 'Entregado';
    return matchTexto; // 'Todos'
  });

  const countEnCustodia = (encomiendasShared || []).filter((p: any) => p.estado === 'En Custodia').length;
  const countEntregados = (encomiendasShared || []).filter((p: any) => p.estado === 'Entregado').length;

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
              Control de Portería • Logística y Encomiendas
            </span>
            <h3 className="text-base font-black text-white mt-1">Gestión de Casilleros con Búsqueda por PIN</h3>
          </div>
        </div>
      </div>

      {/* Formulario de Registro con Foto */}
      <form onSubmit={handleRegistrarPaquete} className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <input
          type="text"
          placeholder="Unidad (Ej: Torre 2 - 301)"
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

        <button
          type="button"
          onClick={handleSimularCapturaFoto}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
            fotoEvidencia ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
        >
          <Camera className="w-4 h-4" /> {fotoEvidencia ? 'Foto OK ✓' : 'Tomar Foto'}
        </button>

        <div className="md:col-span-4 pt-1">
          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs transition cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Registrar Paquete en Custodia
          </button>
        </div>
      </form>

      {/* SECCIÓN DE FILTROS Y BÚSQUEDA POR PIN */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          {/* Pestañas de Filtro por Estado */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setFiltroEstado('En Custodia')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filtroEstado === 'En Custodia' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              📦 En Custodia ({countEnCustodia})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('Entregados')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filtroEstado === 'Entregados' ? 'bg-emerald-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              ✅ Entregados ({countEntregados})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('Todos')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filtroEstado === 'Todos' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              🔍 Ver Todos
            </button>
          </div>

          {/* Barra de Búsqueda Mejorada (Incluye PIN) */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filtrar por apto, casillero, empresa o PIN..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white outline-none focus:border-amber-500 font-mono"
            />
          </div>
        </div>

        {/* Listado Filtrado */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 pt-1">
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
              No hay encomiendas que coincidan con la búsqueda o el filtro actual.
            </p>
          )}
        </div>
      </div>

    </div>
  );
}
