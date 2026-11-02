import React from 'react';
import { QrCode, Package, AlertTriangle, Shield, CheckCircle2, UserCheck } from 'lucide-react';

export interface ConsolaPorteriaExecutiveProps {
  qrPasses?: any[];
  packages?: any[];
  onToggleVisitStatus?: (id: string) => void;
  onDeliverPackage?: (id: string) => void;
  onShowToast?: (msg: string) => void;
}

export default function ConsolaPorteriaExecutive({
  qrPasses = [],
  packages = [],
  onToggleVisitStatus,
  onDeliverPackage,
  onShowToast
}: ConsolaPorteriaExecutiveProps) {
  return (
    <div className="bg-[#07090e] border border-slate-800/80 p-6 sm:p-8 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-7 font-sans text-slate-100">
      
      {/* Cabecera de Portería */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-amber-500/20 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30 uppercase tracking-widest">
              Garita y Control de Accesos • Consola Ejecutiva
            </span>
            <h3 className="text-lg font-black text-white mt-1">Gestión de Visitantes QR, Encomiendas y Rondas de Seguridad</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SECCIÓN 1: ACCESOS QR */}
        <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
            <QrCode className="w-4 h-4 text-amber-400" /> Pases QR Activos en Garita
          </h4>

          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {(qrPasses || []).length > 0 ? (
              qrPasses.map((rawPass: any) => {
                const pass = {
                  id: rawPass.id,
                  code: rawPass.code || rawPass.codigo || rawPass.codigoQr || 'QR-0000',
                  visitor: rawPass.visitor || rawPass.visitante || rawPass.nombreVisitante || 'Visitante',
                  apt: rawPass.apt || rawPass.unidad || 'Copropiedad',
                  plate: rawPass.plate || rawPass.placa || rawPass.placaVehiculo || 'Peatonal',
                  status: rawPass.status || rawPass.estado || 'Autorizado'
                };
                return (
                  <div key={pass.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono text-xs font-bold bg-slate-900 text-amber-400 px-2.5 py-1 rounded-lg border border-slate-800 mr-2">{pass.code}</span>
                      <span className="font-bold text-white text-sm">{pass.visitor}</span>
                      <p className="text-slate-400 mt-1">Destino: {pass.apt} • Placa: {pass.plate || 'Peatonal'}</p>
                    </div>

                    {pass.status === 'Autorizado' && (
                      <button
                        type="button"
                        onClick={() => onToggleVisitStatus?.(pass.id)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs transition cursor-pointer shadow-lg"
                      >
                        Dar Ingreso
                      </button>
                    )}
                    {pass.status === 'Adentro' && (
                      <button
                        type="button"
                        onClick={() => onToggleVisitStatus?.(pass.id)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs transition cursor-pointer shadow-lg"
                      >
                        Marcar Salida
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-2xl">
                No hay pases QR activos en este momento.
              </p>
            )}
          </div>
        </div>

        {/* SECCIÓN 2: ENCOMIENDAS */}
        <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
            <Package className="w-4 h-4 text-teal-400" /> Encomiendas y Paquetes en Custodia
          </h4>

          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {(packages || []).length > 0 ? (
              packages.map((rawPkg: any) => {
                const pkg = {
                  id: rawPkg.id,
                  apt: rawPkg.apt || rawPkg.unidad || 'Apto',
                  carrier: rawPkg.carrier || rawPkg.empresa || 'Transportadora',
                  pin: rawPkg.pin || rawPkg.codigoPin || 'PKG-0000',
                  status:
                    rawPkg.status === 'En Portería' || rawPkg.estado === 'En Custodia' || rawPkg.estado === 'En Portería'
                      ? 'En Portería'
                      : 'Entregado'
                };
                return (
                  <div key={pkg.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white text-sm">{pkg.apt} • {pkg.carrier}</span>
                      <p className="text-slate-400 mt-1">PIN de retiro: <strong className="text-teal-400 font-mono">{pkg.pin}</strong></p>
                    </div>

                    {pkg.status === 'En Portería' ? (
                      <button
                        type="button"
                        onClick={() => onDeliverPackage?.(pkg.id)}
                        className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs transition cursor-pointer shadow-lg"
                      >
                        Entregar
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
                        Entregado ✓
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-800 rounded-2xl">
                No hay paquetes pendientes en portería.
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
