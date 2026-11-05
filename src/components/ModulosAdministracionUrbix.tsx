import React, { useState } from 'react';
import { MessageSquare, FileText, HardHat, DollarSign, Wrench, Shield, Users, Building2, AlertOctagon, ShieldAlert } from 'lucide-react';
import WhatsAppConfigCard from './WhatsAppConfigCard';
import ModuloTesoreriaOCR from './ModuloTesoreriaOCR';
import ModuloTesoreriaExogenaReal from './ModuloTesoreriaExogenaReal';
import ModuloMantenimientoReal from './ModuloMantenimientoReal';
import TarjetonVotacionReal from './TarjetonVotacionReal';
import CobranzaPrejuridicaYPazYSalvos from './CobranzaPrejuridicaYPazYSalvos';

export default function ModulosAdministracionUrbix({
  tenantId = '22079bb5-6ac7-4a15-be89-c53d14e4221b',
  tenantName = 'Reserva del Tesoro',
  onShowToast
}: {
  tenantId?: string;
  tenantName?: string;
  onShowToast?: (msg: string) => void;
}) {
  const [subModuloActivo, setSubModuloActivo] = useState<string>('general');
  const activeTenantId = tenantId;

  // Lista oficial de submódulos en la barra horizontal
  const submódulosLista = [
    { id: 'general', label: 'Vista General', icon: Building2 },
    { id: 'asambleas', label: '2. Asambleas & Actas Legales', icon: Users },
    { id: 'contratistas', label: '3. Contratistas & Obras (SG-SST)', icon: HardHat },
    { id: 'tesoreria', label: '4. Tesorería, OCR & DIAN', icon: DollarSign },
    { id: 'cartera', label: '5. Cobro Prejurídico & Acuerdos', icon: AlertOctagon },
    { id: 'mantenimiento', label: '6. Mantenimiento & Órdenes', icon: Wrench },
    { id: 'pqrsd', label: '7. PQRSD & Términos Legales', icon: ShieldAlert },
    { id: 'personal', label: '8. Personal & Staff', icon: Users },
    { id: 'whatsapp', label: '9. WhatsApp Notificaciones', icon: MessageSquare },
  ];

  return (
    <div className="space-y-6 font-sans text-slate-100">
      
      {/* BARRA DE NAVEGACIÓN HORIZONTAL DINÁMICA (SCROLL FLUIDO) */}
      <div className="bg-[#0F172A] border border-slate-800 p-2.5 rounded-2xl shadow-xl">
        <div className="urbix-tabs-scrollbar flex items-center gap-2 overflow-x-auto py-1 px-1">
          {submódulosLista.map((mod) => {
            const IconComponent = mod.icon;
            const isActive = subModuloActivo === mod.id;
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => setSubModuloActivo(mod.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer pointer-events-auto border whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.25)]'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700 hover:bg-slate-800'
                }`}
              >
                <IconComponent className={`w-4 h-4 ${isActive ? 'text-cyan-300' : 'text-slate-400'}`} />
                <span>{mod.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* RENDERIZADO PRINCIPAL */}
      <div className="mt-6 transition-all duration-300">
        {subModuloActivo === 'asambleas' && (
          <TarjetonVotacionReal
            tenantId={activeTenantId}
            userProfile={{
              full_name: 'Administración / Copropietario',
              unit_number: 'Apto 101',
              coefficient: 1.05,
              role: 'admin'
            }}
            onShowToast={onShowToast}
          />
        )}

        {subModuloActivo === 'tesoreria' && (
          <div className="space-y-6">
            <ModuloTesoreriaOCR
              tenantId={activeTenantId}
              tenantName={tenantName}
              onShowToast={onShowToast}
            />
            <ModuloTesoreriaExogenaReal
              tenantId={activeTenantId}
              onShowToast={onShowToast}
            />
          </div>
        )}

        {/* MÓDULO INDEPENDIENTE ARRIBA */}
        {subModuloActivo === 'cartera' && (
          <CobranzaPrejuridicaYPazYSalvos
            tenantId={activeTenantId}
            tenantName={tenantName}
            onShowToast={onShowToast}
          />
        )}

        {subModuloActivo === 'mantenimiento' && (
          <ModuloMantenimientoReal
            tenantId={activeTenantId}
            onShowToast={onShowToast}
          />
        )}

        {subModuloActivo === 'pqrsd' && (
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Bandeja Oficial PQRSD &amp; Términos Legales (Ley 1755 / Ley 675)</h3>
                  <p className="text-xs text-slate-400 font-mono">Control de vencimientos en días hábiles, radicación y respuestas oficiales</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-mono font-bold">
                  ⚖️ Ley 1755 de 2015
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Peticiones de Interés General</span>
                <p className="text-xl font-black text-cyan-400 font-mono">15 Días Hábiles</p>
                <p className="text-[10px] text-slate-500">Término estándar de respuesta obligatoria</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Peticiones de Información / Copias</span>
                <p className="text-xl font-black text-amber-400 font-mono">10 Días Hábiles</p>
                <p className="text-[10px] text-slate-500">Expedición de actas, presupuestos o estados de cuenta</p>
              </div>
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Consultas Técnicas y Jurídicas</span>
                <p className="text-xl font-black text-purple-400 font-mono">30 Días Hábiles</p>
                <p className="text-[10px] text-slate-500">Conceptos del Consejo de Administración o revisoría</p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span>ESTADO DEL SISTEMA PQRSD:</span>
                <span className="text-emerald-400 font-bold">0 Tutelas • 100% Notificaciones a Tiempo</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Los radicados remitidos por copropietarios a través del portal de residentes se gestionan con trazabilidad inmutable y sello de tiempo.
              </p>
            </div>
          </div>
        )}

        {subModuloActivo === 'whatsapp' && (
          <WhatsAppConfigCard tenantName={tenantName} onShowToast={onShowToast} />
        )}

        {!['asambleas', 'cartera', 'mantenimiento', 'tesoreria', 'pqrsd', 'whatsapp'].includes(subModuloActivo) && (
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-8 text-center text-slate-400 font-mono text-xs shadow-xl">
            Panel operativo del submódulo: <strong className="text-cyan-300 uppercase">{subModuloActivo}</strong> activo y sincronizado.
          </div>
        )}
      </div>

    </div>
  );
}
