import React from 'react';
import { QrCode, Package } from 'lucide-react';

export interface ModuloVigilanciaLimpioProps {
  qrPasses?: any[];
  packages?: any[];
  onToggleVisitStatus?: (id: string) => void;
  onDeliverPackage?: (id: string) => void;
}

export default function ModuloVigilanciaLimpio({
  qrPasses = [],
  packages = [],
  onToggleVisitStatus,
  onDeliverPackage
}: ModuloVigilanciaLimpioProps) {
  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* SE ELIMINÓ LA CABECERA REPETIDA. AHORA MUESTRA DIRECTAMENTE LOS SUBMÓDULOS */}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SUBMÓDULO 1: PASES QR */}
        <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
            <QrCode className="w-4 h-4 text-amber-400" /> Pases QR Activos en Garita
          </h4>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {(qrPasses || []).length > 0 ? (
              qrPasses.map((rawPass: any) => {
                const pass = {
                  id: rawPass.id,
                  code: rawPass.code || rawPass.codigo || rawPass.codigoQr || 'QR-PASS',
                  visitor: rawPass.visitor || rawPass.nombreVisitante || rawPass.visitante || 'Visitante',
                  apt: rawPass.apt || rawPass.unidad || 'Copropiedad',
                  plate: rawPass.plate || rawPass.placa || rawPass.placaVehiculo || 'Peatonal',
                  status: rawPass.status || rawPass.estado || 'Autorizado'
                };

                return (
                  <div key={pass.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono text-xs font-bold bg-slate-900 text-amber-400 px-2.5 py-1 rounded-lg border border-slate-800 mr-2">
                        {pass.code}
                      </span>
                      <span className="font-bold text-white text-sm">{pass.visitor}</span>
                      <p className="text-slate-400 mt-1">
                        Destino: {pass.apt} • Placa: {pass.plate || 'Peatonal'}
                      </p>
                    </div>

                    {(pass.status === 'Autorizado') && (
                      <button
                        type="button"
                        onClick={() => onToggleVisitStatus?.(pass.id)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs transition cursor-pointer shadow-lg"
                      >
                        Dar Ingreso
                      </button>
                    )}
                    {(pass.status === 'Adentro') && (
                      <button
                        type="button"
                        onClick={() => onToggleVisitStatus?.(pass.id)}
                        className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs transition cursor-pointer shadow-lg"
                      >
                        Marcar Salida
                      </button>
                    )}
                    {(pass.status === 'Salió' || pass.status === 'Salio' || pass.status === 'Rechazado') && (
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                        {pass.status}
                      </span>
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

        {/* SUBMÓDULO 2: ENCOMIENDAS */}
        <div className="bg-[#0b0f17] border border-slate-800/80 p-6 rounded-3xl space-y-4 shadow-xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 font-mono">
            <Package className="w-4 h-4 text-teal-400" /> Encomiendas y Paquetes en Custodia
          </h4>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {(packages || []).length > 0 ? (
              packages.map((rawPkg: any) => {
                const pkg = {
                  id: rawPkg.id,
                  apt: rawPkg.apt || rawPkg.unidad || 'Unidad PH',
                  carrier: rawPkg.carrier || rawPkg.empresa || 'Empresa Logística',
                  pin: rawPkg.pin || rawPkg.pinRetiro || 'PIN-XXXX',
                  status: rawPkg.status || (rawPkg.estado === 'Entregado' ? 'Entregado' : 'En Portería')
                };

                const isPending = pkg.status === 'En Portería' || pkg.status === 'En Custodia' || rawPkg.estado === 'En Custodia';

                return (
                  <div key={pkg.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white text-sm">{pkg.apt} • {pkg.carrier}</span>
                      <p className="text-slate-400 mt-1">
                        PIN de retiro: <strong className="text-teal-400 font-mono">{pkg.pin}</strong>
                      </p>
                    </div>

                    {isPending ? (
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
