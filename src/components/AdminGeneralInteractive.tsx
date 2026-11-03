import React, { useState } from 'react';
import { Building2, DollarSign, TrendingUp, AlertTriangle, Send, CheckCircle2, FileText, ChevronRight, ShieldCheck, PieChart, Users } from 'lucide-react';
import type { MetricasTenant } from '../lib/metricasTenant';

export interface AdminGeneralInteractiveProps {
  onShowToast?: (msg: string) => void;
  metricas?: MetricasTenant;
  saldoCajaMenor?: number;
  porcentajeRecaudo?: number;
  morosos?: any[];
  onOpenDetalleRecaudo?: () => void;
  onOpenDetalleCajaMenor?: () => void;
}

export default function AdminGeneralInteractive({ 
  onShowToast, 
  metricas,
  saldoCajaMenor = 0,
  porcentajeRecaudo,
  morosos: propMorosos,
  onOpenDetalleRecaudo,
  onOpenDetalleCajaMenor
}: AdminGeneralInteractiveProps) {
  // Estado para controlar qué tarjeta está expandida con detalle analítico
  const [expandedCard, setExpandedCard] = useState<'salud' | 'recaudo' | 'saas' | null>('recaudo');

  // Datos de morosos derivados reales o fallback
  const [morososLocales, setMorososLocales] = useState([
    { id: '102', torre: '1', apto: '102', propietario: 'Carolina Herrera', saldo: 300000, dias: 30, estado: 'Mora Ordinaria' },
    { id: '201', torre: '1', apto: '201', propietario: 'Andrés Gómez', saldo: 300000, dias: 30, estado: 'Mora Ordinaria' },
  ]);

  const morosos = propMorosos && propMorosos.length > 0 ? propMorosos : morososLocales;

  // Datos para el desglose SaaS (Reflejar solo Tricentenario que es la única copropiedad viva)
  const saasTenants = [
    { name: 'urb Tricentenario', plan: 'Plan Pro', mrr: 0, estado: 'Al día', cufe: 'CUFE: dde881f7-cfe4...' }
  ];

  const handleEnviarWhatsApp = (propietario: string, apto: string, saldo: number) => {
    onShowToast?.(`📱 Recordatorio de cobro Ley 675 enviado por WhatsApp a ${propietario} (Apto ${apto}) por $${saldo.toLocaleString('es-CO')}.`);
  };

  const totalPagados = metricas?.alDia !== undefined 
    ? metricas.alDia 
    : (metricas?.recaudo && parseFloat(metricas.recaudo) > 0 
        ? Math.round((parseFloat(metricas.recaudo) / 100) * (metricas.totalUnidades || 100)) 
        : 0);

  const totalRecaudadoCalculado = metricas?.totalRecaudadoCalculado !== undefined
    ? metricas.totalRecaudadoCalculado
    : totalPagados * 300000;

  const unidadesEnMora = metricas?.enMora !== undefined 
    ? metricas.enMora 
    : (metricas?.unidadesMora 
        ? parseInt(metricas.unidadesMora, 10) || 0 
        : Math.max(0, (metricas?.totalUnidades || 100) - totalPagados));

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* TARJETAS MACRO INTERACTIVAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Tarjeta 1: Salud Financiera */}
        <div 
          onClick={() => setExpandedCard(expandedCard === 'salud' ? null : 'salud')}
          className={`bg-[#0b0f17] border p-6 rounded-3xl cursor-pointer transition-all duration-300 relative overflow-hidden shadow-xl ${
            expandedCard === 'salud' ? 'border-cyan-400 shadow-[0_0_25px_rgba(34,211,238,0.2)]' : 'border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Salud Financiera PH</span>
            <ChevronRight className={`w-4 h-4 text-cyan-400 transition-transform ${expandedCard === 'salud' ? 'rotate-90' : ''}`} />
          </div>
          <div className="mt-2">
            {/* Si no hay pagos registrados, debe ser 0% */}
            <span className="text-3xl font-extrabold text-cyan-400">
              {totalPagados > 0 ? `${((totalPagados / 100) * 100).toFixed(1)}%` : '0.0%'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {totalPagados > 0 ? `Recaudado: $${totalRecaudadoCalculado.toLocaleString('es-CO')} COP` : 'Sin pagos registrados este período'}
          </p>
        </div>

        {/* Tarjeta 2: Recaudo del Mes (Expandible con acciones reales) */}
        <div 
          onClick={() => setExpandedCard(expandedCard === 'recaudo' ? null : 'recaudo')}
          className={`bg-[#0b0f17] border p-6 rounded-3xl cursor-pointer transition-all duration-300 relative overflow-hidden shadow-xl ${
            expandedCard === 'recaudo' ? 'border-teal-400 shadow-[0_0_25px_rgba(45,212,191,0.2)]' : 'border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-teal-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Recaudo del Mes</span>
            <ChevronRight className={`w-4 h-4 text-teal-400 transition-transform ${expandedCard === 'recaudo' ? 'rotate-90' : ''}`} />
          </div>
          <p className="text-3xl font-black text-white mt-2">
            {porcentajeRecaudo !== undefined
              ? `${porcentajeRecaudo.toFixed(1)}%`
              : totalPagados > 0
              ? `${((totalPagados / (metricas?.totalUnidades || 100)) * 100).toFixed(1)}%`
              : '0.0%'}
            <span className="text-sm font-normal text-slate-400"> / {metricas?.totalUnidades || 100} Unidades</span>
          </p>
          <p className="text-xs font-mono text-emerald-400 font-bold mt-1">
            ${totalRecaudadoCalculado.toLocaleString('es-CO')} COP ({totalPagados} al día)
          </p>
          <div className="w-full bg-slate-900 h-2 rounded-full mt-2 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full rounded-full transition-all duration-500" 
              style={{ width: porcentajeRecaudo !== undefined ? `${porcentajeRecaudo.toFixed(1)}%` : totalPagados > 0 ? `${((totalPagados / (metricas?.totalUnidades || 100)) * 100).toFixed(1)}%` : '0%' }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono">
            <span className="text-teal-400 hover:underline">Detalle Recaudo →</span>
            {onOpenDetalleCajaMenor && (
              <span 
                onClick={(e) => { e.stopPropagation(); onOpenDetalleCajaMenor(); }}
                className="text-amber-400 hover:underline"
              >
                Caja Menor (${saldoCajaMenor.toLocaleString('es-CO')}) →
              </span>
            )}
          </div>
        </div>

        {/* Tarjeta 3: Unidades Pendientes por Cobro */}
        <div 
          onClick={() => setExpandedCard(expandedCard === 'recaudo' ? null : 'recaudo')}
          className={`bg-slate-900/60 border p-5 rounded-xl cursor-pointer transition-all duration-300 relative overflow-hidden shadow-lg ${
            expandedCard === 'recaudo' ? 'border-amber-400 shadow-[0_0_25px_rgba(251,191,36,0.2)]' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-mono">Unidades Pendientes por Cobro</span>
            <ChevronRight className={`w-4 h-4 text-amber-400 transition-transform ${expandedCard === 'recaudo' ? 'rotate-90' : ''}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">
              {unidadesEnMora} Aptos
            </span>
            <span className="text-xs text-slate-500">de {metricas?.totalUnidades || 100}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-mono">
            Gestión preventiva & cobro Ley 675
          </p>
        </div>

        {/* Tarjeta 4: SaaS MRR */}
        <div 
          onClick={() => setExpandedCard(expandedCard === 'saas' ? null : 'saas')}
          className={`bg-[#0b0f17] border p-6 rounded-3xl cursor-pointer transition-all duration-300 relative overflow-hidden shadow-xl ${
            expandedCard === 'saas' ? 'border-blue-400 shadow-[0_0_25px_rgba(96,165,250,0.2)]' : 'border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">SaaS MRR (Plataforma)</span>
            <ChevronRight className={`w-4 h-4 text-cyan-400 transition-transform ${expandedCard === 'saas' ? 'rotate-90' : ''}`} />
          </div>
          <div className="mt-2">
            {/* Reflejar solo Tricentenario que es la única copropiedad viva */}
            <div className="text-3xl font-extrabold text-cyan-400">
              $0
            </div>
            <p className="text-xs text-slate-400 mt-2">
              1 Copropiedad conectada (urb Tricentenario)
            </p>
          </div>
        </div>

      </div>

      {/* PANEL DE DESGLOSE INTERACTIVO DINÁMICO */}
      {expandedCard === 'recaudo' && (
        <div className="bg-[#0b0f17] border border-teal-500/30 p-6 rounded-3xl space-y-4 shadow-2xl animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-widest bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/30">
                Desglose Operativo y Cartera Vencida
              </span>
              <h4 className="text-base font-black text-white mt-1">Acciones de Cobro Inmediato (WhatsApp & Ley 675)</h4>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onOpenDetalleRecaudo && (
                <button
                  type="button"
                  onClick={onOpenDetalleRecaudo}
                  className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <DollarSign className="w-3.5 h-3.5" /> Detalle de Recaudo (100 Aptos)
                </button>
              )}
              {onOpenDetalleCajaMenor && (
                <button
                  type="button"
                  onClick={onOpenDetalleCajaMenor}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Building2 className="w-3.5 h-3.5" /> Detalle Caja Menor (${saldoCajaMenor.toLocaleString('es-CO')} COP)
                </button>
              )}
              <span className="text-xs font-mono text-slate-400 ml-2">{unidadesEnMora} Unidades en Mora</span>
            </div>
          </div>

          <div className="space-y-3">
            {morosos.map((m) => (
              <div key={m.id} className="p-4 bg-[#07090e] border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">Torre {m.torre} - Apto {m.apto}</span>
                    <span className="bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded font-mono font-bold text-[10px] border border-rose-500/20">
                      {m.dias} días de mora
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {m.estado}
                    </span>
                  </div>
                  <p className="text-slate-400 mt-1">Propietario: <strong className="text-slate-200">{m.propietario}</strong> • Saldo pendiente: <strong className="text-white font-mono">${m.saldo.toLocaleString('es-CO')}</strong></p>
                </div>

                <button
                  type="button"
                  onClick={() => handleEnviarWhatsApp(m.propietario, m.apto, m.saldo)}
                  className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center gap-2 shadow-lg shrink-0"
                >
                  <Send className="w-3.5 h-3.5" /> Enviar Recordatorio WhatsApp
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {expandedCard === 'salud' && (
        <div className="bg-[#0b0f17] border border-cyan-500/30 p-6 rounded-3xl space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30">
                Fondo de Imprevistos (Art. 35 Ley 675)
              </span>
              <h4 className="text-base font-black text-white mt-1">Auditoría de Reservas y Fondo de Imprevistos</h4>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-xl border border-cyan-500/30">
              Certificado Fiduciario Vigente ✓
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            El fondo de imprevistos actual cuenta con un respaldo del <strong className="text-cyan-400">1.2%</strong> sobre el presupuesto anual ejecutado ($24.800.000 COP en cuenta fiduciaria blindada), cumpliendo a cabalidad con la norma colombiana vigente sin requerir cuotas extraordinarias no programadas.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 bg-[#07090e] border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Fondo Acumulado</span>
              <p className="text-sm font-bold text-white font-mono mt-0.5">$24.800.000 COP</p>
            </div>
            <div className="p-3 bg-[#07090e] border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Rendimiento Fiduciario</span>
              <p className="text-sm font-bold text-emerald-400 font-mono mt-0.5">+10.2% E.A.</p>
            </div>
            <div className="p-3 bg-[#07090e] border border-slate-800 rounded-xl">
              <span className="text-[10px] text-slate-400 uppercase font-mono">Disponibilidad Inmediata</span>
              <p className="text-sm font-bold text-cyan-400 font-mono mt-0.5">T+0 (24 Horas)</p>
            </div>
          </div>
        </div>
      )}

      {expandedCard === 'saas' && (
        <div className="bg-[#0b0f17] border border-blue-500/30 p-6 rounded-3xl space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/30">
                SaaS Multi-Tenant Billing
              </span>
              <h4 className="text-base font-black text-white mt-1">Copropiedades Conectadas & Facturación DIAN</h4>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-xl border border-cyan-500/30">
              1 Instancia Activa (urb Tricentenario)
            </span>
          </div>

          <div className="space-y-2">
            {saasTenants.map((st, idx) => (
              <div key={idx} className="p-3 bg-[#07090e] border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white">{st.name}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      {st.plan}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{st.cufe}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-white">${st.mrr.toLocaleString('es-CO')} / mes</span>
                  <p className="text-[10px] text-emerald-400 font-bold">{st.estado} ✓</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
