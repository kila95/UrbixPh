import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  FileText, 
  Lock, 
  ShieldAlert,
  ArrowUpRight,
  RefreshCw
} from 'lucide-react';

interface UnidadCartera {
  id: string;
  torreApartamento: string; // Ej: "Torre 3 - Apto 504"
  propietario: string;
  cuotaOrdinaria: number;
  cuotaExtraordinaria: number;
  mesesVencidos: number;
  diasRetraso: number;
  tasaInteresAnual: number; // Ej: 28.5% E.A. (tope superfinanciera)
  estado: 'Al día' | 'En Mora' | 'Bloqueado (Dunning)';
}

export default function CarteraYLiquidacionPH() {
  // Estado inicial simulado de unidades inmobiliarias (Multi-Tenant / Copropiedad Activa)
  const [unidades, setUnidades] = useState<UnidadCartera[]>([
    { id: '1', torreApartamento: 'Torre 1 - 101', propietario: 'Carlos Mendoza', cuotaOrdinaria: 350000, cuotaExtraordinaria: 50000, mesesVencidos: 0, diasRetraso: 0, tasaInteresAnual: 28.5, estado: 'Al día' },
    { id: '2', torreApartamento: 'Torre 1 - 202', propietario: 'Ana Lucía Gómez', cuotaOrdinaria: 350000, cuotaExtraordinaria: 0, mesesVencidos: 2, diasRetraso: 65, tasaInteresAnual: 28.5, estado: 'En Mora' },
    { id: '3', torreApartamento: 'Torre 2 - 304', propietario: 'Inversiones R&S SAS', cuotaOrdinaria: 450000, cuotaExtraordinaria: 120000, mesesVencidos: 4, diasRetraso: 130, tasaInteresAnual: 28.5, estado: 'Bloqueado (Dunning)' },
    { id: '4', torreApartamento: 'Torre 3 - 501', propietario: 'Esteban Ochoa', cuotaOrdinaria: 350000, cuotaExtraordinaria: 0, mesesVencidos: 0, diasRetraso: 0, tasaInteresAnual: 28.5, estado: 'Al día' },
  ]);

  const [unidadSeleccionada, setUnidadSeleccionada] = useState<UnidadCartera>(unidades[1]);
  const [calculoDetalle, setCalculoDetalle] = useState({ capitalTotal: 0, interesesMora: 0, totalPagar: 0 });

  // Función de cálculo financiero bajo Ley 675 (Interés Diario sobre capital vencido)
  const calcularInteresesLey675 = (unidad: UnidadCartera) => {
    const capitalBase = (unidad.cuotaOrdinaria + unidad.cuotaExtraordinaria) * unidad.mesesVencidos;
    if (capitalBase === 0) return { capitalTotal: 0, interesesMora: 0, totalPagar: 0 };

    // Tasa diaria nominal equivalente a partir de la E.A.
    const tasaDiaria = Math.pow(1 + (unidad.tasaInteresAnual / 100), 1 / 365) - 1;
    const intereses = capitalBase * tasaDiaria * unidad.diasRetraso;

    return {
      capitalTotal: capitalBase,
      interesesMora: Math.round(intereses),
      totalPagar: Math.round(capitalBase + intereses)
    };
  };

  useEffect(() => {
    setCalculoDetalle(calcularInteresesLey675(unidadSeleccionada));
  }, [unidadSeleccionada]);

  return (
    <div className="min-h-full bg-slate-950 text-slate-100 p-6 font-sans">
      {/* Encabezado Corporativo SaaS PH */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 mb-8">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/10 text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-500/20">
              Módulo Financiero Ley 675
            </span>
            <span className="text-slate-400 text-sm">| Multi-Tenant Supabase RLS</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Gestión de Cartera y Liquidación de Mora
          </h1>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <button className="bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center transition">
            <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar Tasas Superfinanciera
          </button>
        </div>
      </header>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna 1 y 2: Listado de Inmuebles / Unidades */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white flex items-center">
              <DollarSign className="w-5 h-5 text-emerald-400 mr-2" /> Estado de Cartera por Inmueble
            </h2>
            <span className="text-xs text-slate-400">Total unidades: {unidades.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Unidad / Propietario</th>
                  <th className="pb-3 font-semibold">Deuda Capital</th>
                  <th className="pb-3 font-semibold">Retraso</th>
                  <th className="pb-3 font-semibold">Estado Dunning</th>
                  <th className="pb-3 text-right font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {unidades.map((u) => {
                  const calculo = calcularInteresesLey675(u);
                  return (
                    <tr 
                      key={u.id} 
                      onClick={() => setUnidadSeleccionada(u)}
                      className={`hover:bg-slate-800/50 cursor-pointer transition ${unidadSeleccionada.id === u.id ? 'bg-slate-800/80 border-l-2 border-emerald-500' : ''}`}
                    >
                      <td className="py-4">
                        <div className="font-medium text-white">{u.torreApartamento}</div>
                        <div className="text-xs text-slate-400">{u.propietario}</div>
                      </td>
                      <td className="py-4 font-mono text-slate-200">
                        ${calculo.totalPagar.toLocaleString('es-CO')}
                      </td>
                      <td className="py-4">
                        <span className={`text-xs px-2 py-0.5 rounded ${u.diasRetraso > 60 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : u.diasRetraso > 0 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-300'}`}>
                          {u.diasRetraso} días
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${
                          u.estado === 'Al día' ? 'bg-emerald-500/10 text-emerald-400' :
                          u.estado === 'En Mora' ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {u.estado === 'Bloqueado (Dunning)' && <Lock className="w-3 h-3 mr-1" />}
                          {u.estado}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <button className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center justify-end ml-auto">
                          Simular <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Columna 3: Simulador de Liquidación y Facturación Ley 675 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="font-semibold text-white flex items-center">
                <Calculator className="w-4 h-4 text-indigo-400 mr-2" /> Liquidación Detallada
              </h3>
              <span className="text-xs font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                Tasa: {unidadSeleccionada.tasaInteresAnual}% E.A.
              </span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <div className="text-xs text-slate-400">Inmueble Seleccionado</div>
                <div className="text-sm font-bold text-white">{unidadSeleccionada.torreApartamento}</div>
                <div className="text-xs text-slate-400">{unidadSeleccionada.propietario}</div>
              </div>

              <div className="flex justify-between text-sm py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Meses vencidos:</span>
                <span className="font-mono font-medium text-white">{unidadSeleccionada.mesesVencidos} periodos</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Días de retraso acumulados:</span>
                <span className="font-mono font-medium text-amber-400">{unidadSeleccionada.diasRetraso} días</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Capital adeudado:</span>
                <span className="font-mono font-medium text-white">${calculoDetalle.capitalTotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-sm py-1 border-b border-slate-800/40">
                <span className="text-slate-400">Intereses de mora (Ley 675):</span>
                <span className="font-mono font-medium text-rose-400">+ ${calculoDetalle.interesesMora.toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* Total a Pagar */}
            <div className="bg-gradient-to-br from-slate-950 to-slate-900 p-4 rounded-xl border border-emerald-500/30 mb-6">
              <div className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-1">Total Liquidado a la Fecha</div>
              <div className="text-2xl font-extrabold font-mono text-white">
                ${calculoDetalle.totalPagar.toLocaleString('es-CO')}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Calculado conforme al Artículo 30 de la Ley 675 de 2001.</div>
            </div>
          </div>

          <div className="space-y-3">
            <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <FileText className="w-4 h-4 mr-2" /> Generar Estado de Cuenta Oficial
            </button>
            {unidadSeleccionada.diasRetraso > 60 && (
              <button className="w-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-medium py-2 px-4 rounded-lg text-xs transition flex items-center justify-center">
                <ShieldAlert className="w-3.5 h-3.5 mr-1.5" /> Forzar Bloqueo Dunning (App Residentes)
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
