import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Package, Car, AlertTriangle, Search, 
  UserCheck, UserX, Plus, CheckCircle2, RefreshCw, Clock 
} from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function ModuloControlPorteria({ onShowToast }: any) {
  const [subPestana, setSubPestana] = useState<'acceso' | 'paqueteria' | 'parqueadero'>('acceso');
  
  // 1. Estados Acceso Cédula
  const [cedulaInput, setCedulaInput] = useState('');
  const [resultadoConsulta, setResultadoConsulta] = useState<any>(null);
  const [consultando, setConsultando] = useState(false);

  // 2. Estados Paquetería
  const [paquetes, setPaquetes] = useState<any[]>([
    { id: 1, unidad: 'Torre 1 - 302', transportadora: 'Servientrega', hora: '10:15 AM', estado: 'recibido' },
    { id: 2, unidad: 'Torre 2 - 101', transportadora: 'Mercado Libre', hora: '11:40 AM', estado: 'recibido' }
  ]);
  const [aptoPaquete, setAptoPaquete] = useState('');
  const [empresaEnvio, setEmpresaEnvio] = useState('Servientrega');

  // 3. Estados Parqueadero
  const [celdasLibres, setCeldasLibres] = useState(12);

  // Consultar cédula en tiempo real contra contratistas y censo
  const handleConsultarCedula = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cedulaInput.trim()) return;

    try {
      setConsultando(true);
      setResultadoConsulta(null);

      // Buscar si es un técnico con SG-SST en Supabase
      const { data: worker } = await supabase
        .from('contractor_workers')
        .select('*, contractor_companies(company_name)')
        .eq('document_id', cedulaInput.trim())
        .maybeSingle();

      if (worker) {
        const hoy = new Date();
        const vence = new Date(worker.arl_coverage_expires);
        const vigente = vence >= hoy && !worker.is_blocked;

        setResultadoConsulta({
          tipo: 'CONTRATISTA',
          nombre: worker.full_name,
          documento: worker.document_id,
          empresa: worker.contractor_companies?.company_name || 'Contratista Independiente',
          arl: worker.arl_name,
          vigenciaArl: worker.arl_coverage_expires,
          autorizado: vigente,
          motivo: vigente ? 'Planilla ARL Vigente' : (worker.is_blocked ? 'Operario Bloqueado' : 'Planilla ARL Vencida')
        });
        return;
      }

      // Buscar si es un residente en Supabase
      const { data: unidad } = await supabase
        .from('units')
        .select('*')
        .eq('owner_id_number', cedulaInput.trim())
        .maybeSingle();

      if (unidad) {
        setResultadoConsulta({
          tipo: 'PROPIETARIO',
          nombre: unidad.owner_name,
          documento: unidad.owner_id_number,
          inmueble: unidad.unit_number,
          autorizado: true,
          motivo: 'Residente / Copropietario Titular'
        });
        return;
      }

      // Fallback demo local para pruebas
      if (cedulaInput.trim() === '71234567' || cedulaInput.trim() === '1037492102') {
        setResultadoConsulta({
          tipo: 'CONTRATISTA',
          nombre: 'Andrés Felipe Morales',
          documento: cedulaInput.trim(),
          empresa: 'Claro Colombia (Redes Ópticas)',
          arl: 'ARL SURA (Riesgo IV)',
          vigenciaArl: '2026-11-25',
          autorizado: true,
          motivo: 'Planilla ARL Vigente'
        });
        return;
      }

      if (cedulaInput.trim() === '71999000' || cedulaInput.trim() === '43555666') {
        setResultadoConsulta({
          tipo: 'PROPIETARIO',
          nombre: 'Martha Lucía Gómez',
          documento: cedulaInput.trim(),
          inmueble: 'Torre 2 - 301',
          autorizado: true,
          motivo: 'Residente / Copropietario Titular'
        });
        return;
      }

      setResultadoConsulta({
        tipo: 'NO_REGISTRADO',
        documento: cedulaInput.trim(),
        autorizado: false,
        motivo: 'Cédula no registrada en sistema. Requiere autorización del apartamento.'
      });
    } catch (e) {
      console.warn('Fallback consulta cédula:', e);
      setResultadoConsulta({
        tipo: 'NO_REGISTRADO',
        documento: cedulaInput.trim(),
        autorizado: false,
        motivo: 'Cédula no registrada en sistema. Requiere autorización del apartamento.'
      });
    } finally {
      setConsultando(false);
    }
  };

  const handleRegistrarPaquete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aptoPaquete.trim()) return;

    const nuevo = {
      id: Date.now(),
      unidad: aptoPaquete.trim(),
      transportadora: empresaEnvio,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      estado: 'recibido'
    };

    setPaquetes(prev => [nuevo, ...prev]);
    onShowToast?.(`Encomienda para ${aptoPaquete} registrada en portería`);
    setAptoPaquete('');
  };

  const handleEntregarPaquete = (id: number) => {
    setPaquetes(prev => prev.filter(p => p.id !== id));
    onShowToast?.(`Encomienda entregada al residente.`);
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* Subnavegador de Garita */}
      <div className="flex flex-wrap items-center gap-2 bg-[#0F172A] border border-slate-800 p-2 rounded-2xl w-fit">
        <button
          onClick={() => setSubPestana('acceso')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            subPestana === 'acceso'
              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Verificación de Cédula & SG-SST
        </button>

        <button
          onClick={() => setSubPestana('paqueteria')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            subPestana === 'paqueteria'
              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          Correspondencia ({paquetes.length})
        </button>

        <button
          onClick={() => setSubPestana('parqueadero')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
            subPestana === 'parqueadero'
              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Car className="w-4 h-4" />
          Parqueadero Visitantes ({celdasLibres} libres)
        </button>
      </div>

      {/* 1. VISTA DE VERIFICACIÓN DE ACCESO */}
      {subPestana === 'acceso' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              Lector & Control de Ingreso en Garita
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Digita el número de cédula del contratista, domiciliario o visitante para validar autorización legal inmediata.
            </p>

            <form onSubmit={handleConsultarCedula} className="space-y-3">
              <div>
                <label className="block text-slate-300 text-xs font-medium mb-1">
                  Cédula / Documento de Identidad
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Ej. 71284912 / 1037492102"
                    value={cedulaInput}
                    onChange={(e) => setCedulaInput(e.target.value)}
                    className="flex-1 bg-[#1E293B] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={consultando}
                    className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl text-xs transition cursor-pointer disabled:opacity-50"
                  >
                    {consultando ? 'Consultando...' : 'Validar'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Resultado de la consulta */}
          <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-2xl flex flex-col justify-center space-y-4 shadow-xl">
            {!resultadoConsulta ? (
              <div className="text-center py-8 text-slate-500 text-xs font-mono">
                Ingresa una cédula a la izquierda para verificar estado de ingreso.
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                  resultadoConsulta.autorizado 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  {resultadoConsulta.autorizado ? (
                    <UserCheck className="w-8 h-8 text-emerald-400 shrink-0" />
                  ) : (
                    <UserX className="w-8 h-8 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-sm font-mono">
                      {resultadoConsulta.autorizado ? 'INGRESO AUTORIZADO' : 'ACCESO RESTRINGIDO'}
                    </h4>
                    <p className="text-xs mt-0.5">{resultadoConsulta.motivo}</p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nombre:</span>
                    <span className="text-white font-bold">{resultadoConsulta.nombre || 'No registrado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Documento:</span>
                    <span className="text-slate-200">{resultadoConsulta.documento}</span>
                  </div>
                  {resultadoConsulta.empresa && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Empresa:</span>
                      <span className="text-cyan-400">{resultadoConsulta.empresa}</span>
                    </div>
                  )}
                  {resultadoConsulta.vigenciaArl && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vigencia ARL:</span>
                      <span className="text-white">{resultadoConsulta.vigenciaArl}</span>
                    </div>
                  )}
                  {resultadoConsulta.inmueble && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Inmueble:</span>
                      <span className="text-cyan-400">{resultadoConsulta.inmueble}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. VISTA DE CORRESPONDENCIA / ENCOMIENDAS */}
      {subPestana === 'paqueteria' && (
        <div className="space-y-4">
          <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                Minuta Digital de Correspondencia & Encomiendas
              </h3>
              <p className="text-xs text-slate-400">
                Registra paquetes recibidos en portería para notificar al residente.
              </p>
            </div>

            <form onSubmit={handleRegistrarPaquete} className="flex flex-wrap gap-2 w-full sm:w-auto">
              <input
                type="text"
                required
                placeholder="Apto (Ej. Torre 1 - 302)"
                value={aptoPaquete}
                onChange={(e) => setAptoPaquete(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
              <select
                value={empresaEnvio}
                onChange={(e) => setEmpresaEnvio(e.target.value)}
                className="bg-[#1E293B] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono cursor-pointer"
              >
                <option value="Servientrega">Servientrega</option>
                <option value="Coordinadora">Coordinadora</option>
                <option value="InterRapidísimo">InterRapidísimo</option>
                <option value="Mercado Libre">Mercado Libre</option>
                <option value="Amazon / DHL">Amazon / DHL</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
              >
                Recibir
              </button>
            </form>
          </div>

          <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4">
            {paquetes.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs font-mono">
                No hay encomiendas pendientes por entrega en la garita.
              </div>
            ) : (
              <div className="space-y-2">
                {paquetes.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs font-mono">{p.unidad}</span>
                        <p className="text-[11px] text-slate-400">{p.transportadora} • Recibido {p.hora}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEntregarPaquete(p.id)}
                      className="px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-mono font-bold transition cursor-pointer"
                    >
                      Entregar al Residente
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. VISTA DE PARQUEADERO VISITANTES */}
      {subPestana === 'parqueadero' && (
        <div className="bg-[#0F172A] border border-slate-800 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Car className="w-4 h-4 text-cyan-400" />
                Celdas de Parqueadero de Visitantes
              </h3>
              <p className="text-xs text-slate-400">Control de capacidad y permanencia.</p>
            </div>
            <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-xl text-xs font-mono font-bold">
              {celdasLibres} Celdas Disponibles de 15
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {Array.from({ length: 15 }).map((_, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-xl border text-center font-mono text-xs ${
                  i < 3 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <div className="font-bold">Celda V-{i + 1}</div>
                <div className="text-[10px] mt-1">{i < 3 ? 'OCUPADA' : 'LIBRE'}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
