import React, { useState } from 'react';
import { 
  DollarSign, 
  Scan, 
  FileSpreadsheet, 
  Scale,
  ArrowUpDown, 
  Sparkles 
} from 'lucide-react';
import LectorFacturasProveedoresOCR from './LectorFacturasProveedoresOCR';
import GeneradorExogenaDIAN_NIIF from './GeneradorExogenaDIAN_NIIF';
import CobranzaPazYSalvoJuridico from './CobranzaPazYSalvoJuridico';

export default function SeccionTesoreriaConDIAN({
  onShowToast,
  nitCopropiedad = '900.842.115-2',
  nombreCopropiedad = 'P.H. Reserva del Tesoro',
  adminRepresentante = 'Carlos Mario Pineda',
  children
}: {
  onShowToast?: (msg: string) => void;
  nitCopropiedad?: string;
  nombreCopropiedad?: string;
  adminRepresentante?: string;
  children?: React.ReactNode;
}) {
  // 1: Flujo de Caja & Bancos | 2: Lector OCR Facturas | 3: Exógena DIAN & NIIF | 4: Cobro Prejurídico & Paz y Salvos
  const [subTabTesoreria, setSubTabTesoreria] = useState<1 | 2 | 3 | 4>(1);

  return (
    <div className="space-y-6">
      
      {/* SELECTOR DE SUB-PESTAÑAS DE TESORERÍA */}
      <div className="bg-[#0b0f17] border border-cyan-500/20 p-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setSubTabTesoreria(1)}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-2 shrink-0 ${
              subTabTesoreria === 1
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                : 'text-slate-400 hover:text-white bg-[#07090e] border border-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> 1. Flujo de Caja &amp; Bancos
          </button>

          <button
            type="button"
            onClick={() => setSubTabTesoreria(2)}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-2 shrink-0 ${
              subTabTesoreria === 2
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                : 'text-slate-400 hover:text-white bg-[#07090e] border border-slate-800'
            }`}
          >
            <Scan className="w-3.5 h-3.5" /> 2. Facturas OCR Proveedores
          </button>

          <button
            type="button"
            onClick={() => setSubTabTesoreria(3)}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-2 shrink-0 ${
              subTabTesoreria === 3
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                : 'text-slate-400 hover:text-white bg-[#07090e] border border-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> 3. Exógena DIAN &amp; NIIF
          </button>

          <button
            type="button"
            onClick={() => setSubTabTesoreria(4)}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition cursor-pointer flex items-center gap-2 shrink-0 ${
              subTabTesoreria === 4
                ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-black shadow-[0_0_15px_rgba(34,211,238,0.35)]'
                : 'text-slate-400 hover:text-white bg-[#07090e] border border-slate-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5" /> 4. Cobro Prejurídico &amp; Paz y Salvos
          </button>
        </div>

        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-xl border border-cyan-500/20 hidden md:inline-block">
          Cierre Fiscal &amp; Tesorería Integrada
        </span>
      </div>

      {/* RENDERIZADO DEL SUBMÓDULO SELECCIONADO */}
      {subTabTesoreria === 1 && (
        <div className="space-y-6 animate-fade-in">
          {/* Aquí permanece tu vista actual de recaudos, bancos y caja menor */}
          {children ? (
            children
          ) : (
            <div className="bg-[#0b0f17] border border-slate-800 p-6 rounded-3xl text-center text-slate-400 text-xs">
              Panel de Conciliación Bancaria, Recaudos PSE y Flujo de Caja en Tiempo Real.
            </div>
          )}

          {/* Centro de Cobranza Prejurídica y Paz y Salvos Oficiales (Ley 675) */}
          <CobranzaPazYSalvoJuridico
            onShowToast={onShowToast}
            nombreCopropiedad={nombreCopropiedad}
            nitCopropiedad={nitCopropiedad}
            adminRepresentante={adminRepresentante}
          />
        </div>
      )}

      {subTabTesoreria === 2 && (
        <div className="animate-fade-in">
          <LectorFacturasProveedoresOCR 
            onShowToast={onShowToast}
            onFacturaCausada={(fac) => {
              onShowToast?.(`Factura ${fac.numeroFactura} sumada a Cuentas por Pagar.`);
            }}
          />
        </div>
      )}

      {subTabTesoreria === 3 && (
        <div className="animate-fade-in">
          <GeneradorExogenaDIAN_NIIF 
            onShowToast={onShowToast}
            nitCopropiedad={nitCopropiedad}
            nombreCopropiedad={nombreCopropiedad}
          />
        </div>
      )}

      {subTabTesoreria === 4 && (
        <div className="animate-fade-in">
          <CobranzaPazYSalvoJuridico
            onShowToast={onShowToast}
            nombreCopropiedad={nombreCopropiedad}
            nitCopropiedad={nitCopropiedad}
            adminRepresentante={adminRepresentante}
          />
        </div>
      )}

    </div>
  );
}
