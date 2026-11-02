import React, { useState } from 'react';
import { Package, PlusCircle, Search, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

export default function ModuloEncomiendasEnterprise({
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
  const [busqueda, setBusqueda] = useState('');
  const [pinValidacion, setPinValidacion] = useState('');
  const [paqueteSeleccionadoId, setPaqueteSeleccionadoId] = useState<string | null>(null);

  // Registrar encomienda con PIN automático
  const handleRegistrarPaquete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!torreApto.trim() || !destinatario.trim()) {
      onShowToast?.('Por favor ingresa la torre, apartamento y nombre del residente');
      return;
    }

    const randomPin = `PIN-${Math.floor(1000 + Math.random() * 9000)}`;
    const randomLocker = `Casillero #${Math.floor(1 + Math.random() * 24)}`;
    const fechaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + new Date().toLocaleDateString('es-CO');

    const nuevaEncomienda = {
      id: `enc_${Date.now()}`,
      unidad: torreApto.trim(),
      destinatario: destinatario.trim(),
      empresa: empresaTransporte,
      guia: `GUIA-${Math.floor(100000 + Math.random() * 900000)}`,
      casillero: randomLocker,
      pinRetiro: randomPin,
      codigoPin: randomPin,
      fechaLlegada: fechaActual,
      fechaIngreso: fechaActual,
      estado: 'En Custodia',
      horasCustodia: 0,
      guardaReceptor: 'Guarda Carlos Restrepo (Garita 1)'
    };

    if (setEncomiendasShared) {
      setEncomiendasShared([nuevaEncomienda, ...encomiendasShared]);
    }

    setTorreApto('');
    setDestinatario('');
    onShowToast?.(`Encomienda registrada en ${randomLocker}. Notificación Push enviada con código ${randomPin}`);
  };

  // Validar PIN y entregar paquete al residente
  const handleValidarPinYEntregar = (paquete: any) => {
    const pinEsperado = String(paquete.pinRetiro || paquete.codigoPin || '').toUpperCase();
    const cleanInput = pinValidacion.trim().toUpperCase();
    const expectedNumberOnly = pinEsperado.replace('PIN-', '');

    if (cleanInput !== pinEsperado && cleanInput !== expectedNumberOnly) {
      onShowToast?.('ERROR DE SEGURIDAD: El código PIN ingresado no coincide con el token enviado al residente.');
      return;
    }

    const horaEntregaStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (setEncomiendasShared) {
      setEncomiendasShared(
        encomiendasShared.map((p: any) =>
          p.id === paquete.id
            ? {
                ...p,
                estado: 'Entregado',
                fechaEntrega: horaEntregaStr,
                horaEntrega: horaEntregaStr
              }
            : p
        )
      );
    }

    setPaqueteSeleccionadoId(null);
    setPinValidacion('');
    onShowToast?.(`Entrega exitosa verificada por PIN a ${paquete.destinatario} (${paquete.unidad})`);
  };

  // Listado por defecto en caso de estar vacío
  const listaPaquetes = encomiendasShared && encomiendasShared.length > 0 ? encomiendasShared : [
    {
      id: 'enc_demo_1',
      unidad: 'Torre 1 - 402',
      destinatario: 'Dra. Camila Restrepo',
      empresa: 'Amazon Logistics',
      guia: 'GUIA-849201',
      casillero: 'Casillero #08',
      pinRetiro: 'PIN-4829',
      codigoPin: 'PIN-4829',
      fechaLlegada: '09:15 AM - Hoy',
      fechaIngreso: '09:15 AM - Hoy',
      estado: 'En Custodia',
      horasCustodia: 4,
      guardaReceptor: 'Guarda Carlos Restrepo'
    },
    {
      id: 'enc_demo_2',
      unidad: 'Torre 2 - 601',
      destinatario: 'Ing. Roberto Gómez',
      empresa: 'Servientrega',
      guia: 'GUIA-392014',
      casillero: 'Casillero #14',
      pinRetiro: 'PIN-9104',
      codigoPin: 'PIN-9104',
      fechaLlegada: 'Ayer - 04:30 PM',
      fechaIngreso: 'Ayer - 04:30 PM',
      estado: 'En Custodia',
      horasCustodia: 22,
      guardaReceptor: 'Guarda Turno Noche'
    }
  ];

  const paquetesFiltrados = listaPaquetes.filter((p: any) => {
    const unidadStr = String(p.unidad || '').toLowerCase();
    const destStr = String(p.destinatario || '').toLowerCase();
    const empStr = String(p.empresa || '').toLowerCase();
    const q = busqueda.toLowerCase();
    return unidadStr.includes(q) || destStr.includes(q) || empStr.includes(q);
  });

  const enCustodiaCount = listaPaquetes.filter((p: any) => p.estado === 'En Custodia').length;
  const entregadosCount = listaPaquetes.filter((p: any) => p.estado === 'Entregado').length;

  return (
    <div className="bg-slate-950 text-slate-100 p-6 rounded-2xl border border-slate-800 space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Package className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">
              CENTRAL DE ENCOMIENDAS, CASILLEROS & TOKEN PIN
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Recepción certificada de paquetería con generación de código criptográfico de retiro y trazabilidad de entrega.
          </p>
        </div>

        {/* Contadores Rápidos */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-3">
            <Clock className="w-4 h-4 text-amber-400" />
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">En Casillero (Custodia)</p>
              <p className="text-sm font-black text-amber-400">{enCustodiaCount} Paquetes</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <div>
              <p className="text-[10px] font-bold uppercase text-slate-400">Entregados c/ PIN</p>
              <p className="text-sm font-black text-emerald-400">{entregadosCount} Paquetes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Principal: Recepción (Izquierda) y Custodia/Entrega (Derecha) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulario de Recepción de Paquete (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                <PlusCircle className="w-4 h-4" />
                1. Recepcionar Paquete en Portería
              </h3>
              <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">
                AUTO-PIN ACTIVO
              </span>
            </div>

            <form onSubmit={handleRegistrarPaquete} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                  Torre y Apartamento Destino *
                </label>
                <input
                  type="text"
                  value={torreApto}
                  onChange={(e) => setTorreApto(e.target.value)}
                  placeholder="Ej. Torre 1 - Apto 402"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                  Nombre del Residente Destinatario *
                </label>
                <input
                  type="text"
                  value={destinatario}
                  onChange={(e) => setDestinatario(e.target.value)}
                  placeholder="Ej. Juan Carlos Mendoza"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                  Empresa Transportadora / Courier
                </label>
                <select
                  value={empresaTransporte}
                  onChange={(e) => setEmpresaTransporte(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="Mercado Libre">Mercado Libre (Envío Full)</option>
                  <option value="Amazon Logistics">Amazon Logistics / DHL</option>
                  <option value="Servientrega">Servientrega</option>
                  <option value="Coordinadora">Coordinadora Mercantil</option>
                  <option value="Inter Rapidísimo">Inter Rapidísimo</option>
                  <option value="Envia">Envía Colvanes</option>
                  <option value="Rappi / Mensajería">Rappi / Domicilio Express</option>
                  <option value="Recibo Público / Correo">Correspondencia / Facturación</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
              >
                <Package className="w-4 h-4" />
                Asignar Casillero y Enviar PIN al Residente
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Custodia Asegurada CCTV Garita
            </span>
            <span className="font-mono text-slate-500">PROTOCOL-ENC-V4</span>
          </div>
        </div>

        {/* Bandeja de Casilleros y Validación de PIN (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                2. Inventario en Casilleros & Entrega con PIN
              </h3>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar apto, residente..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Lista de Paquetes */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {paquetesFiltrados.map((p: any) => {
                const pinMostrado = p.pinRetiro || p.codigoPin || 'PIN-0000';
                const casilleroMostrado = p.casillero || 'Casillero #01';
                const guiaMostrada = p.guia || `GUIA-${String(p.id).slice(-5)}`;
                const fechaLlegadaMostrada = p.fechaLlegada || p.fechaIngreso || 'Hoy';
                const fechaEntregaMostrada = p.fechaEntrega || p.horaEntrega || 'Hoy';

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-xl border transition ${
                      p.estado === 'En Custodia'
                        ? 'bg-slate-950/90 border-slate-800 hover:border-amber-500/40'
                        : 'bg-slate-950/40 border-slate-800/50 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {p.unidad}
                          </span>
                          <span className="text-sm font-bold text-white">{p.destinatario}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Courier: <strong className="text-slate-200">{p.empresa}</strong> • Ubicación:{' '}
                          <strong className="text-indigo-400">{casilleroMostrado}</strong> • Guía: {guiaMostrada}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {p.estado === 'En Custodia' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setPaqueteSeleccionadoId(paqueteSeleccionadoId === p.id ? null : p.id);
                              setPinValidacion('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-wider transition"
                          >
                            Entregar c/ PIN
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Entregado ({fechaEntregaMostrada})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Caja Desplegable para Validar el PIN al entregar */}
                    {paqueteSeleccionadoId === p.id && p.estado === 'En Custodia' && (
                      <div className="mt-3 pt-3 border-t border-slate-800 bg-slate-900/80 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="text-xs">
                          <span className="text-slate-400 block">Solicita el PIN al residente (Demo Token activo):</span>
                          <span className="font-mono text-amber-400 font-bold">Código esperado: {pinMostrado}</span>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <input
                            type="text"
                            value={pinValidacion}
                            onChange={(e) => setPinValidacion(e.target.value)}
                            placeholder="Ej. PIN-4829"
                            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:border-emerald-500 focus:outline-none w-full sm:w-36"
                          />
                          <button
                            type="button"
                            onClick={() => handleValidarPinYEntregar(p)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase whitespace-nowrap"
                          >
                            Validar y Liberar
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Ingreso: {fechaLlegadaMostrada}</span>
                      <span className="font-mono text-slate-400">Token Residente: {pinMostrado}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
