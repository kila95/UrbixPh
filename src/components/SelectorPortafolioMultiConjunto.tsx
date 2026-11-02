import React, { useState } from 'react';
import { Building2, Users, ShieldCheck, ChevronDown, DollarSign, AlertTriangle, CheckCircle2, Filter } from 'lucide-react';

export interface SelectorPortafolioMultiConjuntoProps {
  onShowToast?: (msg: string) => void;
  onSelectCopropiedad?: (copropiedad: string) => void;
}

export default function SelectorPortafolioMultiConjunto({
  onShowToast,
  onSelectCopropiedad
}: SelectorPortafolioMultiConjuntoProps) {
  // Estado para la copropiedad seleccionada en el portafolio
  const [copropiedadSeleccionada, setCopropiedadSeleccionada] = useState('P.H. Reserva del Tesoro');
  const [supervisorFiltro, setSupervisorFiltro] = useState('Todos');

  // Listado de copropiedades del empresario
  const misCopropiedades = [
    { id: '1', nombre: 'P.H. Reserva del Tesoro', nit: '900.412.889-1', supervisor: 'Julián Arango', recaudo: '94.5%', morosos: 2, pqrs: 1 },
    { id: '2', nombre: 'Conjunto Residencial Bosques del Poblado', nit: '900.823.112-4', supervisor: 'Carlos Mario Pineda', recaudo: '88.2%', morosos: 5, pqrs: 3 },
    { id: '3', nombre: 'Edificio Altos de El Poblado', nit: '811.345.990-2', supervisor: 'Julián Arango', recaudo: '97.0%', morosos: 1, pqrs: 0 },
  ];

  const copropiedadesFiltradas = supervisorFiltro === 'Todos'
    ? misCopropiedades
    : misCopropiedades.filter(c => c.supervisor === supervisorFiltro);

  const datosActuales = misCopropiedades.find(c => c.nombre === copropiedadSeleccionada) || copropiedadesFiltradas[0] || misCopropiedades[0];

  const handleCambioCopropiedad = (nombre: string) => {
    setCopropiedadSeleccionada(nombre);
    onSelectCopropiedad?.(nombre);
    onShowToast?.(`🏢 Cambiando vista activa a: ${nombre}`);
  };

  return (
    <div className="bg-[#0b0f17] border border-cyan-500/30 p-6 rounded-3xl space-y-6 shadow-2xl font-sans text-slate-100">
      
      {/* BARRA SUPERIOR DE FILTRO MULTI-CONJUNTO */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest">
            Control Gerencial Multi-Copropiedad
          </span>
          <h3 className="text-base font-black text-white mt-1">Portafolio Empresarial de Urbanizaciones</h3>
        </div>

        {/* SELECTORES DE CAMBIO RÁPIDO */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Selector de Copropiedad / Urbanización */}
          <div className="flex items-center gap-2 bg-[#07090e] border border-slate-700 px-3.5 py-2 rounded-2xl hover:border-cyan-500/50 transition">
            <Building2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <select
              value={copropiedadSeleccionada}
              onChange={(e) => handleCambioCopropiedad(e.target.value)}
              className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer"
            >
              {copropiedadesFiltradas.map(c => (
                <option key={c.id} value={c.nombre} className="bg-slate-900 text-white">
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Selector de Supervisor a Cargo */}
          <div className="flex items-center gap-2 bg-[#07090e] border border-slate-700 px-3.5 py-2 rounded-2xl hover:border-teal-500/50 transition">
            <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />
            <select
              value={supervisorFiltro}
              onChange={(e) => {
                const nuevoSup = e.target.value;
                setSupervisorFiltro(nuevoSup);
                if (nuevoSup !== 'Todos') {
                  const match = misCopropiedades.find(c => c.supervisor === nuevoSup);
                  if (match) {
                    setCopropiedadSeleccionada(match.nombre);
                    onSelectCopropiedad?.(match.nombre);
                  }
                }
                onShowToast?.(`Filtro supervisor: ${nuevoSup}`);
              }}
              className="bg-transparent text-xs text-white font-bold outline-none cursor-pointer"
            >
              <option value="Todos" className="bg-slate-900 text-white">Supervisor: Todos</option>
              <option value="Julián Arango" className="bg-slate-900 text-white">Julián Arango</option>
              <option value="Carlos Mario Pineda" className="bg-slate-900 text-white">Carlos Mario Pineda</option>
            </select>
          </div>

        </div>
      </div>

      {/* MÉTRICAS DINÁMICAS DE LA UNIDAD SELECCIONADA */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-[#07090e] border border-slate-800 p-5 rounded-2xl space-y-1 hover:border-cyan-500/30 transition">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Recaudo Copropiedad</span>
          <p className="text-2xl font-black text-cyan-400">{datosActuales.recaudo}</p>
          <p className="text-[11px] text-slate-500 font-mono">NIT: {datosActuales.nit}</p>
        </div>

        <div className="bg-[#07090e] border border-slate-800 p-5 rounded-2xl space-y-1 hover:border-rose-500/30 transition">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Unidades en Mora (Cartera)</span>
          <p className="text-2xl font-black text-rose-400">{datosActuales.morosos} Aptos</p>
          <p className="text-[11px] text-slate-500 font-mono">Requiere gestión de cobro jurídica</p>
        </div>

        <div className="bg-[#07090e] border border-slate-800 p-5 rounded-2xl space-y-1 hover:border-amber-500/30 transition">
          <span className="text-[11px] font-mono text-slate-400 uppercase">PQRS Ley 1755 Abiertas</span>
          <p className="text-2xl font-black text-amber-400">{datosActuales.pqrs} Casos</p>
          <p className="text-[11px] text-slate-500">
            Supervisor a cargo: <strong className="text-slate-300">{datosActuales.supervisor}</strong>
          </p>
        </div>

      </div>

    </div>
  );
}
