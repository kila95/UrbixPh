import React, { useState } from 'react';
import { 
  Calculator, 
  ShieldAlert, 
  Building2, 
  Check, 
  Lock, 
  DollarSign, 
  Sliders, 
  FileCheck, 
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Power
} from 'lucide-react';
import { ClientTenantNode } from './SaaS_MasterOwnerConsole';

export default function SaaSCotizadorYSuspensionMaster({
  tenants,
  onUpdateTenants,
  onShowToast,
  onAppendAuditLog
}: {
  tenants: ClientTenantNode[];
  onUpdateTenants: React.Dispatch<React.SetStateAction<ClientTenantNode[]>>;
  onShowToast?: (msg: string) => void;
  onAppendAuditLog?: (action: string, details: string, executor?: string) => void;
}) {
  // --- CONFIGURACIÓN DE VOLUMEN (HASTA 3.000 UNIDADES) ---
  const [numUnidades, setNumUnidades] = useState<number>(1800); // Valor por defecto para ciudadelas grandes
  const [periodoFacturacion, setPeriodoFacturacion] = useState<'mensual' | 'anual'>('mensual');
  
  // Selección de módulos para la cotización
  const [modulosCotizados, setModulosCotizados] = useState({
    porteriaCitofonia: true,
    contabilidadDianNIIF: true,
    asambleasVirtualesIA: true,
    portalResidentesPQRS: true,
    rondasSupervisionSGSST: false
  });

  // Tarifas base por unidad privada (COP)
  const PRECIO_BASE_UNIDAD = 3500;
  const PRECIO_CONTABILIDAD_DIAN = 2200;
  const PRECIO_ASAMBLEAS_IA = 1500;
  const PRECIO_RESIDENTES_PQRS = 1200;
  const PRECIO_RONDAS_SGSST = 1800;

  // Factor de descuento por volumen comercial (Escala para ciudadelas)
  const getDescuentoVolumen = (unidades: number) => {
    if (unidades >= 1500) return 0.25; // 25% de descuento para macro-ciudadelas (>1.500 unidades)
    if (unidades >= 800) return 0.18;  // 18% de descuento para agrupaciones grandes (800 - 1.499)
    if (unidades >= 300) return 0.10;  // 10% de descuento para conjuntos medianos (300 - 799)
    return 0.0;                        // Precio estándar (<300 unidades)
  };

  const factorDescuentoVolumen = getDescuentoVolumen(numUnidades);

  // Valor unitario nominal sin descuento
  const valorUnitarioNominal = 
    PRECIO_BASE_UNIDAD +
    (modulosCotizados.contabilidadDianNIIF ? PRECIO_CONTABILIDAD_DIAN : 0) +
    (modulosCotizados.asambleasVirtualesIA ? PRECIO_ASAMBLEAS_IA : 0) +
    (modulosCotizados.portalResidentesPQRS ? PRECIO_RESIDENTES_PQRS : 0) +
    (modulosCotizados.rondasSupervisionSGSST ? PRECIO_RONDAS_SGSST : 0);

  // Valor unitario final aplicando la escala de volumen
  const valorUnitarioTotal = Math.round(valorUnitarioNominal * (1 - factorDescuentoVolumen));

  const subtotalMensual = numUnidades * valorUnitarioTotal;
  // Descuento comercial por pago anual anticipado (12% OFF)
  const descuentoAnual = periodoFacturacion === 'anual' ? Math.round(subtotalMensual * 12 * 0.12) : 0;
  const totalCotizado = periodoFacturacion === 'anual' 
    ? (subtotalMensual * 12) - descuentoAnual 
    : subtotalMensual;

  // --- CONTROL DE SUSPENSIÓN AUTOMATIZADA POR MORA SAAS ---
  const handleToggleEstadoTenant = (tenantId: string) => {
    onUpdateTenants(prev => prev.map(t => {
      if (t.id === tenantId) {
        const esMoraOActivo = t.status === 'active' || t.status.includes('Activa') || t.status.includes('En Gracia');
        const nuevoEstado = esMoraOActivo ? 'Suspendida por Mora 🔴' : 'Activa 🟢';
        const nuevoFinancialStatus = esMoraOActivo ? 'En Mora' : 'Al Día';
        
        // Si se suspende por mora, se apagan los módulos operativos avanzados
        const updatedFeatureFlags = esMoraOActivo 
          ? { ...t.featureFlags, porteria: false, aseo: false, residente: false }
          : { ...t.featureFlags, porteria: true, aseo: true, residente: true };

        const detalleLog = esMoraOActivo
          ? `Suspención de servicio aplicada a "${t.name}" (Mora >30d). Feature flags degradados.`
          : `Servicio reactivado para "${t.name}". Licencia SaaS restaurada al 100%.`;

        onAppendAuditLog?.('SAAS_STATUS_OVERRIDE', detalleLog, 'Master Owner Root');
        onShowToast?.(esMoraOActivo 
          ? `⚠️ Copropiedad "${t.name}" SUSPENDIDA por mora. Módulos bloqueados.` 
          : `✅ Copropiedad "${t.name}" REACTIVADA con éxito.`
        );

        return {
          ...t,
          status: nuevoEstado as any,
          financialStatus: nuevoFinancialStatus as any,
          featureFlags: updatedFeatureFlags
        };
      }
      return t;
    }));
  };

  const copiarPropuestaComercial = () => {
    const porcentajeDescVolumen = Math.round(factorDescuentoVolumen * 100);
    const textoPropuesta = 
      `URBIX PH - PROPUESTA COMERCIAL SAAS ENTERPRISE\n` +
      `=================================================\n` +
      `Inmuebles calculados: ${numUnidades} unidades privadas\n` +
      `Modalidad: Plan ${periodoFacturacion.toUpperCase()}\n` +
      `Tarifa nominal unidad/mes: $${valorUnitarioNominal.toLocaleString()} COP\n` +
      `Descuento por volumen aplicado: ${porcentajeDescVolumen}%\n` +
      `Valor neto por unidad/mes: $${valorUnitarioTotal.toLocaleString()} COP\n` +
      `Módulos incluidos:\n` +
      ` - Citofonía & Portería QR: SÍ\n` +
      ` - Contabilidad NIIF & Exógena DIAN: ${modulosCotizados.contabilidadDianNIIF ? 'SÍ' : 'NO'}\n` +
      ` - Asambleas Virtuales con IA (Ley 675): ${modulosCotizados.asambleasVirtualesIA ? 'SÍ' : 'NO'}\n` +
      ` - App Residentes & PQRSD Ley 1755: ${modulosCotizados.portalResidentesPQRS ? 'SÍ' : 'NO'}\n` +
      ` - Rondas Vigilancia & SG-SST: ${modulosCotizados.rondasSupervisionSGSST ? 'SÍ' : 'NO'}\n` +
      `-------------------------------------------------\n` +
      `TOTAL INVERSIÓN: $${totalCotizado.toLocaleString()} COP ${periodoFacturacion === 'anual' ? '/ AÑO (Ahorro 12%)' : '/ MES'}\n` +
      `SLA Garantizado: 99.9% Uptime en la nube • Soporte Especializado en Medellín`;

    navigator.clipboard.writeText(textoPropuesta);
    onShowToast?.('📋 Propuesta comercial copiada al portapapeles con éxito.');
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* 1. SECCIÓN: COTIZADOR DINÁMICO DE SUSCRIPCIÓN SAAS */}
      <div className="bg-[#07090e] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest flex items-center gap-1.5 w-fit">
                <Sparkles className="w-3 h-3 text-cyan-300" /> Motor de Ventas &amp; MRR Escalable
              </span>
              <h3 className="text-base font-black text-white mt-1">Cotizador Dinámico de Precios por Unidades (Hasta 3.000 Inmuebles)</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#0b0f17] p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setPeriodoFacturacion('mensual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition ${
                periodoFacturacion === 'mensual' 
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.35)]' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pago Mensual
            </button>
            <button
              type="button"
              onClick={() => setPeriodoFacturacion('anual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition flex items-center gap-1 ${
                periodoFacturacion === 'anual' 
                  ? 'bg-emerald-400 text-slate-950 shadow-[0_0_12px_rgba(52,211,153,0.35)]' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Pago Anual <span className="text-[9px] bg-slate-950/40 text-slate-900 px-1 rounded font-black">-12%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controles de Configuración de Inmuebles y Módulos */}
          <div className="lg:col-span-7 space-y-5">
            {/* Control Deslizante de Unidades (Hasta 3.000 Unidades) */}
            <div className="bg-[#0b0f17] border border-slate-800 p-4 rounded-2xl space-y-3">
              <div className="flex flex-wrap justify-between items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Número de Apartamentos / Casas / Locales:</span>
                <div className="flex items-center gap-2">
                  {factorDescuentoVolumen > 0 && (
                    <span className="text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
                      -{Math.round(factorDescuentoVolumen * 100)}% Escala Volumen
                    </span>
                  )}
                  <span className="text-lg font-black text-cyan-400 font-mono bg-cyan-500/10 px-3 py-0.5 rounded-lg border border-cyan-500/30">
                    {numUnidades.toLocaleString()} Inmuebles
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="3000"
                step="10"
                value={numUnidades}
                onChange={(e) => setNumUnidades(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>10 (Boutique)</span>
                <span>300 (-10%)</span>
                <span>800 (-18%)</span>
                <span>1.500+ (-25% Ciudadela)</span>
                <span>3.000</span>
              </div>
            </div>

            {/* Checkboxes de Módulos Modulares */}
            <div className="bg-[#0b0f17] border border-slate-800 p-4 rounded-2xl space-y-3">
              <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider block">
                Selección de Módulos para la Cotización
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#07090e] border border-slate-800 text-slate-300 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={modulosCotizados.porteriaCitofonia}
                    disabled
                    className="accent-cyan-400 rounded"
                  />
                  <span>Citofonía &amp; Portería QR <strong className="text-[10px] text-cyan-400">(Core Base)</strong></span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#07090e] border border-slate-800 text-slate-300 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={modulosCotizados.contabilidadDianNIIF}
                    onChange={(e) => setModulosCotizados({ ...modulosCotizados, contabilidadDianNIIF: e.target.checked })}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Contabilidad NIIF &amp; Exógena DIAN</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#07090e] border border-slate-800 text-slate-300 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={modulosCotizados.asambleasVirtualesIA}
                    onChange={(e) => setModulosCotizados({ ...modulosCotizados, asambleasVirtualesIA: e.target.checked })}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Asambleas Virtuales con IA</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#07090e] border border-slate-800 text-slate-300 cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    checked={modulosCotizados.portalResidentesPQRS}
                    onChange={(e) => setModulosCotizados({ ...modulosCotizados, portalResidentesPQRS: e.target.checked })}
                    className="accent-cyan-400 rounded"
                  />
                  <span>App Residentes &amp; PQRSD Ley 1755</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#07090e] border border-slate-800 text-slate-300 cursor-pointer hover:border-slate-700 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={modulosCotizados.rondasSupervisionSGSST}
                    onChange={(e) => setModulosCotizados({ ...modulosCotizados, rondasSupervisionSGSST: e.target.checked })}
                    className="accent-cyan-400 rounded"
                  />
                  <span>Rondas de Vigilancia NFC, Toderos &amp; Bloqueo ARL SG-SST</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tarjeta de Liquidación de la Oferta */}
          <div className="lg:col-span-5 bg-gradient-to-b from-[#0b0f17] to-[#07090e] border border-cyan-500/40 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl">
            <div className="space-y-3">
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                Liquidación de Licenciamiento SaaS
              </span>
              <div className="text-3xl font-black text-white font-mono">
                ${totalCotizado.toLocaleString()} <span className="text-xs font-normal text-slate-400">COP</span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {periodoFacturacion === 'anual' ? 'Facturación anual unificada con 12% de descuento aplicado.' : 'Facturación mensual recurrente para la copropiedad.'}
              </p>

              <div className="bg-[#07090e] border border-slate-800 p-3 rounded-xl space-y-1.5 text-xs font-mono">
                {factorDescuentoVolumen > 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Tarifa nominal unidad/mes:</span>
                    <span className="line-through">${valorUnitarioNominal.toLocaleString()} COP</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Costo neto por apartamento/mes:</span>
                  <span className="text-cyan-300 font-bold">
                    ${valorUnitarioTotal.toLocaleString()} COP {factorDescuentoVolumen > 0 ? `(-${Math.round(factorDescuentoVolumen * 100)}%)` : ''}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal mensual ({numUnidades.toLocaleString()} u.):</span>
                  <span className="text-white">${subtotalMensual.toLocaleString()} COP</span>
                </div>
                {periodoFacturacion === 'anual' && (
                  <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
                    <span>Ahorro adicional por pago anual (-12%):</span>
                    <span>-${descuentoAnual.toLocaleString()} COP</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={copiarPropuestaComercial}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-400 hover:opacity-90 text-slate-950 font-black py-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)]"
            >
              <FileCheck className="w-4 h-4" /> Copiar Propuesta para Enviar a Administración
            </button>
          </div>
        </div>
      </div>

      {/* 2. SECCIÓN: GESTOR DE SUSPENSIÓN AUTOMATIZADA POR MORA SAAS */}
      <div className="bg-[#07090e] border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h4 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
              Control de Licenciamiento &amp; Suspensión por Mora (&gt;30 Días)
            </h4>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {tenants.length} Copropiedades Vinculadas
          </span>
        </div>

        <p className="text-xs text-slate-400">
          En cumplimiento de la cláusula de suspensión del contrato SaaS, si una copropiedad incurre en mora en el pago de su mensualidad, puedes suspender su servicio inmediatamente, restringiendo el acceso a la portería, aseo y app de residentes mientras se regulariza el pago.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {tenants.map((tenant) => {
            const estaActivo = tenant.status === 'active' || tenant.status.includes('Activa') || tenant.status.includes('En Gracia');
            return (
              <div
                key={tenant.id}
                className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                  estaActivo 
                    ? 'bg-[#0b0f17] border-slate-800' 
                    : 'bg-rose-950/20 border-rose-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-white">{tenant.name}</strong>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                      estaActivo 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {estaActivo ? 'Al Día' : 'Suspendido Mora'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono block mt-1">
                    Plan: {tenant.plan} • {tenant.unitsCount || 95} unidades
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">
                    {estaActivo ? 'Módulos Habilitados' : 'Bloqueo en Garita/App'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleEstadoTenant(tenant.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      estaActivo 
                        ? 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400' 
                        : 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                    {estaActivo ? 'Suspender por Mora' : 'Reactivar Servicio'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
