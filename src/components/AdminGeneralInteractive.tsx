import React, { useState } from 'react';
import { Building2, DollarSign, TrendingUp, AlertTriangle, Send, CheckCircle2, FileText, ChevronRight, ShieldCheck, PieChart, Users } from 'lucide-react';

export interface AdminGeneralInteractiveProps {
  onShowToast?: (msg: string) => void;
}

export default function AdminGeneralInteractive({ onShowToast }: AdminGeneralInteractiveProps) {
  // Estado para controlar qué tarjeta está expandida con detalle analítico
  const [expandedCard, setExpandedCard] = useState<'salud' | 'recaudo' | 'saas' | null>('recaudo');

  // Datos simulados de morosos para la acción de WhatsApp
  const [morosos, setMorosos] = useState([
    { id: '102', torre: '1', apto: '102', propietario: 'Carolina Herrera', saldo: 420000, dias: 45, estado: 'Mora Ordinaria' },
    { id: '201', torre: '1', apto: '201', propietario: 'Andrés Gómez', saldo: 1260000, dias: 90, estado: 'Cobro Jurídico (Art. 48)' },
  ]);

  // Datos para el desglose SaaS
  const saasTenants = [
    { name: 'P.H. Reserva del Tesoro', plan: 'Plan Enterprise', mrr: 650000, estado: 'Al día', cufe: 'cufe_9041a' },
    { name: 'Edificio Torre El Poblado', plan: 'Plan Estándar', mrr: 450000, estado: 'Al día', cufe: 'cufe_8f92b' },
    { name: 'C.C. San Diego (Locales)', plan: 'Plan Plus', mrr: 280000, estado: 'Al día', cufe: 'cufe_3d71c' },
  ];

  const handleEnviarWhatsApp = (propietario: string, apto: string, saldo: number) => {
    onShowToast?.(`📱 Recordatorio de cobro Ley 675 enviado por WhatsApp a ${propietario} (Apto ${apto}) por $${saldo.toLocaleString('es-CO')}.`);
  };

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* TARJETAS MACRO INTERACTIVAS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
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
          <p className="text-3xl font-black text-cyan-400 mt-2">94.5%</p>
          <p className="text-xs text-slate-400 mt-2">Indicador óptimo bajo Ley 675</p>
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
          <p className="text-3xl font-black text-white mt-2">$48.5M <span className="text-sm font-normal text-slate-400">/ $52M</span></p>
          <div className="w-full bg-slate-900 h-2 rounded-full mt-3 overflow-hidden border border-slate-800">
            <div className="bg-gradient-to-r from-teal-500 to-cyan-400 h-full rounded-full w-[93%]" />
          </div>
        </div>

        {/* Tarjeta 3: SaaS MRR */}
        <div 
          onClick={() => setExpandedCard(expandedCard === 'saas' ? null : 'saas')}
          className={`bg-[#0b0f17] border p-6 rounded-3xl cursor-pointer transition-all duration-300 relative overflow-hidden shadow-xl ${
            expandedCard === 'saas' ? 'border-blue-400 shadow-[0_0_25px_rgba(96,165,250,0.2)]' : 'border-slate-800/80 hover:border-slate-700'
          }`}
        >
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">SaaS MRR (Plataforma)</span>
            <ChevronRight className={`w-4 h-4 text-blue-400 transition-transform ${expandedCard === 'saas' ? 'rotate-90' : ''}`} />
          </div>
          <p className="text-3xl font-black text-blue-400 mt-2">$1.380.000</p>
          <p className="text-xs text-slate-400 mt-2">3 Copropiedades conectadas</p>
        </div>

      </div>

      {/* PANEL DE DESGLOSE INTERACTIVO DINÁMICO */}
      {expandedCard === 'recaudo' && (
        <div className="bg-[#0b0f17] border border-teal-500/30 p-6 rounded-3xl space-y-4 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono font-bold text-teal-400 uppercase tracking-widest bg-teal-500/10 px-2.5 py-0.5 rounded border border-teal-500/30">
                Desglose Operativo y Cartera Vencida
              </span>
              <h4 className="text-base font-black text-white mt-1">Acciones de Cobro Inmediato (WhatsApp & Ley 675)</h4>
            </div>
            <span className="text-xs font-mono text-slate-400">{morosos.length} Unidades en Mora</span>
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
            <span className="text-xs font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-xl border border-blue-500/30">
              3 Instancias Activas
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
